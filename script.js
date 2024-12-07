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
            
            const metadataUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=extmetadata|url&format=json&origin=*`;
            console.log('Fetching metadata batch from:', metadataUrl);
            const fileResponse = await fetch(metadataUrl);
            const fileData = await fileResponse.json();
            console.log('Metadata batch response:', fileData);

            const pages = Object.values(fileData.query?.pages || {});
            for (const page of pages) {
                const metadata = page.imageinfo?.[0]?.extmetadata || {};
                loadedImages++;
                document.getElementById('loading-text').innerHTML = `Loading images: ${loadedImages} of ${images.length}`;
                
                // Extract camera location
                let cameraLat, cameraLon;
                if (metadata.GPSLatitude?.value && metadata.GPSLongitude?.value) {
                    cameraLat = parseFloat(metadata.GPSLatitude.value.replace(/[^\d.-]/g, ''));
                    cameraLon = parseFloat(metadata.GPSLongitude.value.replace(/[^\d.-]/g, ''));
                }

                // Extract object location
                let objectLat, objectLon;
                if (metadata.GPSDestLatitude?.value && metadata.GPSDestLongitude?.value) {
                    objectLat = parseFloat(metadata.GPSDestLatitude.value.replace(/[^\d.-]/g, ''));
                    objectLon = parseFloat(metadata.GPSDestLongitude.value.replace(/[^\d.-]/g, ''));
                }

                const title = page.title;
                const thumbUrl = page.imageinfo?.[0]?.url;

                if (!isNaN(cameraLat) && !isNaN(cameraLon)) {
                    locations.push({ lat: cameraLat, lon: cameraLon, title, thumbUrl, type: 'camera' });
                }

                if (!isNaN(objectLat) && !isNaN(objectLon)) {
                    locations.push({ lat: objectLat, lon: objectLon, title, thumbUrl, type: 'object' });
                } else if (metadata.Coordinates?.value) {
                    console.log('Found Coordinates field:', metadata.Coordinates.value);
                    // Try to parse coordinates in format "XX.XXX; YY.YYY"
                    const coords = metadata.Coordinates.value.split(';').map(c => parseFloat(c.trim()));
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        const [lat, lon] = coords;
                        const title = page.title;
                        const thumbUrl = page.imageinfo?.[0]?.url;
                        console.log('Parsed coordinates:', lat, lon);
                        locations.push({ lat, lon, title, thumbUrl });
                    }
                }
            }
        }

        // Clear existing markers
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

        // Add new markers
        locations.forEach(location => {
            // Create a popup but don't add it to the marker yet
            const popup = new mapboxgl.Popup({ 
                offset: 25, 
                className: 'custom-popup',
                closeOnClick: false
            }).setHTML(`
                <div class="popup-content">
                    <h3>${location.title.replace('File:', '')}</h3>
                    ${location.thumbUrl ? `
                        <div class="popup-image">
                            <img src="${location.thumbUrl.replace(/(\d+)px-/, '300px-')}" alt="${location.title}">
                        </div>
                    ` : ''}
                    <div class="popup-footer">
                        <a href="https://commons.wikimedia.org/wiki/${encodeURIComponent(location.title)}" 
                           target="_blank" rel="noopener noreferrer"
                           class="commons-link">
                           View on Wikimedia Commons
                        </a>
                    </div>
                </div>
            `);

            const markerColor = location.type === 'camera' ? '#0078d4' : '#d40000';
            const marker = new mapboxgl.Marker({ color: markerColor })
                .setLngLat([location.lon, location.lat])
                .addTo(map);
                
            // Add hover functionality
            const markerElement = marker.getElement();
            let hoverPopup = null;

            markerElement.addEventListener('mouseenter', () => {
                hoverPopup = new mapboxgl.Popup({ offset: 25, closeButton: false })
                    .setLngLat([location.lon, location.lat])
                    .setHTML(`<div class="hover-popup">${location.title.replace('File:', '')}</div>`)
                    .addTo(map);
            });

            markerElement.addEventListener('mouseleave', () => {
                if (hoverPopup) {
                    hoverPopup.remove();
                    hoverPopup = null;
                }
            });

            // Add click functionality
            markerElement.addEventListener('click', () => {
                // Remove any existing popups
                const existingPopups = document.getElementsByClassName('mapboxgl-popup');
                Array.from(existingPopups).forEach(popup => popup.remove());
                
                // Add the full popup
                popup.setLngLat([location.lon, location.lat]).addTo(map);
            });
        });

        // Update stats
        const statsDiv = document.getElementById('stats');
        statsDiv.innerHTML = `User: ${username} | Images: ${images.length} | Located: ${locations.length}`;

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
