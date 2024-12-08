import { CONFIG, LAYER_STYLES } from './config.js';
import { PopupManager } from './popupManager.js';

export class MapHandler {
    #map;
    #popupManager;
    constructor(container) {
        mapboxgl.accessToken = CONFIG.mapboxToken;
        this.map = new mapboxgl.Map({
            container: container,
            style: CONFIG.mapDefaults.style,
            center: CONFIG.mapDefaults.center,
            zoom: CONFIG.mapDefaults.zoom
        });
        
        this.map.addControl(new mapboxgl.NavigationControl());
        this.setupStyleSelector();
        this.#popupManager = new PopupManager(this.map);
    }

    setupStyleSelector() {
        document.getElementById('style-selector').addEventListener('change', (e) => {
            this.map.setStyle(e.target.value);
        });
    }

    addLocationsToMap(locations) {
        // Remove existing layers and sources
        if (this.map.getLayer('object-locations')) this.map.removeLayer('object-locations');
        if (this.map.getLayer('camera-locations')) this.map.removeLayer('camera-locations');
        if (this.map.getSource('photos')) this.map.removeSource('photos');

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
                    type: location.type
                }
            }))
        };

        this.map.addSource('photos', {
            type: 'geojson',
            data: geojson
        });

        this.addLocationLayers();
        this.setupEventListeners();
        this.fitMapToBounds(locations);
    }

    addLocationLayers() {
        ['object', 'camera'].forEach(type => {
            this.map.addLayer({
                'id': `${type}-locations`,
                'type': 'circle',
                'source': 'photos',
                'filter': ['==', ['get', 'type'], type],
                'paint': {
                    'circle-radius': LAYER_STYLES[type].radius,
                    'circle-color': LAYER_STYLES[type].color,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ffffff'
                }
            });
        });
    }

    setupEventListeners() {
        const layers = ['object-locations', 'camera-locations'];
        
        layers.forEach(layer => {
            this.map.on('mouseenter', layer, this.handleMouseEnter.bind(this));
            this.map.on('mouseleave', layer, this.handleMouseLeave.bind(this));
            this.map.on('click', layer, this.handleClick.bind(this));
        });

        this.map.on('click', this.handleMapClick.bind(this));
    }

    handleMouseEnter(e) {
        this.map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        this.#popupManager.showHoverPopup(coordinates, properties);
    }

    handleMouseLeave() {
        this.map.getCanvas().style.cursor = '';
        this.#popupManager.removeHoverPopup();
    }

    handleClick(e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        this.#popupManager.showDetailPopup(coordinates, properties);
    }

    handleMapClick(e) {
        if (!this.map.queryRenderedFeatures(e.point, { 
            layers: ['object-locations', 'camera-locations'] 
        }).length) {
            this.#popupManager.removeAllPopups();
        }
    }

    fitMapToBounds(locations) {
        if (locations.length) {
            const bounds = new mapboxgl.LngLatBounds();
            locations.forEach(location => {
                bounds.extend([location.lon, location.lat]);
            });
            
            this.map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 16
            });
        }
    }
}
