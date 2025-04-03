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
        this.canvas.height = this.container.offsetHeight;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        
        // Add canvas to container
        this.container.appendChild(this.canvas);
        
        // Initialize animation entities
        this.player = {
            x: -50,
            y: this.canvas.height * 0.6,
            width: 40,
            height: 40,
            speed: 3
        };
        
        this.enemy = {
            x: -150,
            y: this.canvas.height * 0.6 - 50,
            width: 36,
            height: 36,
            speed: 2.5,
            wobble: 0
        };
        
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
        
        // Update canvas dimensions
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }
    
    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update positions
        this.updatePositions();
        
        // Draw entities
        this.drawPlayer();
        this.drawEnemy();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updatePositions() {
        // Update player position
        this.player.x += this.player.speed;
        
        // Reset player when it goes off-screen
        if (this.player.x > this.canvas.width + 50) {
            this.player.x = -50;
        }
        
        // Update enemy position (follows player with delay)
        this.enemy.x += this.enemy.speed;
        
        // Reset enemy when it goes off-screen
        if (this.enemy.x > this.canvas.width + 50) {
            this.enemy.x = -150;
        }
        
        // Add wobble motion to enemy
        this.enemy.wobble += 0.1;
        this.enemy.y = (this.canvas.height * 0.6 - 50) + Math.sin(this.enemy.wobble) * 15;
        
        // Update thruster animation
        this.thrusterAnimation += 0.2;
    }
    
    drawPlayer() {
        const ctx = this.ctx;
        const x = this.player.x;
        const y = this.player.y;
        const width = this.player.width;
        const height = this.player.height;
        
        // Draw thruster flame
        const flameHeight = 15 + 5 * Math.sin(this.thrusterAnimation);
        
        ctx.save();
        const gradient = ctx.createLinearGradient(
            x, y + height/2,
            x, y + height/2 + flameHeight
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#0080FF');
        gradient.addColorStop(0.8, 'rgba(0,50,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - 5, y + height/2);
        ctx.lineTo(x, y + height/2 + flameHeight);
        ctx.lineTo(x + 5, y + height/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Draw ship body (blue triangle)
        ctx.fillStyle = '#1E90FF';
        ctx.beginPath();
        ctx.moveTo(x, y - height/2);
        ctx.lineTo(x + width/2, y + height/2);
        ctx.lineTo(x - width/2, y + height/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw cockpit (white circle)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, width/4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawEnemy() {
        const ctx = this.ctx;
        const x = this.enemy.x;
        const y = this.enemy.y;
        const width = this.enemy.width;
        const height = this.enemy.height;
        
        // Main body (red)
        ctx.fillStyle = '#FF0000';
        
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
        ctx.beginPath();
        ctx.arc(x - width/5, y + height/2, width/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width/5, y + height/2, width/8, 0, Math.PI * 2);
        ctx.fill();
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