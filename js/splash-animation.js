// Splash screen animations for Galaga
class SplashAnimation {
    constructor() {
        // Create canvas for splash screen animations
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimization: disable alpha for better performance
        
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
            direction: 1, // 1 = right, -1 = left
            lastX: -50 // For smooth interpolation
        };
        
        this.enemy = {
            x: -150,
            y: this.canvas.height * 0.3,
            width: 36,
            height: 36,
            speed: 2.5,
            wobble: 0,
            shootCooldown: 60,
            shootTimer: 0,
            lastX: -150, // For smooth interpolation
            lastY: this.canvas.height * 0.3 // For smooth interpolation
        };
        
        // Object pool for projectiles
        this.projectilePool = [];
        this.activeProjectiles = [];
        this.maxProjectiles = 20; // Pool size
        
        // Pre-populate the object pool
        for (let i = 0; i < this.maxProjectiles; i++) {
            this.projectilePool.push({
                x: 0,
                y: 0,
                speedX: 0,
                speedY: 0,
                type: 'enemy',
                radius: 4,
                active: false
            });
        }
        
        // Pre-calculate gradients and cache them
        this.createCachedGradients();
        
        // Animation properties
        this.animationId = null;
        this.thrusterAnimation = 0;
        this.lastFrameTime = 0;
        this.targetDeltaTime = 1000 / 60; // Target 60fps
        
        // Debounce resize timing
        this.resizeTimeout = null;
        this.resizeDelay = 150; // ms
        
        // Start animation loop
        this.animate();
        
        // Handle window resize with debounce
        window.addEventListener('resize', () => this.debouncedResize());
    }
    
    // Create cached gradient patterns for better performance
    createCachedGradients() {
        // Cache thruster gradient
        const thrusterCanvas = document.createElement('canvas');
        thrusterCanvas.width = 10;
        thrusterCanvas.height = 25;
        const thrusterCtx = thrusterCanvas.getContext('2d');
        
        const flameGradient = thrusterCtx.createLinearGradient(0, 0, 0, 25);
        flameGradient.addColorStop(0, '#FFFFFF');
        flameGradient.addColorStop(0.3, '#0080FF');
        flameGradient.addColorStop(0.8, 'rgba(0,50,255,0.5)');
        flameGradient.addColorStop(1, 'rgba(0,0,255,0)');
        
        thrusterCtx.fillStyle = flameGradient;
        thrusterCtx.fillRect(0, 0, 10, 25);
        this.thrusterPattern = thrusterCanvas;
    }
    
    debouncedResize() {
        // Clear previous timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Set new timeout
        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, this.resizeDelay);
    }
    
    handleResize() {
        if (!this.container) return;
        
        // Update canvas width while keeping height fixed
        this.canvas.width = this.container.offsetWidth;
    }
    
    animate(currentTime = 0) {
        // Calculate delta time for consistent animation speed
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Skip frame if tab is inactive (deltaTime too large)
        if (deltaTime > 100) {
            this.animationId = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Adjust speed based on time passed
        const timeMultiplier = deltaTime / this.targetDeltaTime;
        
        // Clear canvas - use fillRect for better performance with alpha disabled
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update positions
        this.updatePositions(timeMultiplier);
        
        // Update and draw projectiles
        this.updateProjectiles(timeMultiplier);
        
        // Draw entities using batched drawing for better performance
        this.drawEntities();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    updatePositions(timeMultiplier) {
        // Store previous positions for interpolation
        this.player.lastX = this.player.x;
        this.enemy.lastX = this.enemy.x;
        this.enemy.lastY = this.enemy.y;
        
        // Update player position with consistent speed regardless of framerate
        this.player.x += this.player.speed * this.player.direction * timeMultiplier;
        
        // Handle player direction changes at screen edges
        if (this.player.x > this.canvas.width + 50 && this.player.direction > 0) {
            // Moving right and went off screen, change to coming from left
            this.player.x = -50;
            this.player.lastX = -50;
            
            // Also reposition enemy to continue the chase pattern
            this.enemy.x = -150;
            this.enemy.lastX = -150;
        } else if (this.player.x < -50 && this.player.direction < 0) {
            // Moving left and went off screen, change to coming from right
            this.player.x = this.canvas.width + 50;
            this.player.lastX = this.canvas.width + 50;
            
            // Also reposition enemy to continue the chase pattern
            this.enemy.x = this.canvas.width + 150;
            this.enemy.lastX = this.canvas.width + 150;
        }
        
        // Randomly change direction sometimes (reduced probability for smoother experience)
        if (Math.random() < 0.001 * timeMultiplier) {
            this.player.direction *= -1;
        }
        
        // Update enemy position with smooth following and easing
        // Always follow behind the player based on player's direction
        const followDistance = 120; // Distance to maintain behind player
        let targetX;
        
        if (this.player.direction > 0) {
            // Player moving right, enemy should follow from left
            targetX = this.player.x - followDistance;
        } else {
            // Player moving left, enemy should follow from right
            targetX = this.player.x + followDistance;
        }
        
        const dx = targetX - this.enemy.x;
        this.enemy.x += dx * 0.03 * timeMultiplier; // Easing factor
        
        // Don't wrap enemy around edges independently
        // (Removed the enemy edge constraints that were here before)
        
        // Add wobble motion to enemy with consistent speed
        this.enemy.wobble += 0.1 * timeMultiplier;
        this.enemy.y = (this.canvas.height * 0.3) + Math.sin(this.enemy.wobble) * 15;
        
        // Update enemy shooting - only shoot when enemy is behind player
        this.enemy.shootTimer += timeMultiplier;
        if (this.enemy.shootTimer > this.enemy.shootCooldown) {
            // Check if enemy is in a position to shoot (based on relative direction)
            const canShoot = (this.player.direction > 0 && this.enemy.x < this.player.x) || 
                            (this.player.direction < 0 && this.enemy.x > this.player.x);
                            
            if (canShoot && Math.abs(this.enemy.x - this.player.x) < 300) {
                // Aim ahead of player (but miss on purpose)
                const targetPos = {
                    x: this.player.x + (this.player.direction * 20) + (Math.random() * 30 - 15), // random offset to miss
                    y: this.player.y + (Math.random() * 30 - 15)  // random offset to miss
                };
                
                // Calculate direction vector to target
                const dx = targetPos.x - this.enemy.x;
                const dy = targetPos.y - this.enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize and set speed
                const projectileSpeed = 4;
                const speedX = (dx / dist) * projectileSpeed;
                const speedY = (dy / dist) * projectileSpeed;
                
                this.getProjectile(this.enemy.x, this.enemy.y + 20, speedX, speedY, 'enemy');
                this.enemy.shootTimer = 0;
                this.enemy.shootCooldown = 30 + Math.random() * 50; // Random cooldown
            }
        }
        
        // Update thruster animation
        this.thrusterAnimation += 0.2 * timeMultiplier;
        if (this.thrusterAnimation >= Math.PI * 2) {
            this.thrusterAnimation = 0;
        }
    }
    
    // Get projectile from pool or create new one if needed
    getProjectile(x, y, speedX, speedY, type) {
        // Try to reuse an object from the pool first
        for (let i = 0; i < this.projectilePool.length; i++) {
            if (!this.projectilePool[i].active) {
                const projectile = this.projectilePool[i];
                projectile.x = x;
                projectile.y = y;
                projectile.speedX = speedX;
                projectile.speedY = speedY;
                projectile.type = type;
                projectile.radius = type === 'player' ? 3 : 4;
                projectile.active = true;
                
                this.activeProjectiles.push(projectile);
                return projectile;
            }
        }
        
        // If we get here, the pool is depleted but we'll reuse the oldest projectile
        if (this.activeProjectiles.length > 0) {
            const oldestProjectile = this.activeProjectiles.shift();
            oldestProjectile.x = x;
            oldestProjectile.y = y;
            oldestProjectile.speedX = speedX;
            oldestProjectile.speedY = speedY;
            oldestProjectile.type = type;
            oldestProjectile.radius = type === 'player' ? 3 : 4;
            oldestProjectile.active = true;
            
            this.activeProjectiles.push(oldestProjectile);
            return oldestProjectile;
        }
        
        return null;
    }
    
    updateProjectiles(timeMultiplier) {
        // Batch processing of projectiles for better performance
        let enemyProjectiles = [];
        let playerProjectiles = [];
        
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Update position with consistent speed
            projectile.x += projectile.speedX * timeMultiplier;
            projectile.y += projectile.speedY * timeMultiplier;
            
            // Check if off screen
            if (projectile.y < -20 || 
                projectile.y > this.canvas.height + 20 || 
                projectile.x < -20 || 
                projectile.x > this.canvas.width + 20) {
                
                // Deactivate and remove from active list
                projectile.active = false;
                this.activeProjectiles.splice(i, 1);
                continue;
            }
            
            // Sort projectiles by type for batch rendering
            if (projectile.type === 'player') {
                playerProjectiles.push(projectile);
            } else {
                enemyProjectiles.push(projectile);
            }
        }
        
        // Draw enemy projectiles in batch
        if (enemyProjectiles.length > 0) {
            this.ctx.save();
            this.ctx.fillStyle = '#FF3300';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = '#FF3300';
            
            for (const projectile of enemyProjectiles) {
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        // Draw player projectiles in batch
        if (playerProjectiles.length > 0) {
            this.ctx.save();
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = '#00FFFF';
            
            for (const projectile of playerProjectiles) {
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
    
    // Separate drawing function for entities to improve organization
    drawEntities() {
        this.drawPlayer();
        this.drawEnemy();
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
        
        // Rotate 90 degrees to make the ship face horizontally, then adjust based on direction
        if (direction > 0) {
            // Moving right - face right (90 degrees rotation)
            ctx.rotate(Math.PI / 2);
        } else {
            // Moving left - face left (270 degrees rotation)
            ctx.rotate(-Math.PI / 2);
        }
        
        // Draw thruster flame (behind the ship) using cached pattern for better performance
        const flameHeight = 15 + 5 * Math.sin(this.thrusterAnimation);
        
        ctx.save();
        ctx.translate(-5, height/2);
        ctx.scale(1, flameHeight/25);
        ctx.drawImage(this.thrusterPattern, 0, 0);
        ctx.restore();
        
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
        
        // Add minor pulsing glow effect to enemy ship
        const pulseIntensity = 5 + Math.sin(this.thrusterAnimation) * 3;
        ctx.shadowBlur = pulseIntensity;
        
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
        
        // Clear all resources
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Remove event listeners - this is important to prevent memory leaks
        window.removeEventListener('resize', this.debouncedResize);
    }
}

// Initialize the splash animation when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.splashAnimation = new SplashAnimation();
});