// Splash screen animations for Galaga
class SplashAnimation {
    constructor() {
        // Create canvas for splash screen animations
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Position elements
        this.container = document.getElementById('animation-container');
        if (!this.container) return;
        
        // Set canvas dimensions
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = 200; // Fixed height at the top
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        
        // Add canvas to container
        this.container.appendChild(this.canvas);
        
        // Initialize animation entities
        this.player = {
            x: -50,
            y: this.canvas.height * 0.5,
            width: 40,
            height: 40,
            speed: 3,
            direction: 1 // 1 = right, -1 = left
        };
        
        this.enemy = {
            x: -150,
            y: this.canvas.height * 0.3,
            width: 36,
            height: 36,
            speed: 2.5,
            wobble: 0,
            shootCooldown: 60,
            shootTimer: 0
        };
        
        // Projectiles array
        this.projectiles = [];
        
        // Animation properties
        this.animationId = null;
        this.thrusterAnimation = 0;
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        if (!this.container) return;
        
        // Update canvas width while keeping height fixed
        this.canvas.width = this.container.offsetWidth;
    }
    
    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update positions
        this.updatePositions();
        
        // Update and draw projectiles
        this.updateProjectiles();
        
        // Draw entities
        this.drawPlayer();
        this.drawEnemy();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updatePositions() {
        // Update player position
        this.player.x += this.player.speed * this.player.direction;
        
        // Handle player direction changes at screen edges
        if (this.player.x > this.canvas.width + 50 && this.player.direction > 0) {
            // Moving right and went off screen, change to coming from left
            this.player.x = -50;
        } else if (this.player.x < -50 && this.player.direction < 0) {
            // Moving left and went off screen, change to coming from right
            this.player.x = this.canvas.width + 50;
        }
        
        // Randomly change direction sometimes
        if (Math.random() < 0.002) {
            this.player.direction *= -1;
        }
        
        // Update enemy position (follows player)
        if (this.enemy.x < this.player.x - 20) {
            this.enemy.x += this.enemy.speed;
        } else if (this.enemy.x > this.player.x + 20) {
            this.enemy.x -= this.enemy.speed * 0.5;
        }
        
        // Reset enemy if it goes off-screen
        if (this.enemy.x > this.canvas.width + 100) {
            this.enemy.x = -100;
        } else if (this.enemy.x < -100) {
            this.enemy.x = this.canvas.width + 100;
        }
        
        // Add wobble motion to enemy
        this.enemy.wobble += 0.1;
        this.enemy.y = (this.canvas.height * 0.3) + Math.sin(this.enemy.wobble) * 15;
        
        // Update enemy shooting
        this.enemy.shootTimer++;
        if (this.enemy.shootTimer > this.enemy.shootCooldown) {
            // Enemy shoots when player is in reasonable range
            if (Math.abs(this.enemy.x - this.player.x) < 200) {
                this.createProjectile(this.enemy.x, this.enemy.y + 20, 0, 5, 'enemy');
                this.enemy.shootTimer = 0;
                this.enemy.shootCooldown = 30 + Math.random() * 90; // Random cooldown
            }
        }
        
        // Update thruster animation
        this.thrusterAnimation += 0.2;
    }
    
    createProjectile(x, y, speedX, speedY, type) {
        const projectile = {
            x,
            y,
            speedX,
            speedY,
            type,
            radius: type === 'player' ? 3 : 4,
            active: true
        };
        
        this.projectiles.push(projectile);
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update position
            projectile.x += projectile.speedX;
            projectile.y += projectile.speedY;
            
            // Check if off screen
            if (projectile.y < -20 || 
                projectile.y > this.canvas.height + 20 || 
                projectile.x < -20 || 
                projectile.x > this.canvas.width + 20) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Draw projectile
            this.ctx.save();
            
            if (projectile.type === 'player') {
                // Blue player projectile with glow
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00FFFF';
            } else {
                // Red enemy projectile with glow
                this.ctx.fillStyle = '#FF3300';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#FF3300';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawPlayer() {
        const ctx = this.ctx;
        const x = this.player.x;
        const y = this.player.y;
        const width = this.player.width;
        const height = this.player.height;
        const direction = this.player.direction;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Rotate based on direction
        if (direction < 0) {
            ctx.rotate(Math.PI);
        }
        
        // Draw thruster flame (behind the ship)
        const flameHeight = 15 + 5 * Math.sin(this.thrusterAnimation);
        
        const gradient = ctx.createLinearGradient(
            0, height/2,
            0, height/2 + flameHeight
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#0080FF');
        gradient.addColorStop(0.8, 'rgba(0,50,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-5, height/2);
        ctx.lineTo(0, height/2 + flameHeight);
        ctx.lineTo(5, height/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship body (blue triangle)
        ctx.fillStyle = '#1E90FF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0080FF';
        ctx.beginPath();
        ctx.moveTo(0, -height/2);
        ctx.lineTo(width/2, height/2);
        ctx.lineTo(-width/2, height/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw cockpit (white circle)
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, width/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawEnemy() {
        const ctx = this.ctx;
        const x = this.enemy.x;
        const y = this.enemy.y;
        const width = this.enemy.width;
        const height = this.enemy.height;
        
        ctx.save();
        
        // Main body (red)
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        
        // Body
        ctx.beginPath();
        ctx.moveTo(x, y);  // Top center
        ctx.lineTo(x + width/2, y + height/3); // Right wing
        ctx.lineTo(x + width/3, y + height); // Bottom right
        ctx.lineTo(x - width/3, y + height); // Bottom left
        ctx.lineTo(x - width/2, y + height/3);  // Left wing
        ctx.closePath();
        ctx.fill();
        
        // Eyes (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - width/5, y + height/2, width/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width/5, y + height/2, width/8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize the splash animation when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.splashAnimation = new SplashAnimation();
});