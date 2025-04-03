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
        this.isEnemy = this.type === 'enemy'; 0; // Support for horizontal movement
        this.active = true;.type === 'enemy';
        return this;= true;
    }   return this;
    }
    update() {
        this.y += this.speed;
        this.y += this.speed;
        // Check if out of screen
        if (this.y < -50 || velocity if any
            this.y > this.game.height + 50 ||
            this.x < -50 || elocityX;
            this.x > this.game.width + 50) {
            this.active = false;
        }/ Check if out of screen
    }   if (this.y < -50 || 
            this.y > this.game.height + 50 ||
    draw() {this.x < -50 || 
        if (!this.active) return;dth + 50) {
            this.active = false;
        if (this.type === 'player') {
            if (this.powerupType === 'rapid') {
                // Draw rapid shot bullet - either a different sprite or a modified version
                this.game.ctx.save();
                this.game.ctx.fillStyle = '#00FFFF'; // Cyan color for rapid shots
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                this.game.ctx.fill();'rapid') {
                this.game.ctx.restore();t - with a more distinct appearance
            } else {.game.ctx.save();
                sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
            }   // Create a more distinctive rapid fire bullet
        } else {// Outer glow
            sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }       this.game.ctx.beginPath();
    }           this.game.ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
}               this.game.ctx.fill();
                
// ProjectilePool - Object pooling to improve performance by reducing garbage collection
class ProjectilePool {ame.ctx.fillStyle = '#00FFFF';
    constructor(game, initialSize = 50) {;
        this.game = game;.ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
        this.pool = [];me.ctx.fill();
        this.activeProjectiles = [];
                this.game.ctx.restore();
        // Pre-initialize pool with objects
        for (let i = 0; i < initialSize; i++) {game.ctx, this.x, this.y);
            this.pool.push(new Projectile({ game }));
        } else {
    }       sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }
    get(options) {
        // Get projectile from pool or create new one if needed
        let projectile = this.pool.pop() || new Projectile({ game: this.game });
        projectile.reset(options); to improve performance by reducing garbage collection
        this.activeProjectiles.push(projectile);
        return projectile;ialSize = 50) {
    }   this.game = game;
        this.pool = [];
    // New method for creating rapid fire shot patterns
    createRapidShot(x, y, options = {}) {
        // Create a more intense spread of 5 bullets for rapid fire
        const baseOptions = {nitialSize; i++) {
            ...options,ush(new Projectile({ game }));
            x,
            y,
            type: 'player',
            powerupType: 'rapid',
            damage: options.damage || 2,reate new one if needed
            speed: options.speed || -12 // Faster bullets) || new Projectile({ game: this.game });
        };ojectile.reset(options);
        this.activeProjectiles.push(projectile);
        // Center bullet - fasteste;
        this.get({...baseOptions});
        
        // Inner side bullets shot patterns
        this.get({t(x, y, options = {}) {
            ...baseOptions,of 3 bullets for rapid fire
            x: x - 8,ions = {
            speed: baseOptions.speed * 0.95,
            velocityX: -0.5
        }); y,
            type: 'player',
        this.get({pType: 'rapid',
            ...baseOptions,.damage || 2,
            x: x + 8,tions.speed || -10
            speed: baseOptions.speed * 0.95,
            velocityX: 0.5
        });Center bullet
           this.get({...baseOptions});
        // Outer side bullets - with more spread    
        this.get({e bullets with slight angle
            ...baseOptions,
            x: x - 16,
            y: y + 5, // Start slightly lower
            speed: baseOptions.speed * 0.9,speed: baseOptions.speed * 0.9, // Slightly slower
            velocityX: -1
        });
        
        this.get({get({
            ...baseOptions,...baseOptions,
            x: x + 16,
            y: y + 5, // Start slightly lowerspeed: baseOptions.speed * 0.9,
            speed: baseOptions.speed * 0.9,
            velocityX: 1
        });
    }
    {
    update() {/ Update all active projectiles
        // Update all active projectiles   for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {        const projectile = this.activeProjectiles[i];
            const projectile = this.activeProjectiles[i];
            tal movement (for spread shots)
            // Add support for horizontal movement (for spread shots)
            if (projectile.velocityX) {           projectile.x += projectile.velocityX;
                projectile.x += projectile.velocityX;        }
            }
            
            projectile.update();
            the pool
            // If projectile is no longer active, return to the pool
            if (!projectile.active) {splice(i, 1);
                this.activeProjectiles.splice(i, 1);       this.pool.push(projectile);
                this.pool.push(projectile);       }
            }       }
        }    }

















}    }        }            this.pool.push(projectile);            projectile.active = false;            const projectile = this.activeProjectiles.pop();        while (this.activeProjectiles.length) {        // Return all active projectiles to pool    clear() {        }        this.activeProjectiles.forEach(projectile => projectile.draw());        // Draw all active projectiles    draw() {        }    
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
