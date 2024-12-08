// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFhbnZyIiwiYSI6ImNtNGNsbG84cTBkNjMyanM4MXQ1ZWZxc2EifQ.iCjSlHOyb7RfWeznDyNLKg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

// Handle map style changes
document.getElementById('style-selector').addEventListener('change', function() {
    const selectedStyle = this.value;
    map.setStyle(selectedStyle);
});

// Add map controls
map.addControl(new mapboxgl.NavigationControl());

// Function to handle the fetch operation
async function fetchUserData() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        console.log('Please enter a Wikimedia username.');
        return;
    }

    let loadedImages = 0;
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';

    try {
        // Fetch user's contributions
        const url = `https://commons.wikimedia.org/w/api.php?action=query&list=allimages&aiuser=${encodeURIComponent(username)}&aisort=timestamp&ailimit=500&format=json&origin=*`;
        console.log('Fetching from URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Response:', data);

        const images = data.query?.allimages || [];
        console.log('Found images:', images.length);
        const locations = [];

        // Batch process images in groups of 50
        for (let i = 0; i < images.length; i += 50) {
            const batch = images.slice(i, i + 50);
            const titles = batch.map(img => img.title).join('|');
            
            const metadataUrl = `https://commons.wikimedia.org/w/api.php?action=wbgetentities&titles=${encodeURIComponent(titles)}&sites=commonswiki&props=claims|descriptions|labels&format=json&origin=*`;
            console.log('Fetching metadata batch from:', metadataUrl);
            const fileResponse = await fetch(metadataUrl);
            const fileData = await fileResponse.json();
            console.log('Metadata batch response:', fileData);

            const entities = Object.values(fileData.entities || {});
            for (const entity of entities) {
                loadedImages++;
                document.getElementById('loading-text').innerHTML = `Loading images: ${loadedImages} of ${images.length}`;
                
                const title = entity.title || entity.id;
                const thumbUrl = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;

                // Process camera location
                const cameraLocation = entity.statements?.P1259?.[0]?.mainsnak?.datavalue?.value;
                if (cameraLocation) {
                    const lat = parseFloat(cameraLocation.latitude);
                    const lon = parseFloat(cameraLocation.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        locations.push({
                            lat: lat,
                            lon: lon,
                            title,
                            thumbUrl,
                            type: 'camera'
                        });
                    }
                }

                // Process object location
                const objectLocation = entity.statements?.P9149?.[0]?.mainsnak?.datavalue?.value;
                if (objectLocation) {
                    const lat = parseFloat(objectLocation.latitude);
                    const lon = parseFloat(objectLocation.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        locations.push({
                            lat: lat,
                            lon: lon,
                            title,
                            thumbUrl,
                            type: 'object'
                        });
                    }
                }


            }
        }

        // Remove existing layers and sources
        if (map.getLayer('object-locations')) map.removeLayer('object-locations');
        if (map.getLayer('camera-locations')) map.removeLayer('camera-locations');
        if (map.getSource('photos')) map.removeSource('photos');

        // Convert locations to GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: locations.map(location => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [location.lon, location.lat]
                },
                properties: {
                    title: location.title,
                    thumbUrl: location.thumbUrl,
                    type: location.type || 'non'
                }
            }))
        };

        // Add the GeoJSON source
        map.addSource('photos', {
            type: 'geojson',
            data: geojson
        });

        // Add the object locations layer
        map.addLayer({
            'id': 'object-locations',
            'type': 'circle',
            'source': 'photos',
            'filter': ['==', ['get', 'type'], 'object'],
            'paint': {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    2, 3,
                    8, 5,
                    16, 7
                ],
                'circle-color': '#a34231',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add the camera locations layer (on top)
        map.addLayer({
            'id': 'camera-locations',
            'type': 'circle',
            'source': 'photos',
            'filter': ['==', ['get', 'type'], 'camera'],
            'paint': {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    2, 3,
                    8, 5,
                    16, 7
                ],
                'circle-color': '#6b1b1b',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add hover state
        let hoverPopup = null;
        
        map.on('mouseenter', ['object-locations', 'camera-locations'], (e) => {
            map.getCanvas().style.cursor = 'pointer';
            
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            
            if (properties.thumbUrl) {
                hoverPopup = new mapboxgl.Popup({
                    offset: 5,
                    closeButton: false,
                    className: 'hover-popup'
                })
                .setLngLat(coordinates)
                .setHTML(`
                    <div class="popup-image">
                        <img src="${properties.thumbUrl.replace(/wikipedia\/commons\/([a-z0-9]\/[a-z0-9]{2})\//, 'wikipedia/commons/thumb/$1/')}/300px-${properties.title.replace('File:', '')}" alt="${properties.title}">
                    </div>
                `)
                .addTo(map);
            }
        });

        map.on('mouseleave', ['object-locations', 'camera-locations'], () => {
            map.getCanvas().style.cursor = '';
            if (hoverPopup) {
                hoverPopup.remove();
                hoverPopup = null;
            }
        });

        // Handle clicks
        map.on('click', ['object-locations', 'camera-locations'], (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            
            console.log('Clicked feature:', {
                coordinates: coordinates,
                properties: properties,
                layer: e.features[0].layer.id
            });
            
            // Remove any existing popups
            const existingPopups = document.getElementsByClassName('mapboxgl-popup');
            Array.from(existingPopups).forEach(popup => popup.remove());
            
            const popupContent = `
                <div class="popup-content">
                    <h3>${properties.title.replace('File:', '')}</h3>
                    ${properties.thumbUrl ? `
                        <div class="popup-image">
                            <img src="${properties.thumbUrl.replace(/wikipedia\/commons\/([a-z0-9]\/[a-z0-9]{2})\//, 'wikipedia/commons/thumb/$1/')}/300px-${properties.title.replace('File:', '')}" alt="${properties.title}">
                        </div>
                    ` : ''}
                    <div class="popup-footer">
                        <a href="https://commons.wikimedia.org/wiki/${encodeURIComponent(properties.title)}" 
                           target="_blank" rel="noopener noreferrer"
                           class="commons-link">
                           View on Wikimedia Commons
                        </a>
                    </div>
                </div>
            `;

            new mapboxgl.Popup({
                offset: 5,
                className: 'custom-popup',
                closeOnClick: false
            })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });

        // Add click handler to map to close popups
        map.on('click', (e) => {
            // Only close popups if we didn't click a feature
            if (!map.queryRenderedFeatures(e.point, { layers: ['object-locations', 'camera-locations'] }).length) {
                const existingPopups = document.getElementsByClassName('mapboxgl-popup');
                Array.from(existingPopups).forEach(popup => popup.remove());
            }
        });

        // Update stats
        const statsDiv = document.getElementById('stats');
        statsDiv.innerHTML = `User: ${username} | Images: ${images.length} | Located: ${locations.length}`;
        statsDiv.style.display = 'block';

        if (locations.length) {
            // Calculate bounds of all markers
            const bounds = new mapboxgl.LngLatBounds();
            locations.forEach(location => {
                bounds.extend([location.lon, location.lat]);
            });
            
            // Fit map to bounds with padding
            map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 16
            });
        } else {
            console.log('No geotagged images found for this user.');
            statsDiv.innerHTML += '<br>No geotagged images found.';
            statsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').innerHTML = 'Error fetching data. Please try again.';
    } finally {
        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';
    }
}

// Focus the input box on page load
window.onload = () => {
    document.getElementById('username').focus();
};

// Add click event listener
document.getElementById('fetch').addEventListener('click', fetchUserData);

// Add enter key event listener
document.getElementById('username').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        fetchUserData();
    }
});
