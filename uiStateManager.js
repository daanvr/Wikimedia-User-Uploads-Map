export class UIStateManager {
    constructor() {
        this.loadingState = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('fetch').addEventListener('click', () => this.handleFetchClick());
        document.getElementById('wikimedia-user').addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleFetchClick();
            }
        });
    }

    updateLoadingState(isLoading, loadedCount = 0, totalCount = 0) {
        this.loadingState = isLoading;
        const loadingElement = document.getElementById('loading');
        const loadingText = document.getElementById('loading-text');

        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'block' : 'none';
        }

        if (loadingText && loadedCount > 0) {
            const percentage = Math.round((loadedCount / totalCount) * 100);
            loadingText.textContent = `Loading images: ${loadedCount} of ${totalCount} (${percentage}%)`;
        }
    }

    showError(message) {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML = message;
            messageElement.classList.add('error');
        }
    }

    clearError() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML = '';
            messageElement.classList.remove('error');
        }
    }

    updateStats(username, totalImages, locatedImages) {
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            statsDiv.innerHTML = `User: ${username} | Images: ${totalImages} | Located: ${locatedImages}`;
            statsDiv.style.display = 'block';

            if (locatedImages === 0) {
                statsDiv.innerHTML += '<br>No geotagged images found.';
            }
        }
    }

    getUsername() {
        const usernameInput = document.getElementById('wikimedia-user');
        return usernameInput ? usernameInput.value.trim() : '';
    }

    async handleFetchClick() {
        const username = this.getUsername();
        if (!username) {
            this.showError('Please enter a Wikimedia username.');
            return;
        }

        this.clearError();
        this.updateLoadingState(true);
        
        try {
            // Dispatch custom event for fetch request
            const event = new CustomEvent('fetchUserData', { detail: { username } });
            document.dispatchEvent(event);
        } catch (error) {
            this.showError('Error initiating fetch request');
            this.updateLoadingState(false);
        }
    }
}
