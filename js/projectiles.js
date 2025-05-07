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
        // Whether this powerup should persist between levels (only extra life does)
        this.persistBetweenLevels = options.powerupType === 'extraLife';
        
        // Add a unique ID for collision optimization
        this.id = options.id || Projectile._nextId++;
        
        // Precalculate half dimensions for collision checks
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        
        return this;
    }

    // Static property for generating unique IDs
    static _nextId = 1;

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
        // Check if out of screen - improved boundary check
        if (this.y < -this.height || 
            this.y > this.game.height + this.height ||
            this.x < -this.width || 
            this.x > this.game.width + this.width) {
            this.active = false;
        }
    }
    
    // Optimized draw method with cached glow effects
    draw() {
        const ctx = this.game.ctx;
        
        // Skip rendering inactive or invisible projectiles
        if (!this.active || (this.isHyperspeed && !this.hyperspeedVisible)) {
            return;
        }

        ctx.save();
        
        // Fast path for normal player projectiles (most common case)
        if (this.type === 'player' && this.powerupType === 'normal') {
            // Draw player projectile - optimized path
            ctx.fillStyle = '#00ffff'; // Cyan for player bullets
            ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
            
            // Simple glow effect
            ctx.globalAlpha = 0.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00ffff';
            ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
        } 
        // Special effects path for power-up projectiles
        else if (this.type === 'player') {
            // Use optimized rendering based on powerup type
            let color;
            let glowColor;
            
            switch (this.powerupType) {
                case 'rapidFire':
                    color = '#ffff00'; // Yellow
                    glowColor = '#ffcc00';
                    break;
                case 'multiShot':
                    color = '#ff00ff'; // Magenta
                    glowColor = '#cc00cc';
                    break;
                case 'shield':
                    color = '#00ff00'; // Green
                    glowColor = '#00cc00';
                    break;
                case 'hyperspeed':
                    color = '#0099ff'; // Blue
                    glowColor = '#0066cc';
                    break;
                default:
                    color = '#00ffff'; // Default cyan
                    glowColor = '#00cccc';
            }
            
            // Draw enhanced projectile
            ctx.fillStyle = color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = glowColor;
            
            // Draw main projectile body
            ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
            
            // Add extra visual effects for powerup projectiles
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();
        } 
        // Enemy projectiles
        else if (this.type === 'enemy') {
            // Draw enemy projectile with appropriate color and effects
            ctx.fillStyle = '#ff3300'; // Red for enemy bullets
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff6600';
            
            // Draw a different shape for enemy projectiles
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.halfHeight);
            ctx.lineTo(this.x + this.halfWidth, this.y + this.halfHeight);
            ctx.lineTo(this.x - this.halfWidth, this.y + this.halfHeight);
            ctx.closePath();
            ctx.fill();
            
            // Add simple glow effect
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ProjectilePool - Object pooling to improve performance by reducing garbage collection
class ProjectilePool {
    constructor(game, initialSize = 100) { // Increase pool size for better performance
        this.game = game;
        this.pool = [];
        this.activeProjectiles = [];
        this.playerProjectiles = []; // Separate arrays for faster collision checks
        this.enemyProjectiles = [];
        this.activeCount = 0;
        
        // Pre-initialize pool with objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new Projectile({ game, id: i }));
        }
        
        // Use spatial partitioning for faster collision detection
        this.gridSize = 50; // Cell size for spatial grid
        this.grid = {}; // Will store projectiles by grid cell
        
        // Reusable option objects to avoid creating new objects every time
        this._reuseOptions = {
            game: this.game,
            type: 'player',
            powerupType: 'normal',
            damage: 1,
            speed: -8
        };
    }

    get(options) {
        // Get projectile from pool or create new one if needed
        let projectile;
        
        // Reuse object if possible
        if (this.pool.length > 0) {
            projectile = this.pool.pop();
        } else {
            // Create new object if pool is empty
            projectile = new Projectile({ 
                game: this.game,
                id: Projectile._nextId++ 
            });
        }
        
        // Reset with new options
        projectile.reset(options);
        
        // Add to appropriate active array for faster iteration
        this.activeProjectiles.push(projectile);
        if (projectile.isEnemy) {
            this.enemyProjectiles.push(projectile);
        } else {
            this.playerProjectiles.push(projectile);
        }
        
        this.activeCount++;
        return projectile;
    }

    // Optimized method for creating rapid fire shot patterns
    createRapidShot(x, y, options = {}) {
        // Avoid object spread for better performance
        const baseType = options.type || 'player';
        const baseDamage = options.damage || 2;
        const baseSpeed = options.speed || -12;
        
        // Center bullet - fastest
        this.get({
            game: this.game,
            x: x,
            y: y,
            type: baseType,
            powerupType: 'rapid',
            damage: baseDamage,
            speed: baseSpeed
        });
        
        // Inner side bullets
        this.get({
            game: this.game,
            x: x - 8,
            y: y,
            type: baseType,
            powerupType: 'rapid',
            damage: baseDamage,
            speed: baseSpeed * 0.95,
            velocityX: -0.5
        });
        this.get({
            game: this.game,
            x: x + 8,
            y: y,
            type: baseType,
            powerupType: 'rapid',
            damage: baseDamage,
            speed: baseSpeed * 0.95,
            velocityX: 0.5
        });
        
        // Outer side bullets - with more spread
        this.get({
            game: this.game,
            x: x - 16,
            y: y + 5, // Start slightly lower
            type: baseType,
            powerupType: 'rapid',
            damage: baseDamage,
            speed: baseSpeed * 0.9,
            velocityX: -1
        });
        this.get({
            game: this.game,
            x: x + 16,
            y: y + 5, // Start slightly lower
            type: baseType,
            powerupType: 'rapid',
            damage: baseDamage,
            speed: baseSpeed * 0.9,
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

    // Optimized update method for better performance
    update() {
        // Reset spatial grid for collision detection
        this.grid = {};
        
        // Update all active projectiles with optimized removal
        let activeIndex = 0;
        const len = this.activeProjectiles.length;
        
        for (let i = 0; i < len; i++) {
            const projectile = this.activeProjectiles[i];
            projectile.update();
            
            // If still active, keep it and update spatial grid
            if (projectile.active) {
                // Only perform swap if necessary
                if (i !== activeIndex) {
                    this.activeProjectiles[activeIndex] = projectile;
                }
                activeIndex++;
                
                // Add to spatial grid for collision detection
                const cellX = Math.floor(projectile.x / this.gridSize);
                const cellY = Math.floor(projectile.y / this.gridSize);
                const cellKey = `${cellX},${cellY}`;
                
                if (!this.grid[cellKey]) {
                    this.grid[cellKey] = [];
                }
                this.grid[cellKey].push(projectile);
            } else {
                // Return inactive to pool
                this.pool.push(projectile);
                
                // Also remove from type-specific arrays
                if (projectile.isEnemy) {
                    const enemyIndex = this.enemyProjectiles.indexOf(projectile);
                    if (enemyIndex !== -1) this.enemyProjectiles.splice(enemyIndex, 1);
                } else {
                    const playerIndex = this.playerProjectiles.indexOf(projectile);
                    if (playerIndex !== -1) this.playerProjectiles.splice(playerIndex, 1);
                }
            }
        }
        
        // Truncate array to remove inactive projectiles
        if (activeIndex < len) {
            this.activeProjectiles.length = activeIndex;
            this.activeCount = activeIndex;
        }
    }    // Optimized draw method with batch rendering
    draw() {
        // Group projectiles by type for batched rendering
        const ctx = this.game.ctx;
        
        // Draw all player projectiles with same style in one batch
        if (this.playerProjectiles.length > 0) {
            ctx.save();
            
            // Set common styles for normal player projectiles
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00ffff';
            ctx.globalAlpha = 1.0; // Ensure alpha is reset to avoid trails
            
            // Draw normal player projectiles
            for (const projectile of this.playerProjectiles) {
                if (!projectile.active || projectile.powerupType !== 'normal') continue;
                
                ctx.fillRect(
                    projectile.x - projectile.halfWidth, 
                    projectile.y - projectile.halfHeight, 
                    projectile.width, 
                    projectile.height
                );
            }
            
            ctx.restore(); // Restore context before individual projectile drawing
            
            // Draw special projectiles individually
            for (const projectile of this.playerProjectiles) {
                if (!projectile.active || projectile.powerupType === 'normal') continue;
                projectile.draw();
            }
        }
          // Draw all enemy projectiles
        if (this.enemyProjectiles.length > 0) {
            ctx.save();
            
            // Set common styles for enemy projectiles
            ctx.fillStyle = '#ff3300';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff6600';
            ctx.globalAlpha = 1.0; // Ensure alpha is reset to avoid trails
            
            // Draw basic enemy projectiles first for batch optimization
            for (const projectile of this.enemyProjectiles) {
                if (!projectile.active) continue;
                
                // Only draw simple projectiles in batch, handle special ones individually
                if (!projectile.isSpecial) {
                    ctx.fillRect(
                        projectile.x - projectile.halfWidth,
                        projectile.y - projectile.halfHeight,
                        projectile.width,
                        projectile.height
                    );
                }
            }
            
            ctx.restore();
            
            // Draw special projectiles individually to allow for special effects
            for (const projectile of this.enemyProjectiles) {
                if (!projectile.active || !projectile.isSpecial) continue;
                projectile.draw();
            }
        }
    }

    clear() {
        // Return all active projectiles to pool
        while (this.activeProjectiles.length) {
            const projectile = this.activeProjectiles.pop();
            projectile.active = false;
            this.pool.push(projectile);
        }
        
        // Also clear type-specific arrays
        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        this.activeCount = 0;
    }

    // Handle enemy collision with potential powerup generation
    handleEnemyCollision(projectile, enemy) {
        // Only create powerups on the exact position of destroyed enemy ships
        if (!enemy || !enemy.active) return; // Safety check
        const powerupType = projectile.checkPowerupDrop(enemy.type);
        
        if (powerupType) {
            // Create a powerup at the enemy's EXACT position
            this.game.createPowerup({
                x: enemy.x,
                y: enemy.y,
                type: powerupType,
                fromEnemyDestruction: true, // Flag to indicate this powerup came from destroying an enemy
                shipType: enemy.type // Store the type of ship that dropped it
            });
        }
    }

    // Handle level transitions with powerups
    handleLevelTransition() {
        // Reset any projectiles that came from time-based powerups or
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            if (projectile.fromTimedPowerup || (projectile.powerupType !== 'normal' && !projectile.persistBetweenLevels)) {
                projectile.active = false;
                this.activeProjectiles.splice(i, 1);
                this.pool.push(projectile);
            }
        }
        // Signal the game to clear any active time-based powerups except extraLife
        if (this.game.clearTimedPowerups) {
            this.game.clearTimedPowerups();
        }
        if (this.game.clearNonPersistentPowerups) {
            this.game.clearNonPersistentPowerups();
        }
    }

    // Remove all powerups when last enemy is destroyed
    clearPowerupsOnLastEnemy() {
        // Check if all enemies are destroyed before clearing powerups
        const enemiesRemaining = this.game.countActiveEnemies ? this.game.countActiveEnemies() : 0;
        if (enemiesRemaining <= 0) {
            // This should be called from the game class when the last enemy is destroyed
            if (this.game.clearAllPowerups) {
                this.game.clearAllPowerups();
            }
        }
    }

    // New method to clear all non-persistent powerups
    clearNonPersistentPowerups() {
        // This should be called during level transitions
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            // If it's not a normal shot and not an extraLife powerup, remove it
            if (projectile.powerupType !== 'normal' && !projectile.persistBetweenLevels) {
                projectile.active = false;
                this.activeProjectiles.splice(i, 1);
                this.pool.push(projectile);
            }
        }
    }
}

// Make sure ProjectilePool is accessible globally
if (typeof window !== 'undefined') {
    window.ProjectilePool = ProjectilePool;
}

// For ES modules support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { Projectile, ProjectilePool };
}
