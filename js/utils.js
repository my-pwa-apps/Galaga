// Add keyboard navigation detection for accessibility

// Utility functions

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function detectCollision(obj1, obj2) {
    return distance(obj1.x, obj1.y, obj2.x, obj2.y) < (obj1.radius + obj2.radius);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add keyboard navigation detection
function setupKeyboardNavigationDetection() {
    // Add a class to the body when user is navigating with keyboard
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    // Remove the class when user clicks with mouse
    window.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Call this function when the game initializes
document.addEventListener('DOMContentLoaded', setupKeyboardNavigationDetection);

// Explosion class with optimized rendering
class Explosion {
    constructor(game, x, y) {
        this.reset(game, x, y);
    }
    
    reset(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 30;
        this.expandSpeed = 1.5;
        this.particles = [];
        this.finished = false;
        this.frameCount = 0;
        this.duration = 30; // Frames the explosion lasts
        this.active = true;
        
        // Create explosion particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: randomBetween(-2, 2),
                vy: randomBetween(-2, 2),
                size: randomBetween(3, 6),
                alpha: 1
            });
        }
        
        return this;
    }
    
    update() {
        if (!this.active) return;
        
        this.frameCount++;
        
        // Update radius
        if (this.radius < this.maxRadius) {
            this.radius += this.expandSpeed;
        }
        
        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha = Math.max(0, 1 - this.frameCount / this.duration);
        }
        
        // Check if finished
        if (this.frameCount >= this.duration) {
            this.finished = true;
            this.active = false;
        }
    }
    
    draw() {
        if (!this.active) return;
        
        const ctx = this.game.ctx;
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius / 4, 
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `rgba(255, 200, 50, ${0.6 * (1 - this.frameCount / this.duration)})`);
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            ctx.fillStyle = `rgba(255, 255, 100, ${particle.alpha})`;
            ctx.fillRect(
                particle.x - particle.size/2, 
                particle.y - particle.size/2, 
                particle.size, 
                particle.size
            );
        }
    }
}

// ExplosionPool - Object pooling for explosions
class ExplosionPool {
    constructor(game, initialSize = 20) {
        this.game = game;
        this.pool = [];
        this.activeExplosions = [];
        
        // Pre-initialize pool with explosion objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Explosion(game, 0, 0));
        }
    }
    
    get(x, y) {
        // Get explosion from pool or create new one if needed
        let explosion = this.pool.pop() || new Explosion(this.game, x, y);
        explosion.reset(this.game, x, y);
        this.activeExplosions.push(explosion);
        return explosion;
    }
    
    update() {
        // Update all active explosions
        for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
            const explosion = this.activeExplosions[i];
            explosion.update();
            
            // If explosion is finished, return to the pool
            if (!explosion.active) {
                this.activeExplosions.splice(i, 1);
                this.pool.push(explosion);
            }
        }
    }
    
    draw() {
        // Draw all active explosions
        this.activeExplosions.forEach(explosion => explosion.draw());
    }
    
    clear() {
        // Return all active explosions to pool
        while (this.activeExplosions.length) {
            const explosion = this.activeExplosions.pop();
            explosion.active = false;
            this.pool.push(explosion);
        }
    }
}
