// Projectiles - bullets and missiles

class Projectile {
    constructor(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.speed = options.speed || -8; // Negative for upward movement
        this.width = options.width || 5;
        this.height = options.height || 15;
        this.radius = 5;
        this.type = options.type || 'player'; // 'player' or 'enemy'
    }
    
    update() {
        this.y += this.speed;
        
        // Remove if out of screen
        return (
            this.y < -50 || 
            this.y > this.game.height + 50 ||
            this.x < -50 || 
            this.x > this.game.width + 50
        );
    }
    
    draw() {
        if (this.type === 'player') {
            sprites.playerBullet.draw(this.game.ctx, this.x, this.y);
        } else {
            sprites.enemyBullet.draw(this.game.ctx, this.x, this.y);
        }
    }
}
