// Projectiles - bullets and missiles with object pooling for better performance

class Projectile {
    constructor(options) {
        this.reset(options);
    }
    
    reset(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.speed = options.speed || -8; // Negative for upward movement
        this.width = options.width || 8;  // Increased from 5 to 8
        this.height = options.height || 15;
        this.radius = 8; // Increased from 5 to 8 for better hit detection
        this.type = options.type || 'player'; // 'player' or 'enemy'
        this.powerupType = options.powerupType || 'normal'; // 'normal', 'rapid', etc.
        this.damage = options.damage || 1; // Default damage is 1
        this.isEnemy = this.type === 'enemy';
        this.active = true;
        return this;
    }
    
    update() {
        this.y += this.speed;
        
        // Check if out of screen
        if (this.y < -50 || 
            this.y > this.game.height + 50 ||
            this.x < -50 || 
            this.x > this.game.width + 50) {
            this.active = false;
        }
    }
    
    draw() {
        if (!this.active) return;
        
        if (this.type === 'player') {
            if (this.powerupType === 'rapid') {
                // Draw rapid shot bullet - either a different sprite or a modified version
                this.game.ctx.save();
                this.game.ctx.fillStyle = '#00FFFF'; // Cyan color for rapid shots
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                this.game.ctx.fill();
                this.game.ctx.restore();
            } else {
                sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
            }
        } else {
            sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }
    }
}

// ProjectilePool - Object pooling to improve performance by reducing garbage collection
class ProjectilePool {
    constructor(game, initialSize = 50) {
        this.game = game;
        this.pool = [];
        this.activeProjectiles = [];
        
        // Pre-initialize pool with objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Projectile({ game }));
        }
    }
    
    get(options) {
        // Get projectile from pool or create new one if needed
        let projectile = this.pool.pop() || new Projectile({ game: this.game });
        projectile.reset(options);
        this.activeProjectiles.push(projectile);
        return projectile;
    }
    
    // New method for creating rapid fire shot patterns
    createRapidShot(x, y, options = {}) {
        // Create a spread of 3 bullets for rapid fire
        const baseOptions = {
            ...options,
            x,
            y,
            type: 'player',
            powerupType: 'rapid',
            damage: options.damage || 2,
            speed: options.speed || -10
        };
        
        // Center bullet
        this.get({...baseOptions});
        
        // Side bullets with slight angle
        this.get({
            ...baseOptions,
            x: x - 5,
            speed: baseOptions.speed * 0.9, // Slightly slower
            velocityX: -1 // Add horizontal movement
        });
        
        this.get({
            ...baseOptions,
            x: x + 5,
            speed: baseOptions.speed * 0.9,
            velocityX: 1
        });
    }
    
    update() {
        // Update all active projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Add support for horizontal movement (for spread shots)
            if (projectile.velocityX) {
                projectile.x += projectile.velocityX;
            }
            
            projectile.update();
            
            // If projectile is no longer active, return to the pool
            if (!projectile.active) {
                this.activeProjectiles.splice(i, 1);
                this.pool.push(projectile);
            }
        }
    }
    
    draw() {
        // Draw all active projectiles
        this.activeProjectiles.forEach(projectile => projectile.draw());
    }
    
    clear() {
        // Return all active projectiles to pool
        while (this.activeProjectiles.length) {
            const projectile = this.activeProjectiles.pop();
            projectile.active = false;
            this.pool.push(projectile);
        }
    }
}
