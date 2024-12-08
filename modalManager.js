export class ModalManager {
    constructor() {
        this.modal = null;
        this.setupModal();
    }

    setupModal() {
        // Create modal elements
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <img src="" alt="" class="modal-image">
                <div class="modal-info">
                    <h3 class="modal-title"></h3>
                    <div class="modal-links">
                        <a href="" target="_blank" rel="noopener noreferrer" class="commons-link">
                            View on Wikimedia Commons ⧉
                        </a>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
                cursor: pointer;
            }
            .modal-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: white;
            }
            .modal-info {
                margin-top: 20px;
                text-align: center;
                max-width: 80%;
            }
            .modal-title {
                margin: 0 0 10px 0;
                font-size: 1.2em;
            }
            .modal-links a {
                color: #fff;
                text-decoration: none;
            }
            .modal-links a:hover {
                text-decoration: underline;
            }
            .modal-image {
                max-width: 80%;
                max-height: 80vh;
                object-fit: contain;
                cursor: zoom-out;
            }
            .popup-image img {
                cursor: zoom-in;
            }
        `;

        // Add to document
        document.head.appendChild(style);
        document.body.appendChild(this.modal);

        // Add click handler to close
        this.modal.addEventListener('click', () => this.hideModal());
    }

    showModal(imageData) {
        const modalImg = this.modal.querySelector('.modal-image');
        const modalTitle = this.modal.querySelector('.modal-title');
        const commonsLink = this.modal.querySelector('.commons-link');
        
        modalImg.src = imageData.fullUrl;
        modalImg.alt = imageData.title;
        modalTitle.textContent = imageData.title.replace('File:', '');
        commonsLink.href = `https://commons.wikimedia.org/wiki/${encodeURIComponent(imageData.title)}`;
        
        this.modal.style.display = 'block';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }
}
