export const CONFIG = {
    mapboxToken: 'pk.eyJ1IjoiZGFhbnZyIiwiYSI6ImNtNGNsbG84cTBkNjMyanM4MXQ1ZWZxc2EifQ.iCjSlHOyb7RfWeznDyNLKg',
    mapDefaults: {
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 2
    },
    apiEndpoints: {
        commons: 'https://commons.wikimedia.org/w/api.php'
    }
};

export const LOCATION_TYPES = {
    CAMERA: 'camera',
    OBJECT: 'object'
};

export const LAYER_STYLES = {
    camera: {
        color: '#6b1b1b',
        radius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 3,
            8, 5,
            16, 7
        ]
    },
    object: {
        color: '#a34231',
        radius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 3,
            8, 5,
            16, 7
        ]
    }
};
