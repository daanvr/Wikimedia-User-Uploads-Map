import { MapHandler } from './mapHandler.js';
import { UIStateManager } from './uiStateManager.js';
import { WikimediaAPI } from './apiHandler.js';
import { LocationProcessor } from './locationProcessor.js';

export class App {
    constructor() {
        this.mapHandler = new MapHandler('map');
        this.uiStateManager = new UIStateManager();
        this.api = new WikimediaAPI();
        this.locationProcessor = new LocationProcessor();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('fetchUserData', async (event) => {
            const username = event.detail.username;
            await this.fetchAndDisplayUserData(username);
        });
    }

    async fetchAndDisplayUserData(username) {
        try {
            // Fetch user contributions
            const contributionsData = await this.api.fetchUserContributions(username);
            const images = contributionsData.query?.allimages || [];
            
            let loadedImages = 0;
            const locations = [];

            // Process images in batches
            for (let i = 0; i < images.length; i += 50) {
                const batch = images.slice(i, i + 50);
                const titles = batch.map(img => img.title).join('|');
                
                // Fetch both structured data and image details
                const [structuredData, imageDetails] = await Promise.all([
                    this.api.fetchStructuredData(titles),
                    this.api.fetchImageDetails(titles)
                ]);

                // Process locations from the batch
                const batchLocations = this.locationProcessor.processImageData(imageDetails, structuredData);
                locations.push(...batchLocations);

                // Update progress with loaded count and total
                loadedImages += batch.length;
                this.uiStateManager.updateLoadingState(true, loadedImages, images.length);
            }

            // Update map with all locations
            this.mapHandler.addLocationsToMap(locations);

            // Update UI with final stats
            const locatedImages = new Set(locations.map(loc => loc.title)).size;
            this.uiStateManager.updateStats(username, images.length, locatedImages);

        } catch (error) {
            console.error('Error:', error);
            this.uiStateManager.showError('Error fetching data. Please try again.');
        } finally {
            this.uiStateManager.updateLoadingState(false);
        }
    }
}
