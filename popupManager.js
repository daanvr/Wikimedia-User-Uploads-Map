export class PopupManager {
    constructor(map) {
        this.map = map;
        this.hoverPopup = null;
        this.activePopup = null;
    }

    showHoverPopup(coordinates, properties) {
        this.removeHoverPopup();
        
        if (properties.thumbUrl) {
            this.hoverPopup = new mapboxgl.Popup({
                offset: 5,
                closeButton: false,
                className: 'hover-popup'
            })
            .setLngLat(coordinates)
            .setHTML(`
                <div class="popup-image">
                    <img src="${properties.thumbUrl}" alt="${properties.title}">
                </div>
            `)
            .addTo(this.map);
        }
    }

    showDetailPopup(coordinates, properties) {
        this.removeAllPopups();
        
        const popupContent = `
            <div class="popup-content">
                <h3>${properties.title.replace('File:', '')}</h3>
                ${properties.thumbUrl ? `
                    <div class="popup-image">
                        <img src="${properties.thumbUrl}" alt="${properties.title}">
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

        this.activePopup = new mapboxgl.Popup({
            offset: 5,
            className: 'custom-popup',
            closeOnClick: false
        })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(this.map);
    }

    removeHoverPopup() {
        if (this.hoverPopup) {
            this.hoverPopup.remove();
            this.hoverPopup = null;
        }
    }

    removeAllPopups() {
        this.removeHoverPopup();
        if (this.activePopup) {
            this.activePopup.remove();
            this.activePopup = null;
        }
    }
}