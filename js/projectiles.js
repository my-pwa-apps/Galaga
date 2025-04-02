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
        this.width = options.width || 5;
        this.height = options.height || 15;
        this.radius = 5;
        this.type = options.type || 'player'; // 'player' or 'enemy'
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
            sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
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
    
    update() {
        // Update all active projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
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
