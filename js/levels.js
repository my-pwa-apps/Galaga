// Enhanced level difficulty progression with optimized transitions

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.enemiesPerLevel = 40;
        this.levelCompletionDelay = 120; // 2 seconds at 60fps (reduced from 3s)
        this.completionTimer = 0;
        this.isTransitioning = false;
        
        // Add difficulty scaling parameters
        this.baseEnemySpeed = 2;
        this.baseEnemyHealth = 1;
        this.baseBossHealth = 3;
        this.baseFireRate = 0.001;
        this.baseBossFireRate = 0.003;
        
        // Level transition effects
        this.transitionOpacity = 0;
        this.transitionPhase = 'none'; // 'none', 'hyperspace', 'fade-in', 'delay', 'fade-out'
        this.nextLevelPrepared = false;
        
        // Hyperspace effect timing
        this.hyperspaceTimer = 0;
        this.hyperspaceDuration = 120; // 2 seconds at 60fps
        this.playerYPosition = 0; // For tracking player movement during hyperspace
    }
    
    // Make sure the currentLevel is always correctly updated
    startLevel(level) {
        this.currentLevel = level;
        
        // Reset transition state
        this.isTransitioning = false;
        this.transitionPhase = 'none';
        this.nextLevelPrepared = false;
        
        // Reset hyperspace effect
        this.hyperspaceTimer = 0;
        
        // Clear any remaining enemies and projectiles
        this.game.enemyManager.reset();
        this.game.projectilePool.clear();
        
        // Create enemy formation with appropriate difficulty
        this.game.enemyManager.createFormation(this.currentLevel);
        
        // Update UI
        document.getElementById('level').textContent = this.currentLevel;
        
        // Show level notification
        this.showLevelNotification();
        
        // Play level start sound (if not the first level)
        if (window.audioManager && this.currentLevel > 1) {
            window.audioManager.play('levelUp', 0.6);
        }
        
        console.log(`Level ${this.currentLevel} started`);
    }
    
    // Add a method to display the current level
    showLevelNotification() {
        const notification = document.getElementById('powerup-notification');
        notification.textContent = `LEVEL ${this.currentLevel}`;
        notification.classList.remove('hidden');
        
        // Hide the notification after 2 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 2000);
    }
    
    // Calculate difficulty parameters based on current level with more gradual scaling
    getDifficultyParams() {
        // Use a logarithmic curve for more gradual scaling instead of the previous square root approach
        // This ensures levels 6-8 don't have such a sharp difficulty increase
        
        // Create a more gradual curve that flattens out for higher levels
        const levelFactor = this.currentLevel <= 3 ? 
            this.currentLevel : // Linear for first few levels
            3 + Math.log(this.currentLevel - 2) / Math.log(1.6); // Logarithmic scaling after level 3
        
        console.log(`Level ${this.currentLevel}, Difficulty factor: ${levelFactor.toFixed(2)}`);
        
        return {
            // More gradual speed increase
            enemySpeed: this.baseEnemySpeed + (levelFactor * 0.15),
            
            // Health increases at specific level thresholds instead of continuously
            enemyHealth: this.baseEnemyHealth + Math.floor(levelFactor / 4),
            bossHealth: this.baseBossHealth + Math.floor(levelFactor / 3),
            
            // More gradual fire rate increases
            fireRate: this.baseFireRate * (1 + levelFactor * 0.12),
            bossFireRate: this.baseBossFireRate * (1 + levelFactor * 0.08),
            
            // More gradual attack chance increases
            attackChance: 0.001 * (1 + levelFactor * 0.08),
            
            // Points increase steadily
            pointMultiplier: 1 + (levelFactor * 0.1)
        };
    }
    
    update() {
        // Check if we're in a level transition
        if (this.isTransitioning) {
            this.handleTransition();
            return;
        }
        
        // Check if level is completed (all enemies defeated)
        if (this.game.enemyManager.enemies.length === 0 && !this.completionTimer) {
            this.completionTimer = this.levelCompletionDelay;
            
            // Force reset all time-based powerups when level is completed
            if (this.game.player && typeof this.game.player.resetPowerUps === 'function') {
                this.game.player.resetPowerUps(true); // Force clear all powerups
                console.log("Level completed - forced powerup clear");
            }
        }
        
        // Handle level completion timer
        if (this.completionTimer > 0) {
            this.completionTimer--;
            
            if (this.completionTimer <= 0) {
                this.startLevelTransition();
            }
        }
    }
    
    startLevelTransition() {
        this.isTransitioning = true;
        this.transitionPhase = 'hyperspace';
        this.transitionOpacity = 0;
        this.completionTimer = 0;
        this.nextLevelPrepared = false;
        this.hyperspaceTimer = 0;
        
        // Store the player's current position for hyperspace animation
        this.playerYPosition = this.game.player.y;
        
        // Force clear all powerups immediately when transitioning
        if (this.game.player && typeof this.game.player.resetPowerUps === 'function') {
            this.game.player.resetPowerUps(true);
            console.log("Level transition started - forced powerup clear");
        }
        
        // Also make sure to clear any powerup visuals and UI elements
        const activePowerElement = document.getElementById('active-power');
        if (activePowerElement) {
            activePowerElement.textContent = 'NONE';
        }
        
        // Hide power timer
        const powerTimerContainer = document.getElementById('power-timer-container');
        if (powerTimerContainer) {
            powerTimerContainer.classList.add('hidden');
            powerTimerContainer.setAttribute('aria-hidden', 'true');
        }
        
        // Start hyperspace effect in starfield
        this.game.starfield.startHyperspace();
        
        // Play the hyperspeed sound effect
        if (window.audioManager) {
            window.audioManager.play('hyperspeed', 0.7);
        }
        
        console.log(`Starting transition from level ${this.currentLevel}`);
    }
    
    handleTransition() {
        switch (this.transitionPhase) {
            case 'hyperspace':
                // Hyperspace animation phase
                this.hyperspaceTimer++;
                
                // Move player gradually to top of screen during hyperspace
                if (this.game.player && this.game.player.active) {
                    // Calculate movement path towards top of screen
                    // Start slow, accelerate in the middle, then slow down again
                    const progress = this.hyperspaceTimer / this.hyperspaceDuration;
                    const speedFactor = Math.sin(progress * Math.PI); // Creates an acceleration curve
                    
                    // Target Y is top of screen with a little padding
                    const targetY = 20;
                    const startY = this.playerYPosition;
                    const totalDistance = startY - targetY;
                    
                    // Create an easing effect for the movement
                    const easedPosition = startY - (totalDistance * Math.pow(progress, 1.5));
                    
                    // Move player's Y position - ensure it reaches the top
                    this.game.player.y = Math.max(targetY, easedPosition);
                    
                    // Apply more dynamic side-to-side motion that increases with speed
                    const wobbleAmount = Math.sin(this.hyperspaceTimer * 0.3) * 8 * speedFactor;
                    this.game.player.x += wobbleAmount * 0.2;
                    
                    // Keep player within screen bounds
                    this.game.player.x = Math.max(this.game.player.radius, 
                                        Math.min(this.game.width - this.game.player.radius, 
                                        this.game.player.x));
                }
                
                // When hyperspace completes, move to fade in phase
                if (this.hyperspaceTimer >= this.hyperspaceDuration) {
                    this.transitionPhase = 'fade-in';
                }
                break;
                
            case 'fade-in':
                // Fade in black overlay
                this.transitionOpacity += 0.05;
                if (this.transitionOpacity >= 1) {
                    // Move to delay phase when fully black
                    this.transitionPhase = 'delay';
                    
                    // Prepare for next level ONLY ONCE
                    if (!this.nextLevelPrepared) {
                        this.currentLevel += 1;
                        this.nextLevelPrepared = true;
                        
                        // Reset player position to bottom of screen
                        if (this.game.player) {
                            this.game.player.y = this.game.height - 50;
                            this.game.player.x = this.game.width / 2;
                        }
                        
                        console.log(`Prepared next level: ${this.currentLevel}`);
                        
                        // Set a timeout to move to fade-out phase
                        setTimeout(() => {
                            this.transitionPhase = 'fade-out';
                        }, 500);
                    }
                }
                break;
                
            case 'delay':
                // Just waiting for the timeout to complete
                break;
                
            case 'fade-out':
                // Fade out black overlay
                this.transitionOpacity -= 0.05;
                if (this.transitionOpacity <= 0) {
                    // Stop hyperspace effect in starfield
                    this.game.starfield.stopHyperspace();
                    
                    // Finish transition and start the new level
                    this.isTransitioning = false;
                    this.transitionPhase = 'none';
                    this.startLevel();
                }
                break;
        }
        
        // Always render the transition effect
        this.renderTransition();
    }
    
    renderTransition() {
        // Draw transition overlay (only for fade phases)
        if (this.transitionPhase === 'fade-in' || this.transitionPhase === 'delay' || this.transitionPhase === 'fade-out') {
            // Draw a semi-transparent overlay
            const ctx = this.game.ctx;
            ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionOpacity})`;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            
            // Show level text when mostly faded in
            if (this.transitionOpacity > 0.7 && (this.transitionPhase === 'delay' || this.transitionPhase === 'fade-out')) {
                ctx.fillStyle = 'white';
                ctx.font = '36px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`LEVEL ${this.currentLevel}`, this.game.width / 2, this.game.height / 2);
            }
        }
    }
    
    reset() {
        this.currentLevel = 1;
        this.completionTimer = 0;
        this.isTransitioning = false;
        this.transitionPhase = 'none';
        this.nextLevelPrepared = false;
        this.hyperspaceTimer = 0;
        
        // Reset starfield hyperspace effect
        if (this.game.starfield) {
            this.game.starfield.stopHyperspace();
        }
    }
}
