import { App } from './app.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new App();
        await app.initialize();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.getElementById('message').textContent = 'Failed to initialize application. Please check your connection and reload.';
    }
});
