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
        
        // Initialize animation entities with enhanced properties
        this.player = {
            x: -50,
            y: this.canvas.height * 0.5,
            width: 40,
            height: 40,
            speed: 3,
            direction: 1, // 1 = right, -1 = left
            lastX: -50, // For smooth interpolation
            enginePulse: 0 // For engine animation effect
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
            lastY: this.canvas.height * 0.3, // For smooth interpolation
            engineGlow: 0 // For enemy engine glow effect
        };
        
        // Background stars for depth effect
        this.stars = [];
        this.initStars();
        
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
        
        // Pre-calculate gradients and cache ship models
        this.createCachedAssets();
        
        // Animation properties
        this.animationId = null;
        this.thrusterAnimation = 0;
        this.lastFrameTime = 0;
        this.targetDeltaTime = 1000 / 60; // Target 60fps
        
        // Visual effects
        this.explosionParticles = [];
        
        // Debounce resize timing
        this.resizeTimeout = null;
        this.resizeDelay = 150; // ms
        
        // Start animation loop
        this.animate();
        
        // Handle window resize with debounce
        window.addEventListener('resize', () => this.debouncedResize());
    }
    
    // Initialize star field
    initStars() {
        const starCount = Math.floor(this.canvas.width / 15); // Appropriate number of stars based on width
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    // Create cached gradient patterns and pre-rendered ships for better performance
    createCachedAssets() {
        // Cache thruster gradient
        const thrusterCanvas = document.createElement('canvas');
        thrusterCanvas.width = 10;
        thrusterCanvas.height = 25;
        const thrusterCtx = thrusterCanvas.getContext('2d');
        
        const flameGradient = thrusterCtx.createLinearGradient(0, 0, 0, 25);
        flameGradient.addColorStop(0, '#FFFFFF');
        flameGradient.addColorStop(0.2, '#88CCFF');
        flameGradient.addColorStop(0.4, '#0080FF');
        flameGradient.addColorStop(0.8, 'rgba(0,50,255,0.5)');
        flameGradient.addColorStop(1, 'rgba(0,0,255,0)');
        
        thrusterCtx.fillStyle = flameGradient;
        thrusterCtx.fillRect(0, 0, 10, 25);
        this.thrusterPattern = thrusterCanvas;
        
        // Pre-render player ship facing right
        const shipSize = 60; // Larger size for more detail
        this.playerShipRight = document.createElement('canvas');
        this.playerShipRight.width = shipSize;
        this.playerShipRight.height = shipSize;
        const shipCtx = this.playerShipRight.getContext('2d');
        
        // Center point
        const centerX = shipSize / 2;
        const centerY = shipSize / 2;
        
        // Ship dimensions
        const width = 40;
        const height = 40;
        
        // Draw with high quality
        shipCtx.save();
        shipCtx.translate(centerX, centerY);
        
        // Draw body
        shipCtx.fillStyle = '#1E90FF';
        shipCtx.shadowBlur = 10;
        shipCtx.shadowColor = '#0080FF';
        shipCtx.beginPath();
        shipCtx.moveTo(0, -height/2);
        shipCtx.lineTo(width/2, height/2);
        shipCtx.lineTo(-width/2, height/2);
        shipCtx.closePath();
        shipCtx.fill();
        
        // Draw details - wing edges
        shipCtx.strokeStyle = '#ADD8E6';
        shipCtx.lineWidth = 2;
        shipCtx.beginPath();
        shipCtx.moveTo(0, -height/2);
        shipCtx.lineTo(width/2, height/2);
        shipCtx.lineTo(-width/2, height/2);
        shipCtx.closePath();
        shipCtx.stroke();
        
        // Draw cockpit
        shipCtx.fillStyle = '#FFFFFF';
        shipCtx.shadowBlur = 5;
        shipCtx.shadowColor = '#FFFFFF';
        shipCtx.beginPath();
        shipCtx.arc(0, 0, width/4, 0, Math.PI * 2);
        shipCtx.fill();
        
        // Add inner cockpit detail
        shipCtx.fillStyle = '#B0E2FF';
        shipCtx.beginPath();
        shipCtx.arc(0, 0, width/8, 0, Math.PI * 2);
        shipCtx.fill();
        
        shipCtx.restore();
        
        // Create left-facing ship by flipping the right-facing one
        this.playerShipLeft = document.createElement('canvas');
        this.playerShipLeft.width = shipSize;
        this.playerShipLeft.height = shipSize;
        const leftShipCtx = this.playerShipLeft.getContext('2d');
        
        // Flip horizontally
        leftShipCtx.translate(shipSize, 0);
        leftShipCtx.scale(-1, 1);
        leftShipCtx.drawImage(this.playerShipRight, 0, 0);
        
        // Pre-render enemy ship
        const enemySize = 60;
        this.enemyShip = document.createElement('canvas');
        this.enemyShip.width = enemySize;
        this.enemyShip.height = enemySize;
        const enemyCtx = this.enemyShip.getContext('2d');
        
        // Center point
        const eCenterX = enemySize / 2;
        const eCenterY = enemySize / 2;
        
        enemyCtx.save();
        enemyCtx.translate(eCenterX, eCenterY);
        
        // Draw main body
        enemyCtx.fillStyle = '#FF0000';
        enemyCtx.shadowBlur = 10;
        enemyCtx.shadowColor = '#FF0000';
        
        // Enhanced body shape for Galaga-style enemy
        const eWidth = 36;
        const eHeight = 36;
        
        // Alien body
        enemyCtx.beginPath();
        enemyCtx.moveTo(0, -eHeight/2); // Top center
        enemyCtx.lineTo(eWidth/2, -eHeight/4); // Upper right
        enemyCtx.lineTo(eWidth/2.2, eHeight/3); // Right wing
        enemyCtx.lineTo(eWidth/3, eHeight/2); // Bottom right
        enemyCtx.lineTo(-eWidth/3, eHeight/2); // Bottom left
        enemyCtx.lineTo(-eWidth/2.2, eHeight/3); // Left wing
        enemyCtx.lineTo(-eWidth/2, -eHeight/4); // Upper left
        enemyCtx.closePath();
        enemyCtx.fill();
        
        // Body details
        enemyCtx.strokeStyle = '#FFDD00';
        enemyCtx.lineWidth = 1;
        enemyCtx.beginPath();
        enemyCtx.moveTo(-eWidth/3, eHeight/6);
        enemyCtx.lineTo(eWidth/3, eHeight/6);
        enemyCtx.stroke();
        
        enemyCtx.beginPath();
        enemyCtx.moveTo(-eWidth/4, -eHeight/6);
        enemyCtx.lineTo(eWidth/4, -eHeight/6);
        enemyCtx.stroke();
        
        // Eyes (white with red pupils)
        enemyCtx.fillStyle = '#FFFFFF';
        enemyCtx.shadowBlur = 5;
        enemyCtx.shadowColor = '#FFFFFF';
        
        // Left eye
        enemyCtx.beginPath();
        enemyCtx.arc(-eWidth/5, eHeight/5, eWidth/8, 0, Math.PI * 2);
        enemyCtx.fill();
        
        // Right eye
        enemyCtx.beginPath();
        enemyCtx.arc(eWidth/5, eHeight/5, eWidth/8, 0, Math.PI * 2);
        enemyCtx.fill();
        
        // Red pupils
        enemyCtx.fillStyle = '#FF0000';
        enemyCtx.shadowBlur = 3;
        enemyCtx.shadowColor = '#FF0000';
        
        enemyCtx.beginPath();
        enemyCtx.arc(-eWidth/5, eHeight/5, eWidth/16, 0, Math.PI * 2);
        enemyCtx.fill();
        
        enemyCtx.beginPath();
        enemyCtx.arc(eWidth/5, eHeight/5, eWidth/16, 0, Math.PI * 2);
        enemyCtx.fill();
        
        enemyCtx.restore();
        
        // Create projectile effects
        this.projectileGlow = document.createElement('canvas');
        this.projectileGlow.width = 16;
        this.projectileGlow.height = 16;
        const glowCtx = this.projectileGlow.getContext('2d');
        
        // Enemy projectile (red)
        const enemyGradient = glowCtx.createRadialGradient(8, 8, 1, 8, 8, 8);
        enemyGradient.addColorStop(0, '#FF3300');
        enemyGradient.addColorStop(0.3, 'rgba(255, 51, 0, 0.8)');
        enemyGradient.addColorStop(1, 'rgba(255, 51, 0, 0)');
        
        glowCtx.fillStyle = enemyGradient;
        glowCtx.fillRect(0, 0, 16, 16);
        
        this.enemyProjectileGlow = this.projectileGlow;
        
        // Player projectile (blue) - create another canvas
        this.playerProjectileGlow = document.createElement('canvas');
        this.playerProjectileGlow.width = 12;
        this.playerProjectileGlow.height = 12;
        const playerGlowCtx = this.playerProjectileGlow.getContext('2d');
        
        const playerGradient = playerGlowCtx.createRadialGradient(6, 6, 1, 6, 6, 6);
        playerGradient.addColorStop(0, '#00FFFF');
        playerGradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
        playerGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        playerGlowCtx.fillStyle = playerGradient;
        playerGlowCtx.fillRect(0, 0, 12, 12);
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
        
        // Draw starfield background
        this.drawStars(timeMultiplier);
        
        // Update positions
        this.updatePositions(timeMultiplier);
        
        // Update and draw projectiles
        this.updateProjectiles(timeMultiplier);
        
        // Draw entities using batched drawing for better performance
        this.drawEntities();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    // Draw starfield for depth effect
    drawStars(timeMultiplier) {
        this.ctx.save();
        
        // Update and draw stars with parallax effect
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Move stars in opposite direction of player for parallax effect
            star.x -= star.speed * this.player.direction * timeMultiplier;
            
            // If star moves off-screen, wrap around
            if (star.x < 0) {
                star.x = this.canvas.width;
            } else if (star.x > this.canvas.width) {
                star.x = 0;
            }
            
            // Draw star with slight twinkle effect
            const twinkle = 0.7 + (Math.sin(this.thrusterAnimation * 2 + i) * 0.3);
            const size = star.size * twinkle;
            
            const brightness = Math.floor(150 + Math.random() * 105); // Random brightness
            this.ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
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
        // Update all projectile positions
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
        }
        
        // Draw all projectiles using cached glow patterns for better performance
        for (let i = 0; i < this.activeProjectiles.length; i++) {
            const projectile = this.activeProjectiles[i];
            
            if (projectile.type === 'enemy') {
                // Use pre-rendered glow pattern for enemy projectile
                this.ctx.drawImage(
                    this.enemyProjectileGlow,
                    projectile.x - 8,
                    projectile.y - 8
                );
                
                // Add bright center
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Use pre-rendered glow pattern for player projectile
                this.ctx.drawImage(
                    this.playerProjectileGlow,
                    projectile.x - 6,
                    projectile.y - 6
                );
                
                // Add bright center
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    // Separate drawing function for entities to improve organization
    drawEntities() {
        this.drawPlayer();
        this.drawEnemy();
    }
    
    // Draw player ship with improved thruster effect
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
        if (direction > 0) {
            // Moving right - face right (90 degrees rotation)
            ctx.rotate(Math.PI / 2);
        } else {
            // Moving left - face left (270 degrees rotation)
            ctx.rotate(-Math.PI / 2);
        }
        
        // Draw dynamic thruster flame
        const thrusterBaseWidth = 10;
        const thrusterLength = 15 + 5 * Math.sin(this.thrusterAnimation);
        
        // Thruster position
        const thrusterX = 0;
        const thrusterY = height/2;
        
        // Create gradient for thruster effect
        const gradient = ctx.createLinearGradient(
            thrusterX, thrusterY,
            thrusterX, thrusterY + thrusterLength
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.2, 'rgba(50, 150, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
        
        ctx.fillStyle = gradient;
        
        // Draw flame
        ctx.beginPath();
        ctx.moveTo(thrusterX - thrusterBaseWidth/2, thrusterY);
        ctx.lineTo(thrusterX, thrusterY + thrusterLength);
        ctx.lineTo(thrusterX + thrusterBaseWidth/2, thrusterY);
        ctx.closePath();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0080FF';
        ctx.beginPath();
        ctx.arc(thrusterX, thrusterY + thrusterLength/3, thrusterLength/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 150, 255, 0.3)';
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow for ship drawing
        
        // Draw pre-rendered ship - based on direction
        const shipSize = 60; // Size of pre-rendered ship
        const drawWidth = width * 1.1; // Slightly larger than original
        const drawHeight = height * 1.1;
        
        // Draw ship centered on position
        ctx.drawImage(
            direction > 0 ? this.playerShipRight : this.playerShipLeft,
            -drawWidth/2,
            -drawHeight/2,
            drawWidth,
            drawHeight
        );
        
        ctx.restore();
    }
    
    // Draw enemy with glow effects
    drawEnemy() {
        const ctx = this.ctx;
        const x = this.enemy.x;
        const y = this.enemy.y;
        const width = this.enemy.width * 1.2; // Slightly larger for better visibility
        const height = this.enemy.height * 1.2;
        
        // Update enemy engine glow
        this.enemy.engineGlow = (this.enemy.engineGlow + 0.05) % (Math.PI * 2);
        const glowIntensity = 5 + Math.sin(this.enemy.engineGlow) * 3;
        
        ctx.save();
        
        // Add engine glow effect
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = '#FF0000';
        
        // Draw pre-rendered enemy ship
        ctx.drawImage(
            this.enemyShip,
            x - width/2,
            y - height/2,
            width,
            height
        );
        
        // Add additional glow effects based on shooting state
        if (this.enemy.shootTimer < 10) {
            const alpha = 0.7 - (this.enemy.shootTimer / 10);
            ctx.fillStyle = `rgba(255, 50, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y + height/3, width/4, 0, Math.PI * 2);
            ctx.fill();
        }
        
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