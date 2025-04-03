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
        this.powerupType = options.powerupType || 'normal'; // 'normal', 'rapid', 'hyperspeed' etc.
        this.damage = options.damage || 1; // Default damage is 1
        this.velocityX = options.velocityX || 0; // Support for horizontal movement
        this.isEnemy = this.type === 'enemy';
        this.active = true;
        // Track the source of player projectiles (for powerup attribution)
        this.sourceEnemyType = options.sourceEnemyType || null;
        // For hyperspeed projectile visibility tracking
        this.isHyperspeed = options.powerupType === 'hyperspeed';
        this.hyperspeedVisible = this.isHyperspeed;
        this.originalY = this.y; // Store the original Y position for hyperspeed visibility calculation
        return this;
    }
    
    update() {
        this.y += this.speed;
        
        // Apply horizontal velocity if any
        if (this.velocityX) {
            this.x += this.velocityX;
        }
        
        // For hyperspeed projectiles - check if we need to hide them
        if (this.isHyperspeed && this.hyperspeedVisible) {
            // Hide hyperspeed projectile once it reaches the top quarter of the screen
            if (this.y <= this.game.height * 0.25) {
                this.hyperspeedVisible = false;
            }
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
        
        // If it's a hyperspeed projectile that shouldn't be visible, don't draw it
        if (this.isHyperspeed && !this.hyperspeedVisible) return;
        
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
            } else if (this.powerupType === 'hyperspeed') {
                // Draw hyperspeed projectile with a streaking effect
                this.game.ctx.save();
                
                // Create a gradient streak effect
                const gradient = this.game.ctx.createLinearGradient(
                    this.x, this.y, 
                    this.x, this.y + 30
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.5, '#00FFFF');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                // Draw the streak
                this.game.ctx.fillStyle = gradient;
                this.game.ctx.fillRect(this.x - 2, this.y, 4, 30);
                
                // Draw the bullet head
                this.game.ctx.fillStyle = '#FFFFFF';
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                this.game.ctx.fill();
                
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
            'butterfly': { type: 'rapid', chance: 0.15 }, // Reduced from 0.2 for more gradual difficulty
            'boss': { type: 'shield', chance: 0.3 },      // Reduced from 0.4 for more gradual difficulty
            'bee': { type: 'extraLife', chance: 0.08 }    // Reduced from 0.1 for more gradual difficulty
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
    
    // New method for creating hyperspeed shots
    createHyperspeedShot(x, y, options = {}) {
        const baseOptions = {
            ...options,
            x,
            y,
            type: 'player',
            powerupType: 'hyperspeed',
            damage: options.damage || 5, // High damage
            speed: options.speed || -25  // Very fast bullets
        };
        
        // Create a single powerful hyperspeed shot
        this.get({...baseOptions});
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
        // Only create powerups on the exact position of destroyed enemy ships
        const powerupType = projectile.checkPowerupDrop(enemy.type);
        
        if (powerupType) {
            // Create a powerup at the enemy's exact position
            this.game.createPowerup({
                x: enemy.x,
                y: enemy.y,
                type: powerupType,
                fromEnemyDestruction: true // Flag to indicate this powerup came from destroying an enemy
            });
        }
    }
    
    // New method to remove all powerups when last enemy is destroyed
    clearPowerupsOnLastEnemy() {
        // This should be called from the game class when the last enemy is destroyed
        if (this.game.clearPowerupsAfterLevel) {
            this.game.clearAllPowerups();
        }
    }
}
