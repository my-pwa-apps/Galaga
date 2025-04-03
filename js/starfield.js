// Starfield animation background

class Starfield {
    constructor(game, starCount = 100) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.stars = [];
        this.starCount = starCount;
        this.speed = 1;
        this.maxSpeed = 5;
        this.hyperspace = false;
        this.hyperspaceSpeed = 0;
        
        // Initialize stars
        this.initStars();
    }
    
    initStars() {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5
            });
        }
    }
    
    // Start hyperspace effect (for level transitions)
    startHyperspace() {
        this.hyperspace = true;
        this.hyperspaceSpeed = 1;
    }
    
    // Stop hyperspace effect
    stopHyperspace() {
        this.hyperspace = false;
        this.hyperspaceSpeed = 0;
    }
    
    update() {
        // Update star positions based on current speed
        const currentSpeed = this.hyperspace ? 
            this.speed + this.hyperspaceSpeed : this.speed;
            
        // Increase hyperspace speed gradually
        if (this.hyperspace && this.hyperspaceSpeed < this.maxSpeed) {
            this.hyperspaceSpeed += 0.1;
        }
            
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Move stars downward
            star.y += star.speed * currentSpeed;
            
            // Reset stars that go off screen
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    draw() {
        // Draw stars as small circles with different sizes and brightness
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Calculate brightness based on hyperspace
            let alpha = this.hyperspace ? 
                Math.min(1.0, 0.5 + star.speed / 2) : 0.5 + star.speed / 3;
                
            // Calculate star length for hyperspace effect
            let length = this.hyperspace ? 
                star.size * (1 + this.hyperspaceSpeed) : star.size;
            
            this.ctx.save();
            
            // Draw star with gradient for hyperspace effect
            if (this.hyperspace && length > star.size) {
                const gradient = this.ctx.createLinearGradient(
                    star.x, star.y - length, 
                    star.x, star.y
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(star.x - star.size/2, star.y - length);
                this.ctx.lineTo(star.x + star.size/2, star.y - length);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Normal star rendering
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
}
