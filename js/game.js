class Game {    constructor(options) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Use non-alpha for performance
        this.width = 600;
        this.height = 800;
        this.frameCount = 0;
        this.score = 0;
        
        // Performance optimization - time tracking
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Enable hardware acceleration hints
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
        
        // Initialize optimized renderer
        if (typeof GameRenderer !== 'undefined') {
            this.renderer = new GameRenderer(this);
        }
        
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
        
        // Initialize starfield with 150 stars
        this.starfield = new Starfield(this, 150);
        
        // Light speed stars for level transitions
        this.lightSpeedStars = [];
        this.lightSpeedActive = false;
        
        // Initial game state
        this.gameState = 'start';
        
        // Initialize UI and audio
        this.setupAudioControls();
        this.initUI();
        
        // Add scoring popup container
        this.pointsPopups = [];
        this.maxPopups = 20; // Limit total popups for performance
        
        // Add pause state
        this.isPaused = false;
        
        // Set up focus/blur event handlers
        window.addEventListener('blur', this.handleBlur.bind(this));
        window.addEventListener('focus', this.handleFocus.bind(this));
        
        // Listen for pause key events
        window.addEventListener('keydown', this.handlePauseKeys.bind(this));
        
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
        
        // Have renderer handle resizing of all canvas layers
        if (this.renderer) {
            this.renderer.handleResize(this.width, this.height);
        }
        
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
    }    animate(timestamp) {
        // Request the next frame first for better performance
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
        
        // Clear the canvas at the start of each frame
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save canvas context state at the start of each frame
        this.ctx.save();
        
        // Always clear the main canvas at the beginning of each frame
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Skip update if paused - but still render pause overlay
        if (this.isPaused) {
            // Ensure main canvas is fully cleared
            if (this.renderer) {
                this.renderer.clearCanvas(this.renderer.mainCtx);
            }
            
            // Draw the pause overlay
            this.renderPauseOverlay();
            
            // Restore context state at the end of the frame
            this.ctx.restore();
            return;
        }
        
        // Calculate elapsed time since last frame
        const deltaTime = timestamp - (this.lastTime || timestamp);
        const maxDeltaTime = 200; // Cap deltaTime to prevent huge jumps after tab inactivity
        const adjustedDeltaTime = Math.min(deltaTime, maxDeltaTime);
        
        // Update timestamp for next frame
        this.lastTime = timestamp;
        
        // Increment frame counter
        this.frameCount++;
        
        // Always mark background for update to prevent trails
        if (this.renderer) {
            this.renderer.needsBackgroundUpdate = true;
        }
          // Update game state
        if (this.gameState === 'playing') {
            this.update();
        }
        
        // Render the game
        this.render();
        
        // Restore canvas context state at the end of each frame
        this.ctx.restore();
    }
    
    update() {
        // Skip updates if paused
        if (this.isPaused) return;
        
        // Update starfield first - always update regardless of game state
        this.starfield.update();
        
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
    }    render() {
        if (this.renderer) {
            // Use optimized renderer
            // The renderer will handle clearing its own canvases
            this.renderer.render();
            return;
        }
        
        // Legacy rendering as fallback
        // Always clear the canvas first to prevent pixel accumulation
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
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
            
            // Draw point popups
            this.drawPointsPopups();
        }
        
        // Draw light speed effect if active
        if (this.lightSpeedActive) {
            this.renderLightSpeedEffect();
        }
        // Draw level transition overlay if applicable but not using light speed
        else if (this.levelManager.isTransitioning) {
            this.levelManager.renderTransition();
        }
        
        // Render pause overlay if paused
        if (this.isPaused) {
            this.renderPauseOverlay();
        }
    }
    
    drawBackground() {
        // Fill with black background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw the starfield
        this.starfield.draw();
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
    
    // Add circular collision detection for more accurate hit detection
    checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        // Calculate squared distance to avoid expensive square root operation
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;
        
        // Compare squared values to avoid sqrt for better performance
        return distanceSquared < (radiusSum * radiusSum);
    }
    
    checkCollisions() {
        // Use spatial partitioning for projectiles to improve collision detection performance
        // Group projectiles into regions (simple grid-based approach)
        const gridSize = 100; // Size of each grid cell
        const grid = {}; // Object to hold projectiles by grid cell
        
        // Place projectiles into grid cells
        this.projectilePool.activeProjectiles.forEach(projectile => {
            if (!projectile.active) return;
            
            // Calculate grid cell coordinates
            const cellX = Math.floor(projectile.x / gridSize);
            const cellY = Math.floor(projectile.y / gridSize);
            const cellKey = `${cellX},${cellY}`;
            
            // Initialize cell if needed
            if (!grid[cellKey]) {
                grid[cellKey] = [];
            }
            
            // Add projectile to cell
            grid[cellKey].push(projectile);
        });
        
        // NEW: Check for player bullet and enemy bullet collisions
        for (let i = 0; i < this.projectilePool.activeProjectiles.length; i++) {
            const playerProjectile = this.projectilePool.activeProjectiles[i];
            // Skip if not active or not a player projectile
            if (!playerProjectile.active || playerProjectile.isEnemy) continue;
            
            // Get the grid cell for this player projectile
            const playerCellX = Math.floor(playerProjectile.x / gridSize);
            const playerCellY = Math.floor(playerProjectile.y / gridSize);
            
            // Check surrounding cells for enemy bullets
            for (let x = playerCellX - 1; x <= playerCellX + 1; x++) {
                for (let y = playerCellY - 1; y <= playerCellY + 1; y++) {
                    const cellKey = `${x},${y}`;
                    const projectilesInCell = grid[cellKey] || [];
                    
                    for (let j = 0; j < projectilesInCell.length; j++) {
                        const enemyProjectile = projectilesInCell[j];
                        // Skip if not active or not an enemy projectile
                        if (!enemyProjectile.active || !enemyProjectile.isEnemy) continue;
                        
                        // Check collision between player bullet and enemy bullet
                        if (this.checkCircleCollision(
                            playerProjectile.x, playerProjectile.y, playerProjectile.radius,
                            enemyProjectile.x, enemyProjectile.y, enemyProjectile.radius
                        )) {                            // Create a small explosion effect at the collision point
                            this.explosionPool.get(enemyProjectile.x, enemyProjectile.y, 0.5);
                            
                            // Play sound effect
                            if (window.audioManager) {
                                window.audioManager.play('bulletHit', 0.15);
                            }
                            
                            // Award points for destroying an enemy bullet (increased from 10 to 25)
                            this.score += 25;
                            this.updateUI();
                            
                            // Create score popup for bullet destruction
                            this.createPointsPopup(enemyProjectile.x, enemyProjectile.y, 25);
                            
                            // Deactivate both projectiles
                            enemyProjectile.active = false;
                            
                            // Only destroy the player's bullet if it's a normal shot
                            // Special shots like charged shots or powerups can destroy multiple bullets
                            if (playerProjectile.powerupType === 'normal') {
                                playerProjectile.active = false;
                                break; // Break out of the inner loop once a collision is found
                            }
                        }
                    }
                }
            }
        }
        
        // Process enemy collisions (existing code)
        this.enemyManager.enemies.forEach((enemy, enemyIndex) => {
            // Calculate which grid cells this enemy could overlap with
            const cellX = Math.floor(enemy.x / gridSize);
            const cellY = Math.floor(enemy.y / gridSize);
            
            // Check surrounding cells (3x3 grid around enemy)
            for (let x = cellX - 1; x <= cellX + 1; x++) {
                for (let y = cellY - 1; y <= cellY + 1; y++) {
                    const cellKey = `${x},${y}`;
                    const projectilesInCell = grid[cellKey] || [];
                    
                    // Check collisions with projectiles in this cell
                    projectilesInCell.forEach(projectile => {
                        if (!projectile.active || projectile.isEnemy) return;
                        
                        // Use circle collision for more accurate hit detection
                        if (this.checkCircleCollision(
                            projectile.x, projectile.y, projectile.radius,
                            enemy.x, enemy.y, enemy.radius
                        )) {
                            // Enemy hit by player projectile
                            enemy.hit();
                            
                            // When enemy is destroyed
                            if (enemy.health <= 0) {
                                // Add score
                                const points = Math.round(enemy.points);
                                this.score += points;
                                this.updateUI();
                                
                                // Show points popup
                                this.createPointsPopup(enemy.x, enemy.y, points);
                                
                                // Create explosion using pool
                                this.explosionPool.get(enemy.x, enemy.y);
                                
                                // Play explosion sound
                                if (window.audioManager) {
                                    window.audioManager.play('explosion', 0.3);
                                }
                                
                                // Chance to drop power-up
                                this.powerUpManager.trySpawnPowerUp(enemy.x, enemy.y);
                                
                                // Mark enemy for removal
                                enemy.active = false;
                            } else {
                                // Play hit sound
                                if (window.audioManager) {
                                    window.audioManager.play('bulletHit', 0.2);
                                }
                            }
                            
                            // Deactivate the projectile
                            projectile.active = false;
                        }
                    });
                }
            }
        });
        
        // Remove destroyed enemies
        this.enemyManager.enemies = this.enemyManager.enemies.filter(enemy => enemy.active !== false);
        
        // Check player-related collisions only if player is active
        if (this.player.active) {
            const playerCellX = Math.floor(this.player.x / gridSize);
            const playerCellY = Math.floor(this.player.y / gridSize);
            
            // Check enemy projectiles against player
            if (!this.player.invulnerable) {
                for (let x = playerCellX - 1; x <= playerCellX + 1; x++) {
                    for (let y = playerCellY - 1; y <= playerCellY + 1; y++) {
                        const cellKey = `${x},${y}`;
                        const projectilesInCell = grid[cellKey] || [];
                        
                        for (const projectile of projectilesInCell) {
                            if (!projectile.active || !projectile.isEnemy) continue;
                            
                            // Check against player - explicitly check invulnerable here
                            if (this.checkCircleCollision(
                                projectile.x, projectile.y, projectile.radius,
                                this.player.x, this.player.y, this.player.radius * 0.8 // Make player hitbox slightly smaller than visual
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
                    }
                }
            }
            
            // Check enemy ships against player - explicit check for invulnerability
            if (!this.player.invulnerable) {
                for (const enemy of this.enemyManager.enemies) {
                    // Use more accurate circle collision
                    if (this.checkCircleCollision(
                        enemy.x, enemy.y, enemy.radius,
                        this.player.x, this.player.y, this.player.radius
                    )) {
                        console.log("Enemy ship collided with player!");
                        
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
                        this.score += Math.round(enemy.points);
                        this.updateUI();
                        enemy.active = false;
                        
                        break; // Exit the loop after the first collision
                    }
                }
                
                // Remove destroyed enemies again
                this.enemyManager.enemies = this.enemyManager.enemies.filter(enemy => enemy.active !== false);
            }
            
            // Check power-ups against player
            for (let i = this.powerUpManager.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUpManager.powerUps[i];
                
                if (this.checkCircleCollision(
                    powerUp.x, powerUp.y, powerUp.radius,
                    this.player.x, this.player.y, this.player.radius
                )) {
                    // Apply power-up
                    this.player.applyPowerUp(powerUp.type);
                    
                    // Award points for collecting powerup
                    const powerupPoints = powerUp.getPointsValue ? powerUp.getPointsValue() : 50;
                    this.score += powerupPoints;
                    this.updateUI();
                    
                    // Show points popup
                    this.createPointsPopup(powerUp.x, powerUp.y, powerupPoints);
                    
                    // Show notification
                    this.showPowerUpNotification(powerUp.type);
                    
                    // Play power-up sound
                    if (window.audioManager) {
                        window.audioManager.play('powerUp', 0.4);
                    }
                    
                    // Remove the power-up
                    this.powerUpManager.powerUps.splice(i, 1);                }
            }
        }
        
        // The projectile pool already handles cleanup in its update() method
        // No need for an explicit call to a separate cleanup method
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
        // Fix: Ensure we're displaying valid numbers
        document.getElementById('score').textContent = this.score || 0;
        document.getElementById('level').textContent = this.levelManager.currentLevel || 1;
        document.getElementById('lives').textContent = this.player.lives || 0;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update screens
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        
        // Store the current level - ensure we get the actual level reached
        const currentLevel = this.levelManager.currentLevel || 1;
        document.getElementById('final-level').textContent = currentLevel;
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.play('gameOver', 0.7);
            // Fade out background music if it's playing
            window.audioManager.stopBackgroundMusic(true); // true = fade out
        }
        
        // Clean up any active power-ups
        if (this.player) {
            this.player.resetPowerUps(true);
        }
        
        // Clean up any active projectiles and explosions
        this.projectilePool.clear();
        this.explosionPool.clear();
        
        // Clear points popups
        this.pointsPopups = [];
        this.lightSpeedActive = false;
        
        // Check if this is a high score and show the appropriate form
        if (window.highScoreManager) {
            // Store the level in a class property to ensure it's available when submitting
            this.finalLevel = currentLevel;
            
            // Set the current level in the high score manager
            window.highScoreManager.setCurrentLevel(currentLevel);
            
            window.highScoreManager.checkHighScore(this.score)
                .then(isHighScore => {
                    window.highScoreManager.showHighScoreForm(isHighScore);
                })
                .catch(error => {
                    console.error("Error checking high score:", error);
                    // Show a generic message if there's an error
                    const highScoreMessage = document.getElementById('highscore-message');
                    if (highScoreMessage) {
                        highScoreMessage.textContent = "Game over! Final score: " + this.score;
                    }
                });
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
        
        // Reset all game components
        this.player.reset();
        this.player.lives = 3;
        this.projectilePool.clear();
        this.explosionPool.clear();
        this.powerUpManager.clearAllPowerups();
        
        // Fix: Reset level manager properly
        if (this.levelManager) {
            this.levelManager.reset();
        }
        
        // Initialize level
        this.levelManager.startLevel(1);
        
        // Update UI
        this.updateUI();
        
        // Play background music
        if (window.audioManager) {
            window.audioManager.playBackgroundMusic();
        }
    }

    // Create a points popup at a specific location
    createPointsPopup(x, y, points) {
        // Create popup object
        const popup = {
            x: x,
            y: y,
            points: points,
            opacity: 1.0,
            scale: 0.8,
            life: 40 // Number of frames to live
        };
        
        // Add to popups array, remove oldest if max is reached
        if (this.pointsPopups.length >= this.maxPopups) {
            this.pointsPopups.shift();
        }
        this.pointsPopups.push(popup);
    }
    
    // Draw all active point popups
    drawPointsPopups() {
        this.ctx.save();
        
        // Process each popup
        for (let i = this.pointsPopups.length - 1; i >= 0; i--) {
            const popup = this.pointsPopups[i];
            
            // Update popup animation
            popup.y -= 1; // Move upward
            popup.life--;
            
            // Calculate animation values
            if (popup.life > 30) {
                // Grow phase
                popup.scale = 0.8 + (0.4 * (40 - popup.life) / 10);
            } else if (popup.life < 10) {
                // Fade out phase
                popup.opacity = popup.life / 10;
                popup.scale = 1.0 + ((10 - popup.life) * 0.05);
            }
            
            // Remove if expired
            if (popup.life <= 0) {
                this.pointsPopups.splice(i, 1);
                continue;
            }
            
            // Draw the popup
            this.ctx.globalAlpha = popup.opacity;
            
            // Text style
            this.ctx.font = 'bold 16px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            
            // Different colors based on point values
            if (popup.points >= 300) {
                // High value - boss points
                this.ctx.fillStyle = '#FF00FF'; // Magenta
                this.ctx.shadowColor = '#FF00FF';
            } else if (popup.points >= 100) {
                // Medium value - regular enemy
                this.ctx.fillStyle = '#FFFF00'; // Yellow
                this.ctx.shadowColor = '#FFFF00';
            } else {
                // Low value - bullet hit
                this.ctx.fillStyle = '#00FFFF'; // Cyan
                this.ctx.shadowColor = '#00FFFF';
            }
            
            // Add glow effect
            this.ctx.shadowBlur = 5;
            
            // Apply scale transform
            this.ctx.translate(popup.x, popup.y);
            this.ctx.scale(popup.scale, popup.scale);
            
            // Draw text
            this.ctx.fillText(`+${popup.points}`, 0, 0);
            
            // Reset transforms
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        this.ctx.restore();
    }
    
    submitScore() {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput ? playerNameInput.value.trim() : 'PLAYER';
        
        // If name is empty, use default
        const name = playerName || 'PLAYER';
        
        if (window.highScoreManager) {
            console.log(`Submitting score for player: ${name}`);
            
            // Use the stored finalLevel value, with a fallback to ensure it's never undefined
            window.highScoreManager.submitHighScore(name, this.score, this.finalLevel || 1)
                .then(() => {
                    console.log('High score submitted successfully');
                    // Update the high scores display
                    window.highScoreManager.renderHighScores('gameover-highscores-list');
                })
                .catch(error => {
                    console.error('Error submitting high score:', error);
                });
        }
    }
    
    // Handle pause key presses (ESC or P)
    handlePauseKeys(e) {
        if (this.gameState === 'playing' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
            this.togglePause();
        }
    }
    
    // Handle window losing focus
    handleBlur() {
        if (this.gameState === 'playing' && !this.isPaused) {
            this.togglePause(true); // Force pause
        }
    }
      // Handle window regaining focus
    handleFocus() {
        // Reset controls when focus is regained to prevent stuck keys
        if (this.controls) {
            this.controls.reset();
        }
    }
    
    // Toggle pause state
    togglePause(forcePause = false) {
        if (this.gameState !== 'playing') return;
        
        if (forcePause) {
            this.isPaused = true;
        } else {
            this.isPaused = !this.isPaused;
        }
        
        // Show or hide pause overlay
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            if (this.isPaused) {
                pauseOverlay.classList.remove('hidden');
            } else {
                pauseOverlay.classList.add('hidden');
            }
        }
          // Reset controls when unpausing to prevent stuck keys
        if (!this.isPaused && this.controls) {
            this.controls.reset();
        }
    }
    
    // Render pause overlay with information
    renderPauseOverlay() {
        // Semi-transparent overlay is handled by CSS
        // This method can be extended to add dynamic content to the pause screen
        const pauseInfo = document.querySelector('.pause-content h2');
        if (pauseInfo) {
            pauseInfo.textContent = 'GAME PAUSED';
        }
    }      // Initialize light speed effect for level transitions
    initLightSpeedEffect() {
        this.lightSpeedActive = true;
        this.lightSpeedStars = [];
        
        // Create initial light speed stars - increased number for more dramatic effect
        for (let i = 0; i < 400; i++) {
            this.createLightSpeedStar();
        }
        
        // Play light speed sound effect
        if (window.audioManager) {
            window.audioManager.play('lightspeed', 0.4);
        }
        
        // Create additional stars over time for continuous effect
        this.lightSpeedInterval = setInterval(() => {
            // Add a few more stars
            for (let i = 0; i < 15; i++) {
                this.createLightSpeedStar();
            }
        }, 200);
        
        // Set a timeout to end the effect
        setTimeout(() => {
            this.lightSpeedActive = false;
            clearInterval(this.lightSpeedInterval);
        }, 2800); // 2.8 seconds of light speed effect - enhanced duration for better visual impact
    }      // Create a single light speed star with enhanced visual effects
    createLightSpeedStar() {
        // Stars start near the center and move outward
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Random angle for the star's direction
        const angle = Math.random() * Math.PI * 2;
        
        // Random distance from center (mostly near center for better warp effect)
        const distance = Math.random() * Math.min(this.width, this.height) * 0.08;
        
        // Enhanced color variation for more vibrant effect
        const colorChoices = [
            '255, 255, 255', // White
            '200, 220, 255', // Light blue
            '220, 220, 255', // Pale blue
            '255, 240, 200', // Warm white
            '180, 200, 255', // Sky blue
            '220, 180, 255', // Light purple
            '200, 255, 230'  // Mint
        ];
        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        
        // More variation in speed for enhanced depth perception
        const speedTypes = [
            { chance: 0.2, factor: 3.5 }, // Very fast (20%)
            { chance: 0.5, factor: 2.2 }, // Medium fast (30%)
            { chance: 0.8, factor: 1.5 }, // Normal (30%) 
            { chance: 1.0, factor: 0.8 }  // Slow (20%)
        ];
        
        let speedFactor = 1;
        const speedRoll = Math.random();
        for (const type of speedTypes) {
            if (speedRoll <= type.chance) {
                speedFactor = type.factor;
                break;
            }
        }
        
        const star = {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            angle: angle,
            speed: (1 + Math.random() * 2) * speedFactor,
            size: 0.8 + Math.random() * 3.2, // More size variation
            opacity: 0.4 + Math.random() * 0.6,
            trail: [], // For creating light trails
            trailLength: Math.floor(8 + speedFactor * 4), // Variable trail length based on speed
            color: color,
            // Higher accelerationFactor for faster stars
            accelerationFactor: 1.05 + (Math.random() * 0.03 * speedFactor)
        };
        
        this.lightSpeedStars.push(star);
    }
      // Update and render the light speed effect
    renderLightSpeedEffect() {
        this.ctx.save();
        
        // Semi-transparent dark overlay to enhance contrast
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update each star
        for (let i = this.lightSpeedStars.length - 1; i >= 0; i--) {
            const star = this.lightSpeedStars[i];
              // Store current position for variable-length trail
            const maxTrailLength = star.trailLength || 12; // Use custom trail length or default to 12
            
            if (star.trail.length < maxTrailLength) {
                star.trail.push({x: star.x, y: star.y});
            } else {
                star.trail.shift();
                star.trail.push({x: star.x, y: star.y});
            }
            
            // Move star outward from center
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            
            // Increase speed for warp effect
            star.speed *= star.accelerationFactor;
            
            // Remove if off screen
            if (star.x < 0 || star.x > this.width || 
                star.y < 0 || star.y > this.height) {
                this.lightSpeedStars.splice(i, 1);
                this.createLightSpeedStar();
                continue;
            }
            
            // Draw star with trail
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            
            // Draw trail with gradient for fade effect
            const trailLength = star.trail.length;
            for (let j = 0; j < trailLength; j++) {
                const point = star.trail[trailLength - j - 1];
                this.ctx.lineTo(point.x, point.y);
                
                // Adjust opacity based on position in trail
                const trailOpacity = star.opacity * (1 - j / trailLength);
                
                if (j === 0 || j === Math.floor(trailLength / 3) || j === Math.floor(trailLength * 2 / 3)) {
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    this.ctx.strokeStyle = `rgba(${star.color}, ${trailOpacity})`;
                    this.ctx.lineWidth = star.size * (1 - j / trailLength * 0.7);
                }
            }
            this.ctx.stroke();
            
            // Draw star point with glow
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = `rgba(${star.color}, 1.0)`;
            this.ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
            
            // Draw as circle instead of rectangle for smoother look
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        }
          // Add an enhanced radial gradient in center for more dramatic light speed effect
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, this.width/2
        );
        gradient.addColorStop(0, 'rgba(120, 140, 255, 0.15)');
        gradient.addColorStop(0.3, 'rgba(100, 120, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add pulsating central light source for enhanced visual impact
        const pulseSize = 50 + Math.sin(Date.now() / 100) * 15;
        const pulseGradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, pulseSize
        );
        pulseGradient.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
        pulseGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        this.ctx.fillStyle = pulseGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height/2, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

// Initialize the game with optimized asset loading
window.addEventListener('load', () => {
    // Show loading screen first
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercent = document.getElementById('loading-percent');
    
    // Preload game assets
    const preloadAssets = () => {
        // Load essential images
        window.assetLoader.addImage('player', 'assets/images/player.png');
        window.assetLoader.addImage('enemy1', 'assets/images/enemy1.png');
        window.assetLoader.addImage('enemy2', 'assets/images/enemy2.png');
        window.assetLoader.addImage('boss', 'assets/images/boss.png');
        window.assetLoader.addImage('powerup', 'assets/images/powerup.png');
        
        // Preload audio assets
        window.assetLoader.addSound('shoot', 'assets/sounds/shoot.mp3');
        window.assetLoader.addSound('explosion', 'assets/sounds/explosion.mp3');
        window.assetLoader.addSound('powerup', 'assets/sounds/powerup.mp3');
        window.assetLoader.addSound('enemyShoot', 'assets/sounds/enemy-shoot.mp3');
        window.assetLoader.addSound('lightspeed', 'assets/sounds/lightspeed.mp3');
        
        // Start preloading and update progress
        window.assetLoader.preload(
            // Progress callback
            (progress) => {
                loadingBar.style.width = `${progress}%`;
                loadingPercent.textContent = `${progress}%`;
            },
            // Complete callback
            () => {
                // Simple delay to ensure smooth transition
                setTimeout(() => {
                    // Hide loading screen and show start screen
                    loadingScreen.classList.add('hidden');
                    document.getElementById('start-screen').classList.remove('hidden');
                    
                    // Initialize game
                    window.game = new Game();
                    
                    // Initialize splash animation
                    if (window.initSplashAnimation) {
                        window.initSplashAnimation();
                    }
                }, 500); // Small delay for smoother transition
            }
        );
    };
    
    // Start asset loading with a small delay to show loading screen
    setTimeout(preloadAssets, 100);
});

// Add destroy method to properly clean up resources
Game.prototype.destroy = function() {
    // Stop animation loop
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('keydown', this.handlePauseKeys);
    
    // Clean up UI event listeners
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.removeEventListener('click', this.startGame);
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.removeEventListener('click', this.startGame);
    }
    
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.removeEventListener('click', () => {});
    }
    
    // Clear references to help garbage collection
    this.canvas = null;
    this.ctx = null;
    this.player = null;
    this.controls = null;
    this.projectilePool = null;
    this.explosionPool = null;
    this.enemyManager = null;
    this.powerUpManager = null;
    this.levelManager = null;
    this.starfield = null;
};
