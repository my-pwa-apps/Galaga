class Game {
    constructor(options) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 600;
        this.height = 800;
        this.frameCount = 0;
        this.score = 0;
        
        // Performance optimization - time tracking
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Set up the game
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize game components with object pooling
        this.projectilePool = new ProjectilePool(this);
        this.explosionPool = new ExplosionPool(this);
        this.player = new Player(this);
        this.controls = new Controls(this);
        this.projectiles = []; // Keep for backwards compatibility
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.levelManager = new LevelManager(this);
        this.explosions = []; // Keep for backwards compatibility
        
        // Initial game state
        this.gameState = 'start';
        
        // Initialize UI and audio
        this.setupAudioControls();
        this.initUI();
        
        // Start animation loop
        this.animate(0);
    }
    
    resize() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const ratio = this.width / this.height;
        
        let canvasWidth, canvasHeight;
        
        // Calculate dimensions while maintaining aspect ratio
        if (containerHeight * ratio < containerWidth) {
            canvasHeight = containerHeight * 0.9;
            canvasWidth = canvasHeight * ratio;
        } else {
            canvasWidth = containerWidth * 0.9;
            canvasHeight = canvasWidth / ratio;
        }
        
        // Set internal canvas dimensions
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Set display size with CSS
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        
        // On mobile, adjust for controls
        if (window.innerWidth < 768) {
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls && !mobileControls.classList.contains('hidden-on-desktop')) {
                const controlsHeight = mobileControls.offsetHeight || window.innerHeight * 0.2;
                this.canvas.style.height = `${canvasHeight - controlsHeight}px`;
            }
        }
    }
    
    setupAudioControls() {
        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                const isMuted = window.audioManager?.toggleMute();
                muteButton.textContent = isMuted ? '🔇' : '🔊';
                muteButton.classList.toggle('muted', isMuted);
            });
        }
    }
    
    initUI() {
        // Set up start button
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // Set up restart button
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.startGame();
            });
        }
    }
    
    animate(timestamp) {
        // Request the next frame
        requestAnimationFrame((time) => this.animate(time));
        
        // Calculate elapsed time since last frame
        const deltaTime = timestamp - this.lastTime;
        
        // Control frame rate to improve performance
        if (deltaTime < this.frameInterval) return;
        
        // Adjust last time for consistent frame rate
        this.lastTime = timestamp - (deltaTime % this.frameInterval);
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update game state based on current game state
        if (this.gameState === 'playing') {
            this.update();
        }
        
        // Render the game
        this.render();
        
        // Increment frame counter
        this.frameCount++;
    }
    
    update() {
        // Update controls state for auto-shoot
        this.controls.update();
        
        // Update player
        this.player.update();
        
        // Update enemies
        this.enemyManager.update();
        
        // Update projectiles
        this.updateProjectiles();
        
        // Update power-ups
        this.powerUpManager.update();
        
        // Check collisions
        this.checkCollisions();
        
        // Update explosions
        this.updateExplosions();
        
        // Check level completion
        this.levelManager.update();
    }
    
    render() {
        // Draw background
        this.drawBackground();
        
        // Render game elements based on game state
        if (this.gameState === 'playing') {
            // Draw player
            this.player.draw();
            
            // Draw enemies
            this.enemyManager.draw();
            
            // Draw projectiles
            this.drawProjectiles();
            
            // Draw power-ups
            this.powerUpManager.draw();
            
            // Draw explosions
            this.drawExplosions();
        }
    }
    
    drawBackground() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    updateProjectiles() {
        // Use the projectile pool system for better performance
        this.projectilePool.update();
    }
    
    drawProjectiles() {
        // Use the projectile pool system for drawing
        this.projectilePool.draw();
    }
    
    updateExplosions() {
        // Support both the old array-based system and the new pool-based system
        
        // Update the explosion pool if it exists
        if (this.explosionPool) {
            this.explosionPool.update();
        }
        
        // Also update any explosions in the legacy array for backward compatibility
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.update();
            
            // Remove finished explosions
            if (explosion.finished) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    drawExplosions() {
        // Use explosion pool for drawing
        this.explosionPool.draw();
    }
    
    checkCollisions() {
        // 1. Check player projectiles against enemies
        const activeProjectiles = this.projectilePool.activeProjectiles;
        
        for (let i = activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = activeProjectiles[i];
            
            // Skip enemy projectiles
            if (projectile.isEnemy) continue;
            
            // Check against all enemies
            for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemyManager.enemies[j];
                
                // Simple rectangular collision detection
                if (this.checkRectCollision(
                    projectile.x, projectile.y, projectile.width, projectile.height,
                    enemy.x, enemy.y, enemy.width, enemy.height
                )) {
                    // Enemy hit by player projectile
                    enemy.hit();
                    
                    // If enemy is destroyed
                    if (enemy.health <= 0) {
                        // Add score
                        this.score += enemy.points;
                        this.updateUI();
                        
                        // Create explosion using pool
                        this.explosionPool.get(enemy.x, enemy.y);
                        
                        // Play explosion sound
                        if (window.audioManager) {
                            window.audioManager.play('explosion', 0.3);
                        }
                        
                        // Chance to drop power-up
                        if (Math.random() < 0.1) {
                            this.powerUpManager.createPowerUp(enemy.x, enemy.y);
                        }
                        
                        // Remove the enemy
                        this.enemyManager.enemies.splice(j, 1);
                    } else {
                        // Play hit sound
                        if (window.audioManager) {
                            window.audioManager.play('bulletHit', 0.2);
                        }
                    }
                    
                    // Deactivate the projectile
                    projectile.active = false;
                    break;
                }
            }
        }
        
        // 2. Check enemy projectiles against player
        for (let i = activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = activeProjectiles[i];
            
            // Skip player projectiles or inactive projectiles
            if (!projectile.isEnemy || !projectile.active) continue;
            
            // Check against player
            if (this.player.active && this.checkRectCollision(
                projectile.x, projectile.y, projectile.width, projectile.height,
                this.player.x, this.player.y, this.player.width, this.player.height
            )) {
                console.log("Enemy projectile hit player!");
                
                // Player hit by enemy projectile
                this.player.hit();
                
                // Create explosion using pool
                this.explosionPool.get(this.player.x, this.player.y);
                
                // Play explosion sound
                if (window.audioManager) {
                    window.audioManager.play('explosion', 0.5);
                }
                
                // Deactivate the projectile
                projectile.active = false;
            }
        }
        
        // 3. Check enemy ships against player
        if (this.player.active) {
            for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemyManager.enemies[i];
                
                if (this.checkRectCollision(
                    enemy.x, enemy.y, enemy.width, enemy.height,
                    this.player.x, this.player.y, this.player.width, this.player.height
                )) {
                    console.log("Enemy ship collided with player!");
                    console.log(`Player invulnerable: ${this.player.invulnerable}, Timer: ${this.player.invulnerableTimer}`);
                    
                    // Player hit by enemy ship
                    this.player.hit();
                    
                    // Create explosions for both player and enemy
                    this.explosionPool.get(this.player.x, this.player.y);
                    this.explosionPool.get(enemy.x, enemy.y);
                    
                    // Play explosion sound
                    if (window.audioManager) {
                        window.audioManager.play('explosion', 0.7);
                    }
                    
                    // Destroy the enemy that collided with the player
                    this.score += enemy.points;
                    this.updateUI();
                    this.enemyManager.enemies.splice(i, 1);
                    
                    break; // Exit the loop after the first collision
                }
            }
        }
        
        // 4. Check power-ups against player
        for (let i = this.powerUpManager.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUpManager.powerUps[i];
            
            if (this.checkRectCollision(
                powerUp.x, powerUp.y, powerUp.width, powerUp.height,
                this.player.x, this.player.y, this.player.width, this.player.height
            )) {
                // Apply power-up
                this.player.applyPowerUp(powerUp.type);
                
                // Show notification
                this.showPowerUpNotification(powerUp.type);
                
                // Play power-up sound
                if (window.audioManager) {
                    window.audioManager.play('powerUp', 0.4);
                }
                
                // Remove the power-up
                this.powerUpManager.powerUps.splice(i, 1);
            }
        }
    }
    
    // Helper method for rectangle collision detection
    checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && 
               x1 + w1 > x2 && 
               y1 < y2 + h2 && 
               y1 + h1 > y2;
    }
    
    // Display power-up notification
    showPowerUpNotification(type) {
        const notification = document.getElementById('powerup-notification');
        let message = 'POWER-UP: ';
        
        switch(type) {
            case 'rapidFire': message += 'RAPID FIRE'; break;
            case 'multiShot': message += 'MULTI SHOT'; break;
            case 'shield': message += 'SHIELD'; break;
            case 'extraLife': message += 'EXTRA LIFE'; break;
            default: message += type.toUpperCase();
        }
        
        notification.textContent = message;
        notification.classList.remove('hidden');
        
        // Update active power display
        if (type !== 'extraLife') {
            document.getElementById('active-power').textContent = type.toUpperCase();
            document.getElementById('power-timer-container').classList.remove('hidden');
            document.getElementById('power-timer-bar').style.width = '100%';
        }
        
        // Hide notification after 2 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.levelManager.currentLevel;
        document.getElementById('lives').textContent = this.player.lives;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        
        // Play game over sound - fixed method name to match the API
        if (window.audioManager) {
            window.audioManager.play('gameOver', 0.7);
        }
    }
    
    startGame() {
        // Hide start screen and show game screen
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.updateUI();
        
        // Clear projectiles and explosions
        this.projectilePool.clear();
        this.explosionPool.clear();
        this.projectiles = []; // Clear legacy array too
        this.explosions = []; // Clear legacy array too
        
        // Initialize level
        this.levelManager.startLevel(1);
        
        // Play background music
        if (window.audioManager) {
            window.audioManager.playBackgroundMusic();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
