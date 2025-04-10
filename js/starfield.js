/**
 * Starfield - Creates a scrolling star background effect
 * Used to create a sense of movement through space
 */
class Starfield {
    constructor(options) {
        this.canvas = options.canvas;
        this.ctx = options.ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Star properties
        this.starCount = options.starCount || 100;
        this.stars = [];
        
        // Parallax effect with multiple star layers
        this.layers = [
            { speed: 0.5, size: 1, count: Math.floor(this.starCount * 0.5), color: 'rgba(255, 255, 255, 0.5)' },
            { speed: 1.0, size: 1.5, count: Math.floor(this.starCount * 0.3), color: 'rgba(255, 255, 255, 0.7)' },
            { speed: 2.0, size: 2, count: Math.floor(this.starCount * 0.2), color: 'rgba(255, 255, 255, 1.0)' }
        ];
        
        // Initialize the stars
        this.initStars();
    }
    
    // Create the initial star field
    initStars() {
        this.stars = [];
        
        // Create stars for each layer
        this.layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: layer.size,
                    speed: layer.speed,
                    color: layer.color,
                    brightness: 0.5 + Math.random() * 0.5
                });
            }
        });
    }
    
    // Update star positions based on player movement
    update(playerSpeed = 1, direction = 1) {
        // Move each star based on its layer speed and player movement
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Update position - move down slightly for vertical scrolling effect
            star.y += star.speed * 0.2;
            
            // Move horizontally based on player direction
            star.x -= star.speed * playerSpeed * direction * 0.5;
            
            // Wrap stars around edges
            if (star.x < 0) star.x = this.width;
            if (star.x > this.width) star.x = 0;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            
            // Twinkle effect
            star.brightness = 0.5 + Math.sin(Date.now() * 0.001 + i) * 0.3;
        }
    }
    
    // Draw the starfield
    draw() {
        // No need to clear canvas, should be done by the main game loop
        
        // Draw each star
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Set star appearance based on its properties
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = star.brightness;
            
            // Draw the star
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Reset global alpha
        this.ctx.globalAlpha = 1.0;
    }
    
    // Handle canvas resize
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Reposition stars when canvas is resized
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Keep stars within new boundaries
            if (star.x > this.width) star.x = Math.random() * this.width;
            if (star.y > this.height) star.y = Math.random() * this.height;
        }
    }
}

// Make Starfield available globally
if (typeof window !== 'undefined') {
    window.Starfield = Starfield;
}
