// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFhbnZyIiwiYSI6ImNtNGNsbG84cTBkNjMyanM4MXQ1ZWZxc2EifQ.iCjSlHOyb7RfWeznDyNLKg';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

// Add map controls
map.addControl(new mapboxgl.NavigationControl());

document.getElementById('fetch').addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        console.log('Please enter a Wikimedia username.');
        return;
    }

    try {
        // Fetch user's contributions
        const url = `https://commons.wikimedia.org/w/api.php?action=query&list=allimages&aiuser=${encodeURIComponent(username)}&ailimit=500&format=json&origin=*`;
        const response = await fetch(url);
        const data = await response.json();

        const images = data.query?.allimages || [];
        const locations = [];

        // Process each image
        for (const image of images) {
            const fileTitle = image.title;
            const metadataUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=extmetadata|url&format=json&origin=*`;
            const fileResponse = await fetch(metadataUrl);
            const fileData = await fileResponse.json();

            const pages = Object.values(fileData.query.pages);
            for (const page of pages) {
                const metadata = page.imageinfo?.[0]?.extmetadata || {};
                if (metadata.GPSLatitude && metadata.GPSLongitude) {
                    const lat = parseFloat(metadata.GPSLatitude.value);
                    const lon = parseFloat(metadata.GPSLongitude.value);
                    const title = page.title;
                    const thumbUrl = page.imageinfo?.[0]?.url;

                    locations.push({ lat, lon, title, thumbUrl });
                }
            }
        }

        // Clear existing markers
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

        // Add new markers
        locations.forEach(location => {
            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                    <h3>${location.title}</h3>
                    ${location.thumbUrl ? `<img src="${location.thumbUrl}" style="max-width:200px;">` : ''}
                `);

            new mapboxgl.Marker()
                .setLngLat([location.lon, location.lat])
                .setPopup(popup)
                .addTo(map);
        });

        if (locations.length) {
            map.flyTo({ center: [locations[0].lon, locations[0].lat], zoom: 10 });
        } else {
            console.log('No geotagged images found for this user.');
        }
    } catch (error) {
        console.error('Error:', error);
        console.log('Error fetching data. Please try again.');
    }
});
