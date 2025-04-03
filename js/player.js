// Fix syntax errors and update player for auto-shooting

class Player {
    constructor(game) {
        this.game = game;
        this.x = this.game.width / 2;
        this.y = this.game.height - 50;
        this.width = 30;
        this.height = 30;
        this.radius = 15;
        this.speed = 5;
        this.lives = 3;
        this.active = true;
        this.invulnerable = false; // Start NOT invulnerable by default
        this.invulnerableTimer = 0;
        this.shootCooldown = 0;
        this.maxShootCooldown = 15;
        
        // Power-up properties
        this.powerUpTimer = 0;
        this.activePower = 'NONE';
        this.doubleShot = false;
        this.shield = false;
        this.shieldHealth = 0;
        this.thrusterAnimation = 0;
        
        this.lastAutoShotTime = 0;
        this.autoShootInterval = 15; // Frames between auto shots
        this.rapidFireAutoShootInterval = 5; // Faster interval for rapid fire when autoshoot is on
    }
    
    update() {
        const controls = this.game.controls.keys;
        
        // Skip shooting if we're in a level transition
        const isTransitioning = this.game.levelManager.isTransitioning;
        
        // Movement - only allow during normal gameplay
        if (!isTransitioning) {
            if (controls.left && this.x > this.radius) {
                this.x -= this.speed;
            }
            if (controls.right && this.x < this.game.width - this.radius) {
                this.x += this.speed;
            }
        }
        
        // Shooting - disable during transitions
        if (!isTransitioning && controls.fire && this.shootCooldown <= 0) {
            // Check if auto-shooting is enabled
            const isAuto = this.game.controls && this.game.controls.autoShoot;
            
            if (!isAuto) {
                // Regular manual shooting - respects maxShootCooldown
                this.shoot();
                this.shootCooldown = this.maxShootCooldown;
            } else {
                // Auto-shooting logic
                const currentInterval = this.activePower === 'RAPID FIRE' 
                    ? this.rapidFireAutoShootInterval 
                    : this.autoShootInterval;
                
                if (this.game.frameCount - this.lastAutoShotTime >= currentInterval) {
                    this.shoot();
                    this.shootCooldown = 2; // Small cooldown for auto-shooting
                    this.lastAutoShotTime = this.game.frameCount;
                }
            }
        }
        
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Handle invulnerability - ensure the timer is properly decremented
        if (this.invulnerable) {
            this.invulnerableTimer--;
            
            // Only log occasionally to avoid console spam
            if (this.invulnerableTimer % 30 === 0) {
                console.log(`Invulnerable: ${this.invulnerable}, Timer: ${this.invulnerableTimer}`);
            }
            
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                this.invulnerableTimer = 0;
                console.log("Player is now vulnerable!");
            }
        }
        
        // Handle power-up timer
        if (this.powerUpTimer > 0) {
            this.powerUpTimer--;
            
            // Update the timer bar
            this.updatePowerUpTimer();
            
            if (this.powerUpTimer <= 0) {
                this.resetPowerUps();
            }
        }
        
        // Thruster animation effect
        this.thrusterAnimation += 0.2;
    }
    
    updatePowerUpTimer() {
        // Get the power timer elements - use cached references for better performance
        if (!this.timerElements) {
            this.timerElements = {
                container: document.getElementById('power-timer-container'),
                bar: document.getElementById('power-timer-bar')
            };
        }
        
        const { container, bar } = this.timerElements;
        
        // Only proceed if elements exist
        if (!container || !bar) return;
        
        // Calculate remaining percentage more efficiently
        const initialDuration = this.initialPowerUpTimer || 600;
        const percentRemaining = (this.powerUpTimer / initialDuration) * 100;
        
        // Show the timer container if it's hidden
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            container.setAttribute('aria-hidden', 'false');
            
            // Force a reflow before setting the width for proper transition
            void container.offsetWidth;
        }
        
        // Update the timer bar width and ARIA values
        bar.style.width = `${percentRemaining}%`;
        bar.setAttribute('aria-valuenow', Math.round(percentRemaining));
        
        // Add flashing effect when under 30% time left
        if (percentRemaining < 30) {
            if (!bar.classList.contains('power-timer-flash')) {
                bar.classList.add('power-timer-flash');
            }
        } else {
            bar.classList.remove('power-timer-flash');
        }
    }
    
    resetPowerUps(forceClear = false) {
        // Reset power-up effects
        this.maxShootCooldown = 15;
        this.doubleShot = false;
        this.multiShot = false;
        this.speed = 5;
        
        // When force clearing (between levels), clear all powerups including shield
        if (forceClear) {
            this.shield = false;
            this.shieldHealth = 0;
            this.activePower = 'NONE';
            this.powerUpTimer = 0;
            this.initialPowerUpTimer = 0;
            
            // Update UI immediately
            document.getElementById('active-power').textContent = this.activePower;
            
            // Hide the timer bar
            const timerContainer = document.getElementById('power-timer-container');
            if (timerContainer) {
                timerContainer.classList.add('hidden');
                timerContainer.setAttribute('aria-hidden', 'true');
            }
            
            console.log("All powerups force cleared between levels");
            return;
        }
        
        // Regular timer-based expiration logic (not between levels)
        // Also reset shield if timer has expired
        if (this.powerUpTimer <= 0) {
            this.shield = false;
            this.shieldHealth = 0;
        }
        
        // Only update the active power display if we've lost all power-ups
        if (!this.shield) {
            this.activePower = 'NONE';
            document.getElementById('active-power').textContent = this.activePower;
        } else {
            // If shield is still active, keep that as the display
            this.activePower = 'SHIELD';
            document.getElementById('active-power').textContent = this.activePower;
        }
        
        // Hide the timer bar
        if (this.timerElements?.container) {
            this.timerElements.container.classList.add('hidden');
            this.timerElements.container.setAttribute('aria-hidden', 'true');
        }
        
        // Reset timer values only if we've reset all power-ups
        if (this.activePower === 'NONE') {
            this.powerUpTimer = 0;
            this.initialPowerUpTimer = 0;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        // Blinking effect when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            return;
        }
        
        // Draw shield if active
        if (this.shield) {
            ctx.save();
            
            // If shield is about to expire, make it flash
            if (this.shieldFlashing && Math.floor(this.game.frameCount / this.shieldFlashRate) % 2 === 0) {
                ctx.globalAlpha = 0.4; // Lower opacity during flash
            } else {
                ctx.globalAlpha = 0.7;
            }
            
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00FFFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw thruster flame effect
        this.drawThruster(ctx);
        
        // Check if sprites is defined before using it
        if (window.sprites && window.sprites.player) {
            // Draw the player ship using sprite
            window.sprites.player.draw(ctx, this.x, this.y);
        } else {
            // Fallback drawing method if sprites aren't loaded
            ctx.save();
            ctx.fillStyle = '#1E90FF';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height/2);
            ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
            ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Log an error to help debugging
            console.error('Sprites not loaded properly. Check script loading order.');
        }
    }
    
    drawThruster(ctx) {
        const flameHeight = 15 + 5 * Math.sin(this.thrusterAnimation);
        
        ctx.save();
        const gradient = ctx.createLinearGradient(
            this.x, this.y + this.height/2,
            this.x, this.y + this.height/2 + flameHeight
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#0080FF');
        gradient.addColorStop(0.8, 'rgba(0,50,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height/2 + flameHeight);
        ctx.lineTo(this.x + 5, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    shoot() {
        const bulletSpeedY = -8;
        
        if (this.doubleShot) {
            // Create two bullets side by side using the projectile pool
            this.game.projectilePool.get({
                game: this.game,
                x: this.x - 10,
                y: this.y - 20,
                speed: bulletSpeedY,
                type: 'player'
            });
            
            this.game.projectilePool.get({
                game: this.game,
                x: this.x + 10,
                y: this.y - 20,
                speed: bulletSpeedY,
                type: 'player'
            });
        } else if (this.multiShot) {
            // Multi-shot implementation with three projectiles in different angles
            this.game.projectilePool.get({
                game: this.game,
                x: this.x,
                y: this.y - 20,
                speed: bulletSpeedY,
                type: 'player'
            });
            
            this.game.projectilePool.get({
                game: this.game,
                x: this.x - 5,
                y: this.y - 15,
                speed: bulletSpeedY * 0.9,
                type: 'player'
            });
            
            this.game.projectilePool.get({
                game: this.game,
                x: this.x + 5,
                y: this.y - 15,
                speed: bulletSpeedY * 0.9,
                type: 'player'
            });
        } else {
            // Normal single shot using the projectile pool
            this.game.projectilePool.get({
                game: this.game,
                x: this.x,
                y: this.y - 20,
                speed: bulletSpeedY,
                type: 'player'
            });
        }
        
        // Play shooting sound
        if (window.audioManager) {
            window.audioManager.play('playerShoot', 0.3);
        }
    }
    
    hit() {
        // Debug output to verify hit detection
        console.log(`Hit detected! Invulnerable: ${this.invulnerable}, Shield: ${this.shield}`);
        
        // Don't process hit if player is invulnerable
        if (this.invulnerable) {
            console.log("Hit ignored - player is invulnerable");
            return;
        }
        
        // Check if shield is active
        if (this.shield) {
            this.shieldHealth--;
            console.log(`Shield hit! Health remaining: ${this.shieldHealth}`);
            if (this.shieldHealth <= 0) {
                this.shield = false;
                this.activePower = 'NONE';
                document.getElementById('active-power').textContent = this.activePower;
            }
            return;
        }
        
        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        console.log(`Player hit! Lives remaining: ${this.lives}`);
        
        if (this.lives <= 0) {
            this.game.gameOver();
        } else {
            this.invulnerable = true;
            this.invulnerableTimer = 120; // 2 seconds at 60fps
            console.log(`Player now invulnerable for ${this.invulnerableTimer} frames`);
        }
        
        // Play explosion sound
        if (window.audioManager) {
            window.audioManager.play('explosion', 0.6);
        }
    }
    
    reset() {
        this.x = this.game.width / 2;
        this.y = this.game.height - 50;
        this.lives = 3;
        this.active = true;
        
        // Make player briefly invulnerable at game start
        this.invulnerable = true;
        this.invulnerableTimer = 60; // 1 second at 60fps (reduced from 3 seconds)
        
        this.shootCooldown = 0;
        this.resetPowerUps();
        this.shield = false;
        
        console.log("Player reset! Briefly invulnerable for 1 second.");
    }

    applyPowerUp(type) {
        console.log(`Applying power-up: ${type}`);
        
        // Set default duration
        let duration = 600; // 10 seconds at 60fps
        
        // Apply appropriate power-up effect
        switch(type) {
            case 'rapid-fire':
                this.maxShootCooldown = 5; // Faster shooting
                this.activePower = 'RAPID FIRE';
                break;
                
            case 'shield':
                this.shield = true;
                this.shieldHealth = 3; // Shield can absorb 3 hits
                this.activePower = 'SHIELD';
                duration = 900; // 15 seconds at 60fps - longer than other power-ups
                break;
                
            case 'extra-life': 
                this.lives++;
                document.getElementById('lives').textContent = this.lives;
                this.activePower = '+1 LIFE';
                duration = 0; // Extra life is instant, no timer needed
                break;
                
            case 'double-shot':
                this.doubleShot = true;
                this.activePower = 'DOUBLE SHOT';
                break;
                
            case 'speed-boost':
                this.speed = 8; // Increased from 5
                this.activePower = 'SPEED BOOST';
                break;
                
            case 'bomb':
                // Clear all enemies on screen
                if (this.game.powerUpManager && typeof this.game.powerUpManager.detonateScreenBomb === 'function') {
                    this.game.powerUpManager.detonateScreenBomb();
                }
                this.activePower = 'SCREEN BOMB';
                
                // Reset power-up display after a brief moment for bombs
                setTimeout(() => {
                    if (this.activePower === 'SCREEN BOMB') {
                        this.activePower = 'NONE';
                        document.getElementById('active-power').textContent = 'NONE';
                    }
                }, 2000);
                duration = 0;
                break;
                
            case 'multi-shot':
                this.multiShot = true;
                this.activePower = 'MULTI SHOT';
                break;
                
            default:
                console.log(`Unknown power-up type: ${type}`);
                return;
        }
        
        // Update the UI
        document.getElementById('active-power').textContent = this.activePower;
        
        // Set the timer for timed power-ups
        if (duration > 0) {
            this.powerUpTimer = duration;
            this.initialPowerUpTimer = duration;
            
            // Show timer bar
            const timerContainer = document.getElementById('power-timer-container');
            if (timerContainer) {
                timerContainer.classList.remove('hidden');
                timerContainer.setAttribute('aria-hidden', 'false');
                
                // Reset timer bar width
                const timerBar = document.getElementById('power-timer-bar');
                if (timerBar) {
                    timerBar.style.width = '100%';
                }
            }
        }
        
        // Play power-up sound
        if (window.audioManager) {
            window.audioManager.play('powerUp', 0.7);
        }
    }
}
