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
        this.fromTimedPowerup = options.fromTimedPowerup || false;
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
                // Middle layerh.sin(this.game.frameCount * 0.3) * 2;
                this.game.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
                this.game.ctx.fill();
                // Inner bright core
                this.game.ctx.fillStyle = '#FFFFFF';
                this.game.ctx.beginPath();le = 'rgba(0, 255, 255, 0.7)';
                this.game.ctx.arc(this.x, this.y, pulseSize - 3, 0, Math.PI * 2);
                this.game.ctx.fill();this.y, pulseSize, 0, Math.PI * 2);
                // Add particle trail effect
                for (let i = 1; i <= 5; i++) {
                    const trailY = this.y + (i * 5);
                    const trailSize = pulseSize - (i * 1.5);th();
                    if (trailSize <= 0) continue;lseSize - 3, 0, Math.PI * 2);
                    this.game.ctx.fillStyle = `rgba(0, 255, 255, ${0.3 - (i * 0.05)})`;
                    this.game.ctx.beginPath();
                    this.game.ctx.arc(this.x, trailY, trailSize, 0, Math.PI * 2);+) {
                    this.game.ctx.fill();
                }ize - (i * 1.5);
                this.game.ctx.restore();ue;
            } else if (this.powerupType === 'hyperspeed') {0, 255, 255, ${0.3 - (i * 0.05)})`;
                // Draw hyperspeed projectile with a streaking effect
                this.game.ctx.save();, trailSize, 0, Math.PI * 2);
                // Create a gradient streak effect
                const gradient = this.game.ctx.createLinearGradient(
                    this.x, this.y, 
                    this.x, this.y + 30
                );with a streaking effect
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.5, '#00FFFF');ak effect
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');me.ctx.createLinearGradient(
                // Draw the streak
                this.game.ctx.fillStyle = gradient;
                this.game.ctx.fillRect(this.x - 2, this.y, 4, 30);
                // Draw the bullet head
                this.game.ctx.fillStyle = '#FFFFFF';F');
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                this.game.ctx.fill();
                this.game.ctx.restore();ct(this.x - 2, this.y, 4, 30);
            } else {
                sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
            }
        } else {, Math.PI * 2);
            sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }
    }
.ctx, this.x, this.y);
    // Method to handle powerup generation on enemy hit
    checkPowerupDrop(enemyType) {
        // Different enemy types have different chances to drop specific powerupsgame.ctx, this.x, this.y);
        const powerupMappings = {
            'butterfly': { type: 'rapid', chance: 0.15 }, // Reduced from 0.2 for more gradual difficulty
            'boss': { type: 'shield', chance: 0.3 },      // Reduced from 0.4 for more gradual difficulty
            'bee': { type: 'extraLife', chance: 0.08 }    // Reduced from 0.1 for more gradual difficultyon on enemy hit
            // Add more enemy types and powerups as needed(enemyType) {
        };powerups
        const enemyPowerup = powerupMappings[enemyType];pMappings = {
        if (!enemyPowerup) return null; 0.2 for more gradual difficulty
        // Check if powerup should be dropped based on chance from 0.4 for more gradual difficulty
        if (Math.random() <= enemyPowerup.chance) {': { type: 'extraLife', chance: 0.08 }    // Reduced from 0.1 for more gradual difficulty
            return enemyPowerup.type;
        };
        return null;;
    } null;
}
yPowerup.chance) {
// ProjectilePool - Object pooling to improve performance by reducing garbage collection
class ProjectilePool {
    constructor(game, initialSize = 50) {
        this.game = game;
        this.pool = [];
        this.activeProjectiles = [];
        // Pre-initialize pool with objectse by reducing garbage collection
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Projectile({ game }));
        }
    }

    get(options) {
        // Get projectile from pool or create new one if neededze; i++) {
        let projectile = this.pool.pop() || new Projectile({ game: this.game });l.push(new Projectile({ game }));
        projectile.reset(options);}
        this.activeProjectiles.push(projectile);
        return projectile;
    }
ile from pool or create new one if needed
    // New method for creating rapid fire shot patterns
    createRapidShot(x, y, options = {}) {options);
        // Create a more intense spread of 5 bullets for rapid firectile);
        const baseOptions = {
            ...options,
            x,
            y,patterns
            type: 'player',
            powerupType: 'rapid',llets for rapid fire
            damage: options.damage || 2,
            speed: options.speed || -12 // Faster bullets   ...options,
        };
        // Center bullet - fastest
        this.get({...baseOptions});
        // Inner side bullets
        this.get({
            ...baseOptions,| -12 // Faster bullets
            x: x - 8,
            speed: baseOptions.speed * 0.95, fastest
            velocityX: -0.5
        });
        this.get({
            ...baseOptions,
            x: x + 8,
            speed: baseOptions.speed * 0.95,s.speed * 0.95,
            velocityX: 0.5-0.5
        });
        // Outer side bullets - with more spread
        this.get({
            ...baseOptions,
            x: x - 16,.95,
            y: y + 5, // Start slightly lower
            speed: baseOptions.speed * 0.9,
            velocityX: -1h more spread
        });
        this.get({
            ...baseOptions, 16,
            x: x + 16,t slightly lower
            y: y + 5, // Start slightly lowerseOptions.speed * 0.9,
            speed: baseOptions.speed * 0.9,
            velocityX: 1
        });
    }
 16,
    // New method for creating hyperspeed shotsart slightly lower
    createHyperspeedShot(x, y, options = {}) {seOptions.speed * 0.9,
        const baseOptions = {
            ...options,
            x,
            y,
            type: 'player',
            powerupType: 'hyperspeed',edShot(x, y, options = {}) {
            damage: options.damage || 5, // High damage
            speed: options.speed || -25  // Very fast bullets,
        };
        // Create a single powerful hyperspeed shot
        this.get({...baseOptions});
    }
ns.damage || 5, // High damage
    update() { options.speed || -25  // Very fast bullets
        // Update all active projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {ngle powerful hyperspeed shot
            const projectile = this.activeProjectiles[i];
            projectile.update();
            // If projectile is no longer active, return to the pool
            if (!projectile.active) {
                this.activeProjectiles.splice(i, 1);tive projectiles
                this.pool.push(projectile); (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            }ctiles[i];
        }
    }e, return to the pool

    draw() {ojectiles.splice(i, 1);
        // Draw all active projectilesol.push(projectile);
        this.activeProjectiles.forEach(projectile => projectile.draw());
    }

    clear() {
        // Return all active projectiles to pool
        while (this.activeProjectiles.length) {
            const projectile = this.activeProjectiles.pop();> projectile.draw());
            projectile.active = false;
            this.pool.push(projectile);
        }
    }urn all active projectiles to pool
ngth) {
    // Handle enemy collision with potential powerup generation
    handleEnemyCollision(projectile, enemy) {
        // Only create powerups on the exact position of destroyed enemy ships
        if (!enemy || !enemy.active) return; // Safety check
        
        const powerupType = projectile.checkPowerupDrop(enemy.type);
        
        if (powerupType) { {
            // Create a powerup at the enemy's EXACT positionn of destroyed enemy ships
            this.game.createPowerup({; // Safety check
                x: enemy.x, powerupType = projectile.checkPowerupDrop(enemy.type);
                y: enemy.y,
                type: powerupType,powerupType) {
                fromEnemyDestruction: true, // Flag to indicate this powerup came from destroying an enemy enemy's exact position
                shipType: enemy.type // Store the type of ship that dropped it
            });
        }
    }   type: powerupType,
    lag to indicate this powerup came from destroying an enemy
    // Handle level transitions with powerupshe type of ship that dropped it
    handleLevelTransition() {
        // Reset any projectiles that came from time-based powerups
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            if (projectile.fromTimedPowerup) {itions with powerups
                projectile.active = false;eLevelTransition() {
                this.activeProjectiles.splice(i, 1);vel
                this.pool.push(projectile);) {
            }
        }
        
        // Signal the game to clear any active time-based powerups
        if (this.game.clearTimedPowerups) {    const projectile = this.activeProjectiles[i];
            this.game.clearTimedPowerups();.fromTimedPowerup) {
        }
    }, 1);
    ush(projectile);
    // Remove all powerups when last enemy is destroyed
    clearPowerupsOnLastEnemy() {
        // Check if all enemies are destroyed before clearing powerups
        const enemiesRemaining = this.game.countActiveEnemies ? this.game.countActiveEnemies() : 0;
         remove all powerups when last enemy is destroyed
        if (enemiesRemaining <= 0) {PowerupsOnLastEnemy() {
            // This should be called from the game class when the last enemy is destroyed   // Check if all enemies are destroyed before clearing powerups
            if (this.game.clearAllPowerups) {    const enemiesRemaining = this.game.countActiveEnemies ? this.game.countActiveEnemies() : 0;
                this.game.clearAllPowerups();
            }
        }
    }
}
