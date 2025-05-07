// Splash screen animations for Galaga
class SplashAnimation {    constructor() {
        // Stop any existing animation
        if (window.splashAnimation && window.splashAnimation !== this) {
            window.splashAnimation.stopAnimation();
        }
        
        // Create and initialize canvas
        this.initCanvas();
        
        // Initialize animation entities
        this.initEntities();
        
        // Create cached assets for better performance
        this.createCachedAssets();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize with debounce
        window.addEventListener('resize', () => this.debouncedResize());
    }
    
    // Initialize canvas and container
    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimization: disable alpha
        
        this.container = document.getElementById('animation-container');
        if (!this.container) return;
        
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = 200; // Fixed height at the top
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        
        this.container.appendChild(this.canvas);
    }
    
    // Initialize animation entities and object pools
    initEntities() {
        // Player ship
        this.player = {
            x: -50,
            y: this.canvas.height * 0.5,
            width: 40,
            height: 40,
            speed: 3,
            direction: 1, // 1 = right, -1 = left
            lastX: -50,
            enginePulse: 0
        };
        
        // Enemy ship
        this.enemy = {
            x: -150,
            y: this.canvas.height * 0.3,
            width: 36,
            height: 36,
            speed: 2.5,
            wobble: 0,
            shootCooldown: 60,
            shootTimer: 0,
            lastX: -150,
            lastY: this.canvas.height * 0.3,
            engineGlow: 0
        };
        
        // Star field
        this.stars = [];
        this.initStars();
        
        // Projectile system
        this.projectilePool = [];
        this.activeProjectiles = [];
        this.maxProjectiles = 20;
        
        // Pre-populate projectile pool
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
        
        // Animation properties
        this.animationId = null;
        this.thrusterAnimation = 0;
        this.lastFrameTime = 0;
        this.targetDeltaTime = 1000 / 60; // Target 60fps
        
        // Resize handling
        this.resizeTimeout = null;
        this.resizeDelay = 150; // ms
    }
    
    // Initialize star field
    initStars() {
        const starCount = Math.floor(this.canvas.width / 15);
        
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
        // Create cached thruster effect
        this.createThrusterPattern();
        
        // Create player ships (left and right facing)
        this.createPlayerShips();
        
        // Create enemy ship
        this.createEnemyShip();
        
        // Create projectile effects
        this.createProjectileEffects();
    }
    
    // Create cached thruster pattern
    createThrusterPattern() {
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
    }
    
    // Create player ship assets
    createPlayerShips() {
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
        
        // Draw enhanced player ship body
        shipCtx.fillStyle = '#2266FF'; // Brighter blue
        shipCtx.shadowBlur = 15; // Increased glow
        shipCtx.shadowColor = '#60A0FF';
        
        // Main hull - slightly modified shape for more appeal
        shipCtx.beginPath();
        shipCtx.moveTo(0, -height/2);  // Top point
        shipCtx.quadraticCurveTo(width/4, -height/4, width/2, height/3); // Right curved wing
        shipCtx.lineTo(width/3, height/2);  // Right bottom
        shipCtx.lineTo(-width/3, height/2); // Left bottom
        shipCtx.lineTo(-width/2, height/3); // Left wing tip
        shipCtx.quadraticCurveTo(-width/4, -height/4, 0, -height/2); // Left curved wing
        shipCtx.closePath();
        shipCtx.fill();
        
        // Wing details - additional highlights
        shipCtx.strokeStyle = '#99CCFF';
        shipCtx.lineWidth = 2;
        shipCtx.beginPath();
        shipCtx.moveTo(0, -height/2);
        shipCtx.lineTo(width/3, height/3);
        shipCtx.lineTo(-width/3, height/3);
        shipCtx.closePath();
        shipCtx.stroke();
        
        // Engine highlights
        shipCtx.fillStyle = '#80C0FF';
        shipCtx.beginPath();
        shipCtx.moveTo(-width/4, height/3);
        shipCtx.lineTo(-width/6, height/2);
        shipCtx.lineTo(-width/3, height/2);
        shipCtx.closePath();
        shipCtx.fill();
        
        shipCtx.beginPath();
        shipCtx.moveTo(width/4, height/3);
        shipCtx.lineTo(width/6, height/2);
        shipCtx.lineTo(width/3, height/2);
        shipCtx.closePath();
        shipCtx.fill();
        
        // Cockpit with enhanced glow
        shipCtx.fillStyle = '#FFFFFF';
        shipCtx.shadowBlur = 8;
        shipCtx.shadowColor = '#FFFFFF';
        shipCtx.beginPath();
        shipCtx.arc(0, -height/6, width/5, 0, Math.PI * 2);
        shipCtx.fill();
        
        // Inner cockpit detail
        shipCtx.fillStyle = '#E0F0FF';
        shipCtx.beginPath();
        shipCtx.arc(0, -height/6, width/8, 0, Math.PI * 2);
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
    }
    
    // Create enemy ship asset
    createEnemyShip() {
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
        
        // Draw main body with improved colors and effects
        enemyCtx.fillStyle = '#FF3300'; // Brighter red
        enemyCtx.shadowBlur = 15;
        enemyCtx.shadowColor = '#FF6600';
        
        // Enhanced body shape for Galaga-style enemy
        const eWidth = 36;
        const eHeight = 36;
        
        // Improved alien body shape
        enemyCtx.beginPath();
        enemyCtx.moveTo(0, -eHeight/2); // Top center
        enemyCtx.bezierCurveTo(
            eWidth/3, -eHeight/2,
            eWidth/2, -eHeight/3,
            eWidth/2, -eHeight/4
        ); // Upper right curve
        enemyCtx.lineTo(eWidth/2, eHeight/4); // Right side
        enemyCtx.quadraticCurveTo(eWidth/2, eHeight/3, eWidth/3, eHeight/2); // Bottom right curve
        enemyCtx.lineTo(-eWidth/3, eHeight/2); // Bottom
        enemyCtx.quadraticCurveTo(-eWidth/2, eHeight/3, -eWidth/2, eHeight/4); // Bottom left curve
        enemyCtx.lineTo(-eWidth/2, -eHeight/4); // Left side
        enemyCtx.bezierCurveTo(
            -eWidth/2, -eHeight/3,
            -eWidth/3, -eHeight/2,
            0, -eHeight/2
        ); // Upper left curve
        enemyCtx.closePath();
        enemyCtx.fill();
        
        // Enhanced body details
        enemyCtx.strokeStyle = '#FFDD00';
        enemyCtx.lineWidth = 2;
        enemyCtx.beginPath();
        enemyCtx.moveTo(-eWidth/3, eHeight/6);
        enemyCtx.lineTo(eWidth/3, eHeight/6);
        enemyCtx.stroke();
        
        // Animated patterns
        enemyCtx.strokeStyle = '#FFAA00';
        enemyCtx.lineWidth = 1.5;
        enemyCtx.beginPath();
        enemyCtx.moveTo(-eWidth/4, -eHeight/6);
        enemyCtx.lineTo(eWidth/4, -eHeight/6);
        enemyCtx.stroke();
        
        // Eyes with better glow effects
        enemyCtx.fillStyle = '#FFFFFF';
        enemyCtx.shadowBlur = 10;
        enemyCtx.shadowColor = '#FFFFFF';
        
        // Left eye
        enemyCtx.beginPath();
        enemyCtx.arc(-eWidth/5, eHeight/5, eWidth/8, 0, Math.PI * 2);
        enemyCtx.fill();
        
        // Right eye
        enemyCtx.beginPath();
        enemyCtx.arc(eWidth/5, eHeight/5, eWidth/8, 0, Math.PI * 2);
        enemyCtx.fill();
        
        // Red pupils with pulsing effect
        enemyCtx.fillStyle = '#FF0000';
        enemyCtx.shadowBlur = 5;
        enemyCtx.shadowColor = '#FF0000';
        
        enemyCtx.beginPath();
        enemyCtx.arc(-eWidth/5, eHeight/5, eWidth/16, 0, Math.PI * 2);
        enemyCtx.fill();
        
        enemyCtx.beginPath();
        enemyCtx.arc(eWidth/5, eHeight/5, eWidth/16, 0, Math.PI * 2);
        enemyCtx.fill();
        
        // Add antenna/sensors
        enemyCtx.strokeStyle = '#FF9900';
        enemyCtx.lineWidth = 1.5;
        enemyCtx.beginPath();
        enemyCtx.moveTo(-eWidth/4, -eHeight/2);
        enemyCtx.lineTo(-eWidth/6, -eHeight/2 - eHeight/4);
        enemyCtx.stroke();
        
        enemyCtx.beginPath();
        enemyCtx.moveTo(eWidth/4, -eHeight/2);
        enemyCtx.lineTo(eWidth/6, -eHeight/2 - eHeight/4);
        enemyCtx.stroke();
        
        // Antenna tips glow
        enemyCtx.fillStyle = '#FFDD00';
        enemyCtx.shadowBlur = 5;
        enemyCtx.shadowColor = '#FFDD00';
        
        enemyCtx.beginPath();
        enemyCtx.arc(-eWidth/6, -eHeight/2 - eHeight/4, 2, 0, Math.PI * 2);
        enemyCtx.fill();
        
        enemyCtx.beginPath();
        enemyCtx.arc(eWidth/6, -eHeight/2 - eHeight/4, 2, 0, Math.PI * 2);
        enemyCtx.fill();
        
        enemyCtx.restore();
    }
    
    // Create projectile glow effects
    createProjectileEffects() {
        // Enemy projectile (red)
        this.enemyProjectileGlow = document.createElement('canvas');
        this.enemyProjectileGlow.width = 16;
        this.enemyProjectileGlow.height = 16;
        const glowCtx = this.enemyProjectileGlow.getContext('2d');
        
        const enemyGradient = glowCtx.createRadialGradient(8, 8, 1, 8, 8, 8);
        enemyGradient.addColorStop(0, '#FF3300');
        enemyGradient.addColorStop(0.3, 'rgba(255, 51, 0, 0.8)');
        enemyGradient.addColorStop(1, 'rgba(255, 51, 0, 0)');
        
        glowCtx.fillStyle = enemyGradient;
        glowCtx.fillRect(0, 0, 16, 16);
        
        // Player projectile (blue)
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
    
    // Handle window resize with debounce
    debouncedResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => this.handleResize(), this.resizeDelay);
    }
    
    // Update canvas dimensions on resize
    handleResize() {
        if (!this.container) return;
        this.canvas.width = this.container.offsetWidth;
    }
    
    // Main animation loop
    animate(currentTime = 0) {        // Calculate delta time for consistent animation speed
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Skip frame if tab is inactive (deltaTime too large)
        if (deltaTime > 100) {
            this.animationId = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Adjust speed based on time passed
        const timeMultiplier = deltaTime / this.targetDeltaTime;
        
        // Make sure to clear the entire canvas completely to prevent ghosting
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear canvas - use fillRect for better performance with alpha disabled
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render all elements
        this.drawStars(timeMultiplier);
        this.updatePositions(timeMultiplier);
        this.updateProjectiles(timeMultiplier);
        this.drawEntities();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    // Update star positions and render starfield
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
            
            const brightness = Math.floor(150 + Math.random() * 105);
            this.ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // Update player and enemy positions
    updatePositions(timeMultiplier) {
        this.updatePlayerPosition(timeMultiplier);
        this.updateEnemyPosition(timeMultiplier);
        this.handleEnemyShooting(timeMultiplier);
        
        // Update animation timers
        this.thrusterAnimation = (this.thrusterAnimation + 0.2 * timeMultiplier) % (Math.PI * 2);
    }
    
    // Update player ship position
    updatePlayerPosition(timeMultiplier) {
        // Store previous position
        this.player.lastX = this.player.x;
        
        // Update player position with consistent speed
        this.player.x += this.player.speed * this.player.direction * timeMultiplier;
        
        // Handle screen wrapping
        if (this.player.x > this.canvas.width + 50 && this.player.direction > 0) {
            // Moving right and went off screen, come from left
            this.player.x = -50;
            this.player.lastX = -50;
            
            // Also reposition enemy
            this.enemy.x = -150;
            this.enemy.lastX = -150;
        } else if (this.player.x < -50 && this.player.direction < 0) {
            // Moving left and went off screen, come from right
            this.player.x = this.canvas.width + 50;
            this.player.lastX = this.canvas.width + 50;
            
            // Also reposition enemy
            this.enemy.x = this.canvas.width + 150;
            this.enemy.lastX = this.canvas.width + 150;
        }
        
        // Randomly change direction sometimes
        if (Math.random() < 0.001 * timeMultiplier) {
            this.player.direction *= -1;
        }
    }
    
    // Update enemy ship position
    updateEnemyPosition(timeMultiplier) {
        // Store previous position
        this.enemy.lastX = this.enemy.x;
        this.enemy.lastY = this.enemy.y;
        
        // Calculate target position based on player
        const followDistance = 120;
        const targetX = this.player.direction > 0 
            ? this.player.x - followDistance 
            : this.player.x + followDistance;
        
        // Move toward target with easing
        const dx = targetX - this.enemy.x;
        this.enemy.x += dx * 0.03 * timeMultiplier;
        
        // Add wobble motion
        this.enemy.wobble += 0.1 * timeMultiplier;
        this.enemy.y = (this.canvas.height * 0.3) + Math.sin(this.enemy.wobble) * 15;
    }
    
    // Handle enemy shooting behavior
    handleEnemyShooting(timeMultiplier) {
        this.enemy.shootTimer += timeMultiplier;
        
        if (this.enemy.shootTimer > this.enemy.shootCooldown) {
            // Check if enemy is in a position to shoot
            const canShoot = (this.player.direction > 0 && this.enemy.x < this.player.x) || 
                            (this.player.direction < 0 && this.enemy.x > this.player.x);
            
            if (canShoot && Math.abs(this.enemy.x - this.player.x) < 300) {
                this.enemyShoot();
            }
        }
    }
    
    // Enemy shoots at player
    enemyShoot() {
        // Aim ahead of player (with random offset to miss)
        const targetPos = {
            x: this.player.x + (this.player.direction * 20) + (Math.random() * 30 - 15),
            y: this.player.y + (Math.random() * 30 - 15)
        };
        
        // Calculate direction vector
        const dx = targetPos.x - this.enemy.x;
        const dy = targetPos.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and set speed
        const projectileSpeed = 4;
        const speedX = (dx / dist) * projectileSpeed;
        const speedY = (dy / dist) * projectileSpeed;
        
        // Create projectile
        this.getProjectile(this.enemy.x, this.enemy.y + 20, speedX, speedY, 'enemy');
        
        // Reset timer with random cooldown
        this.enemy.shootTimer = 0;
        this.enemy.shootCooldown = 30 + Math.random() * 50;
    }
    
    // Get a projectile from pool or create new
    getProjectile(x, y, speedX, speedY, type) {
        // Try to reuse from pool first
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
        
        // If pool is depleted, reuse the oldest active projectile
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
    
    // Update and draw projectiles
    updateProjectiles(timeMultiplier) {
        // Update positions and remove off-screen projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            projectile.x += projectile.speedX * timeMultiplier;
            projectile.y += projectile.speedY * timeMultiplier;
            
            // Remove if off screen
            if (projectile.y < -20 || projectile.y > this.canvas.height + 20 || 
                projectile.x < -20 || projectile.x > this.canvas.width + 20) {
                projectile.active = false;
                this.activeProjectiles.splice(i, 1);
            }
        }
        
        // Draw all active projectiles
        this.drawProjectiles();
    }
    
    // Draw all projectiles using cached patterns
    drawProjectiles() {
        const ctx = this.ctx;
        
        for (const projectile of this.activeProjectiles) {
            if (projectile.type === 'enemy') {
                // Enemy projectile (red)
                ctx.drawImage(
                    this.enemyProjectileGlow,
                    projectile.x - 8,
                    projectile.y - 8
                );
                
                // Bright center
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Player projectile (blue)
                ctx.drawImage(
                    this.playerProjectileGlow,
                    projectile.x - 6,
                    projectile.y - 6
                );
                
                // Bright center
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw all game entities
    drawEntities() {
        this.drawPlayer();
        this.drawEnemy();
    }
    
    // Draw player ship with thruster effect
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
        ctx.rotate(direction > 0 ? Math.PI / 2 : -Math.PI / 2);
        
        // Draw thruster flame
        this.drawThruster(ctx, width, height);
        
        // Draw ship from pre-rendered canvas
        const drawWidth = width * 1.1;
        const drawHeight = height * 1.1;
        ctx.drawImage(
            direction > 0 ? this.playerShipRight : this.playerShipLeft,
            -drawWidth/2,
            -drawHeight/2,
            drawWidth,
            drawHeight
        );
        
        ctx.restore();
    }
    
    // Draw dynamic thruster flame
    drawThruster(ctx, width, height) {
        const thrusterBaseWidth = 10;
        const thrusterLength = 15 + 5 * Math.sin(this.thrusterAnimation);
        const thrusterX = 0;
        const thrusterY = height/2;
        
        // Create gradient for enhanced effect
        const gradient = ctx.createLinearGradient(
            thrusterX, thrusterY,
            thrusterX, thrusterY + thrusterLength
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.2, 'rgba(80, 180, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(0, 120, 255, 0.7)');
        gradient.addColorStop(0.8, 'rgba(0, 80, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
        
        ctx.fillStyle = gradient;
        
        // Draw flame with wave effect
        const waveOffset = Math.sin(this.thrusterAnimation * 2) * 2;
        ctx.beginPath();
        ctx.moveTo(thrusterX - thrusterBaseWidth/2, thrusterY);
        ctx.quadraticCurveTo(
            thrusterX - thrusterBaseWidth/2 - waveOffset, 
            thrusterY + thrusterLength/2,
            thrusterX, thrusterY + thrusterLength
        );
        ctx.quadraticCurveTo(
            thrusterX + thrusterBaseWidth/2 + waveOffset, 
            thrusterY + thrusterLength/2,
            thrusterX + thrusterBaseWidth/2, thrusterY
        );
        ctx.closePath();
        ctx.fill();
        
        // Add inner glow effects
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#60A0FF';
        ctx.beginPath();
        ctx.arc(thrusterX, thrusterY + thrusterLength/3, thrusterLength/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
        ctx.fill();
        
        // Add second smaller glow
        ctx.beginPath();
        ctx.arc(thrusterX, thrusterY + thrusterLength/2, thrusterLength/8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow
    }
    
    // Draw enemy ship with effects
    drawEnemy() {
        const ctx = this.ctx;
        const x = this.enemy.x;
        const y = this.enemy.y;
        const width = this.enemy.width * 1.2;
        const height = this.enemy.height * 1.2;
        
        // Update glow effect
        this.enemy.engineGlow = (this.enemy.engineGlow + 0.05) % (Math.PI * 2);
        const glowIntensity = 8 + Math.sin(this.enemy.engineGlow) * 4;
        
        ctx.save();
        
        // Add engine glow effect
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = '#FF6600';
        
        // Draw pre-rendered enemy ship
        ctx.drawImage(
            this.enemyShip,
            x - width/2,
            y - height/2,
            width,
            height
        );
        
        // Draw movement trail
        this.drawEnemyMovementTrail(ctx, x, y);
        
        // Draw charging weapon effect when about to shoot
        if (this.enemy.shootTimer < 10) {
            this.drawEnemyWeaponCharge(ctx, x, y, width, height);
        }
        
        ctx.restore();
    }
    
    // Draw enemy movement particle trail
    drawEnemyMovementTrail(ctx, x, y) {
        const dx = this.enemy.x - this.enemy.lastX;
        
        if (Math.abs(dx) > 1) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FF6600';
            
            // Multiple particles with different sizes
            for (let i = 1; i <= 3; i++) {
                const offset = i * 8;
                const particleSize = 3 - (i * 0.8);
                const particleX = dx > 0 ? x - offset : x + offset;
                
                ctx.beginPath();
                ctx.arc(particleX, y, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }
    
    // Draw enemy weapon charge effect
    drawEnemyWeaponCharge(ctx, x, y, width, height) {
        const alpha = 0.7 - (this.enemy.shootTimer / 10);
        
        // Charging weapon effect
        const chargeGradient = ctx.createRadialGradient(
            x, y + height/3, 0,
            x, y + height/3, width/3
        );
        chargeGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        chargeGradient.addColorStop(0.3, `rgba(255, 120, 0, ${alpha * 0.8})`);
        chargeGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = chargeGradient;
        ctx.beginPath();
        ctx.arc(x, y + height/3, width/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Lightning-like energy effect
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI / 4) + (i * Math.PI / 6);
            const length = width/3 + Math.random() * width/6;
            const startX = x;
            const startY = y + height/3;
            let currentX = startX;
            let currentY = startY;
            
            ctx.moveTo(startX, startY);
            for (let j = 0; j < 3; j++) {
                const newX = currentX + Math.cos(angle) * (length/3) + (Math.random() - 0.5) * 5;
                const newY = currentY + Math.sin(angle) * (length/3) + (Math.random() - 0.5) * 5;
                ctx.lineTo(newX, newY);
                currentX = newX;
                currentY = newY;
            }
        }
        ctx.stroke();
    }
      // Clean up resources and stop animation
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Clean up all active elements
        this.activeProjectiles = [];
        
        // Clean up the canvas completely before removal
        if (this.ctx && this.canvas) {
            // Clear the entire canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // If the canvas is still in the DOM, remove it
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
        
        window.removeEventListener('resize', this.debouncedResize);
    }
}

// Initialize animation when the page is ready
document.addEventListener('DOMContentLoaded', () => {
    window.splashAnimation = new SplashAnimation();
});