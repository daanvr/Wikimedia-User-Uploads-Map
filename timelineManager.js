export class TimelineManager {
    constructor() {
        this.container = this.createTimelineContainer();
    }

    showError(message) {
        const timelineContent = this.container.querySelector('.timeline-content');
        timelineContent.innerHTML = `
            <div class="timeline-error">
                <p>${message}</p>
            </div>
        `;
    }

    createTimelineContainer() {
        const container = document.createElement('div');
        container.id = 'timeline-container';
        container.innerHTML = `
            <div class="timeline-header">
                <h3>Upload Timeline</h3>
                <div class="timeline-controls">
                    <button class="timeline-zoom" data-zoom="in">+</button>
                    <button class="timeline-zoom" data-zoom="out">-</button>
                </div>
            </div>
            <div class="timeline-scroll">
                <div class="timeline-content"></div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    renderTimeline(images) {
        if (!images || images.length === 0) {
            this.showError('No images available to display in timeline');
            return;
        }

        const timelineContent = this.container.querySelector('.timeline-content');
        timelineContent.innerHTML = '';

        try {
            // Sort images by timestamp
            const sortedImages = [...images].sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );

        // Group by year and month
        const groups = this.groupImagesByDate(sortedImages);
        
        // Create timeline elements
        groups.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'timeline-group';
            groupEl.innerHTML = `
                <div class="timeline-date">${group.label}</div>
                <div class="timeline-bar" style="height: ${group.count * 2}px"></div>
                <div class="timeline-count">${group.count}</div>
            `;
            timelineContent.appendChild(groupEl);
        });

        this.setupTimelineInteractions(groups, sortedImages);
    }

    groupImagesByDate(images) {
        const groups = new Map();
        
        images.forEach(img => {
            const date = new Date(img.timestamp);
            const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const label = new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });

            if (!groups.has(key)) {
                groups.set(key, { label, count: 0, images: [] });
            }
            groups.get(key).count++;
            groups.get(key).images.push(img);
        });

        return Array.from(groups.values());
    }

    setupTimelineInteractions(groups, images) {
        const bars = this.container.querySelectorAll('.timeline-bar');
        bars.forEach((bar, index) => {
            bar.addEventListener('click', () => {
                const groupImages = groups[index].images;
                document.dispatchEvent(new CustomEvent('timelineSelection', {
                    detail: { images: groupImages }
                }));
            });
        });

        // Add zoom controls
        this.container.querySelectorAll('.timeline-zoom').forEach(button => {
            button.addEventListener('click', () => {
                const content = this.container.querySelector('.timeline-content');
                const currentWidth = parseInt(getComputedStyle(content).width);
                const zoom = button.dataset.zoom === 'in' ? 1.2 : 0.8;
                content.style.width = `${currentWidth * zoom}px`;
            });
        });
    }
}
