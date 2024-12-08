import { CONFIG } from './config.js';

export class WikimediaAPI {
    async fetchUserContributions(username) {
        const url = `${CONFIG.apiEndpoints.commons}?action=query&list=allimages&aiuser=${encodeURIComponent(username)}&aisort=timestamp&ailimit=500&format=json&origin=*`;
        const response = await fetch(url);
        return await response.json();
    }

    async fetchStructuredData(titles) {
        const url = `${CONFIG.apiEndpoints.commons}?action=wbgetentities&titles=${encodeURIComponent(titles)}&sites=commonswiki&props=claims|descriptions|labels&format=json&origin=*`;
        const response = await fetch(url);
        return await response.json();
    }

    async fetchImageDetails(titles) {
        const url = `${CONFIG.apiEndpoints.commons}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&format=json&iiprop=url|dimensions|size|timestamp|thumb&iiurlwidth=500&iiurlheight=500&origin=*`;
        const response = await fetch(url);
        return await response.json();
    }
}
