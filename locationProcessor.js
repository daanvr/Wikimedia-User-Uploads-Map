import { LOCATION_TYPES } from './config.js';

export class LocationProcessor {
    processImageData(imageDetails, structuredData) {
        const locations = [];
        const imageDetailsMap = this._createImageDetailsMap(imageDetails);
        
        Object.values(structuredData.entities || {}).forEach(entity => {
            const entityId = entity.id.replace('M', '');
            const imageData = imageDetailsMap[entityId];
            
            if (!imageData) return;
            
            this._processLocations(entity, imageData, locations);
        });
        
        return locations;
    }

    _createImageDetailsMap(imageDetails) {
        const map = {};
        const pages = imageDetails.query?.pages || {};
        
        Object.entries(pages).forEach(([pageId, pageData]) => {
            map[pageId] = {
                title: pageData.title,
                thumbUrl: pageData.imageinfo?.[0]?.thumburl
            };
        });
        
        return map;
    }

    _processLocations(entity, imageData, locations) {
        const { title, thumbUrl } = imageData;

        // Process camera location
        const cameraLocation = entity.statements?.P1259?.[0]?.mainsnak?.datavalue?.value;
        if (cameraLocation) {
            this._addLocation(locations, cameraLocation, title, thumbUrl, LOCATION_TYPES.CAMERA);
        }

        // Process object location
        const objectLocation = entity.statements?.P9149?.[0]?.mainsnak?.datavalue?.value;
        if (objectLocation) {
            this._addLocation(locations, objectLocation, title, thumbUrl, LOCATION_TYPES.OBJECT);
        }
    }

    _addLocation(locations, locationData, title, thumbUrl, type) {
        const lat = parseFloat(locationData.latitude);
        const lon = parseFloat(locationData.longitude);
        
        if (!isNaN(lat) && !isNaN(lon)) {
            locations.push({ lat, lon, title, thumbUrl, type });
        }
    }
}
