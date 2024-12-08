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
                justify-content: center;
                align-items: center;
                height: 100%;
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

    showModal(imageUrl) {
        const modalImg = this.modal.querySelector('.modal-image');
        modalImg.src = imageUrl;
        this.modal.style.display = 'block';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }
}
