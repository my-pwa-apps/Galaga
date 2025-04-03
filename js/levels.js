// Enhanced level difficulty progression with optimized transitions

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.enemiesPerLevel = 40;
        this.levelCompletionDelay = 180; // 3 seconds at 60fps
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
        this.transitionPhase = 'none'; // 'none', 'fade-in', 'delay', 'fade-out'
        this.nextLevelPrepared = false;
    }
    
    startLevel(level = null) {
        if (level !== null) {
            this.currentLevel = level;
        }
        
        // Reset transition state
        this.isTransitioning = false;
        this.transitionPhase = 'none';
        this.nextLevelPrepared = false;
        
        // Clear any remaining enemies and projectiles
        this.game.enemyManager.reset();
        this.game.projectiles = [];
        
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
    
    // Calculate difficulty parameters based on current level with improved scaling
    getDifficultyParams() {
        // Apply non-linear scaling for higher levels to maintain challenge
        const levelFactor = this.currentLevel <= 5 ? 
            this.currentLevel : 
            5 + Math.sqrt(this.currentLevel - 5);
        
        return {
            enemySpeed: this.baseEnemySpeed + (levelFactor * 0.2),
            enemyHealth: this.baseEnemyHealth + Math.floor(levelFactor / 3),
            bossHealth: this.baseBossHealth + Math.floor(levelFactor / 2),
            fireRate: this.baseFireRate * (1 + levelFactor * 0.15),
            bossFireRate: this.baseBossFireRate * (1 + levelFactor * 0.1),
            attackChance: 0.001 * (1 + levelFactor * 0.1),
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
        this.transitionPhase = 'fade-in';
        this.transitionOpacity = 0;
        this.completionTimer = 0;
        this.nextLevelPrepared = false;
        console.log(`Starting transition from level ${this.currentLevel}`);
    }
    
    handleTransition() {
        switch (this.transitionPhase) {
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
    
    reset() {
        this.currentLevel = 1;
        this.completionTimer = 0;
        this.isTransitioning = false;
        this.transitionPhase = 'none';
        this.nextLevelPrepared = false;
    }
}
