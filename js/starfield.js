// Starfield animation background

class Starfield {
    constructor(game, starCount = 100) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.stars = [];
        this.starCount = starCount;
        this.speed = 1;
        this.maxSpeed = 10; // Increased max speed for more dramatic effect
        this.hyperspace = false;
        this.hyperspaceSpeed = 0;
        this.hyperspaceLightStreaks = []; // New array to store light streaks
        
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
        
        // Create initial light streaks
        this.createLightStreaks();
    }
    
    // Create light streaks for hyperspace effect
    createLightStreaks() {
        this.hyperspaceLightStreaks = [];
        
        // Create several light streaks at random positions
        const streakCount = 15;
        for (let i = 0; i < streakCount; i++) {
            this.hyperspaceLightStreaks.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height / 2 + this.canvas.height / 3, // More in the middle/lower part
                length: 50 + Math.random() * 150, // Varied lengths
                width: 1 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.5,
                speed: 5 + Math.random() * 15
            });
        }
    }
    
    // Stop hyperspace effect
    stopHyperspace() {
        this.hyperspace = false;
        this.hyperspaceSpeed = 0;
        this.hyperspaceLightStreaks = [];
    }
    
    update() {
        // Update star positions based on current speed
        const currentSpeed = this.hyperspace ? 
            this.speed + this.hyperspaceSpeed : this.speed;
            
        // Increase hyperspace speed gradually with acceleration curve
        if (this.hyperspace && this.hyperspaceSpeed < this.maxSpeed) {
            this.hyperspaceSpeed += 0.2; // Faster acceleration
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
        
        // Update light streaks during hyperspace
        if (this.hyperspace) {
            for (let i = 0; i < this.hyperspaceLightStreaks.length; i++) {
                const streak = this.hyperspaceLightStreaks[i];
                
                // Move streaks downward faster than stars
                streak.y += streak.speed;
                
                // Reset streaks that go off screen
                if (streak.y > this.canvas.height) {
                    streak.y = 0;
                    streak.x = Math.random() * this.canvas.width;
                    streak.length = 50 + Math.random() * 150;
                    streak.width = 1 + Math.random() * 3;
                    streak.alpha = 0.3 + Math.random() * 0.5;
                }
            }
            
            // Occasionally add new streaks during hyperspace
            if (Math.random() < 0.05) {
                this.hyperspaceLightStreaks.push({
                    x: Math.random() * this.canvas.width,
                    y: 0,
                    length: 50 + Math.random() * 150,
                    width: 1 + Math.random() * 3,
                    alpha: 0.3 + Math.random() * 0.5,
                    speed: 5 + Math.random() * 15
                });
            }
        }
    }
    
    draw() {
        // Draw light streaks first (if in hyperspace)
        if (this.hyperspace) {
            this.drawLightStreaks();
        }
        
        // Draw stars as small circles with different sizes and brightness
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Calculate brightness based on hyperspace
            let alpha = this.hyperspace ? 
                Math.min(1.0, 0.5 + star.speed / 2) : 0.5 + star.speed / 3;
                
            // Calculate star length for hyperspace effect - more dramatic trail
            let length = this.hyperspace ? 
                star.size * (2 + this.hyperspaceSpeed * 3) : star.size;
            
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
    
    // Draw light streaks for hyperspace effect
    drawLightStreaks() {
        for (let i = 0; i < this.hyperspaceLightStreaks.length; i++) {
            const streak = this.hyperspaceLightStreaks[i];
            
            this.ctx.save();
            
            // Create gradient for streak
            const gradient = this.ctx.createLinearGradient(
                streak.x, streak.y - streak.length,
                streak.x, streak.y
            );
            
            // Create a blue-white streak effect
            gradient.addColorStop(0, `rgba(100, 180, 255, 0)`);
            gradient.addColorStop(0.3, `rgba(180, 220, 255, ${streak.alpha * 0.3})`);
            gradient.addColorStop(0.7, `rgba(220, 240, 255, ${streak.alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${streak.alpha})`);
            
            this.ctx.fillStyle = gradient;
            
            // Draw streak as a tapered rectangle
            this.ctx.beginPath();
            this.ctx.moveTo(streak.x - streak.width, streak.y);
            this.ctx.lineTo(streak.x + streak.width, streak.y);
            this.ctx.lineTo(streak.x + streak.width * 0.3, streak.y - streak.length);
            this.ctx.lineTo(streak.x - streak.width * 0.3, streak.y - streak.length);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add a glow effect
            this.ctx.shadowColor = 'rgba(120, 210, 255, 0.8)';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
}
