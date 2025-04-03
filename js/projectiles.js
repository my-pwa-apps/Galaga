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
        this.velocityX = options.velocityX || 0; // Support for horizontal movement
        this.isEnemy = this.type === 'enemy';
        this.active = true;
        // Track the source of player projectiles (for powerup attribution)
        this.sourceEnemyType = options.sourceEnemyType || null;
        return this;
    }
    
    update() {
        this.y += this.speed;
        
        // Apply horizontal velocity if any
        if (this.velocityX) {
            this.x += this.velocityX;
        }
        
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
                // Draw rapid shot bullet - with a much more distinct appearance
                this.game.ctx.save();
                
                // Pulsing effect for rapid bullets
                const pulseSize = this.radius + Math.sin(this.game.frameCount * 0.3) * 2;
                
                // Outer glow (larger, animated)
                this.game.ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, pulseSize + 5, 0, Math.PI * 2);
                this.game.ctx.fill();
                
                // Middle layer
                this.game.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
                this.game.ctx.fill();
                
                // Inner bright core
                this.game.ctx.fillStyle = '#FFFFFF';
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, pulseSize - 3, 0, Math.PI * 2);
                this.game.ctx.fill();
                
                // Add particle trail effect
                for (let i = 1; i <= 5; i++) {
                    const trailY = this.y + (i * 5);
                    const trailSize = pulseSize - (i * 1.5);
                    if (trailSize <= 0) continue;
                    
                    this.game.ctx.fillStyle = `rgba(0, 255, 255, ${0.3 - (i * 0.05)})`;
                    this.game.ctx.beginPath();
                    this.game.ctx.arc(this.x, trailY, trailSize, 0, Math.PI * 2);
                    this.game.ctx.fill();
                }
                
                this.game.ctx.restore();
            } else {
                sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
            }
        } else {
            sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }
    }
    
    // Method to handle powerup generation on enemy hit
    checkPowerupDrop(enemyType) {
        // Different enemy types have different chances to drop specific powerups
        const powerupMappings = {
            'butterfly': { type: 'rapid', chance: 0.2 },
            'boss': { type: 'shield', chance: 0.4 },
            'bee': { type: 'extraLife', chance: 0.1 }
            // Add more enemy types and powerups as needed
        };
        
        const enemyPowerup = powerupMappings[enemyType];
        if (!enemyPowerup) return null;
        
        // Check if powerup should be dropped based on chance
        if (Math.random() <= enemyPowerup.chance) {
            return enemyPowerup.type;
        }
        
        return null;
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
        // Create a more intense spread of 5 bullets for rapid fire
        const baseOptions = {
            ...options,
            x,
            y,
            type: 'player',
            powerupType: 'rapid',
            damage: options.damage || 2,
            speed: options.speed || -12 // Faster bullets
        };
        
        // Center bullet - fastest
        this.get({...baseOptions});
        
        // Inner side bullets
        this.get({
            ...baseOptions,
            x: x - 8,
            speed: baseOptions.speed * 0.95,
            velocityX: -0.5
        });
        
        this.get({
            ...baseOptions,
            x: x + 8,
            speed: baseOptions.speed * 0.95,
            velocityX: 0.5
        });
        
        // Outer side bullets - with more spread
        this.get({
            ...baseOptions,
            x: x - 16,
            y: y + 5, // Start slightly lower
            speed: baseOptions.speed * 0.9,
            velocityX: -1
        });
        
        this.get({
            ...baseOptions,
            x: x + 16,
            y: y + 5, // Start slightly lower
            speed: baseOptions.speed * 0.9,
            velocityX: 1
        });
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
    
    // Handle enemy collision with potential powerup generation
    handleEnemyCollision(projectile, enemy) {
        // Check if this enemy type drops a powerup
        const powerupType = projectile.checkPowerupDrop(enemy.type);
        
        if (powerupType) {
            // Create a powerup at the enemy's position
            this.game.createPowerup({
                x: enemy.x,
                y: enemy.y,
                type: powerupType
            });
        }
    }
}
