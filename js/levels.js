// Enhanced level difficulty progression with optimized transitions

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 180; // 3 seconds at 60 fps
        this.messageFlashTimer = 0;
        this.messageVisible = true;
        
        // Store base difficulty parameters
        this.baseDifficulty = {
            enemySpeed: 1.0,
            enemyHealth: 1,
            bossHealth: 3,
            fireRate: 0.005,
            bossFireRate: 0.008,
            pointMultiplier: 1.0
        };
        
        // Track level state
        this.errors = 0;
        this.enemiesSpawned = false;
        this.initialEnemyCount = 0;
        this.levelStartTime = 0;
        this.minLevelDuration = 5000; // Minimum 5 seconds per level
        
        // Add level themes to enhance feeling of progression
        this.levelThemes = [
            { name: "Training Ground", description: "A test of your basic skills." },
            { name: "The Invasion Begins", description: "Enemies have arrived in force!" },
            { name: "First Wave", description: "The alien force grows stronger." },
            { name: "Green Squadron", description: "New alien types have arrived!" },
            { name: "Advanced Vanguard", description: "The aliens are adapting to your tactics." },
            { name: "The Elite", description: "Beware of their special abilities!" },
            { name: "Dark Fleet", description: "Advanced alien technology detected." },
            { name: "Mysterious Forces", description: "These aliens have unique powers." },
            { name: "Guardian Squadron", description: "The aliens' elite defense force." },
            { name: "Golden Armada", description: "Face the most powerful alien fleet!" }
        ];
    }
    
    // Calculate difficulty parameters based on current level
    getDifficultyParams() {
        // Fix: Add defensive checks to prevent NaN
        if (!this.currentLevel || isNaN(this.currentLevel)) {
            console.error("Invalid level detected:", this.currentLevel);
            this.currentLevel = 1; // Reset to level 1 if invalid
            this.errors++; // Track error
            
            // If too many errors, restart from level 1
            if (this.errors > 3) {
                console.warn("Too many level errors - resetting to level 1");
                this.startLevel(1);
                this.errors = 0;
            }
        }
        
        // Get level for calculations (ensure it's a valid number)
        const level = Math.max(1, this.currentLevel || 1);
        
        // Fix: Use a more gentle difficulty curve - especially for early levels
        const speedIncrease = 1.0 + (level - 1) * 0.05; // 5% increase per level
        const healthIncrease = Math.floor(level / 3) + 1; // +1 health every 3 levels
        const bossHealthIncrease = Math.floor(level / 2) + 3; // +1 boss health every 2 levels
        
        // Fix: Adjust fire rate curve to be more manageable in early levels
        const fireRateMultiplier = 1.0 + (level - 1) * 0.1; // 10% increase per level
        
        // Fix: Add maximum caps to prevent excessive difficulty
        return {
            enemySpeed: Math.min(this.baseDifficulty.enemySpeed * speedIncrease, 2.5),
            enemyHealth: Math.min(healthIncrease, 5),
            bossHealth: Math.min(bossHealthIncrease, 10),
            fireRate: Math.min(this.baseDifficulty.fireRate * fireRateMultiplier, 0.015),
            bossFireRate: Math.min(this.baseDifficulty.bossFireRate * fireRateMultiplier, 0.025),
            pointMultiplier: 1.0 + (level - 1) * 0.1 // 10% more points per level
        };
    }
    
    startLevel(level) {
        // Ensure level is a valid number
        if (isNaN(level) || level < 1) {
            console.error("Invalid level number:", level);
            level = 1; // Fallback to level 1
        }
        
        console.log(`Starting level ${level}`);
        this.currentLevel = level;
        
        // Get theme for this level
        const themeIndex = Math.min(level - 1, this.levelThemes.length - 1);
        const theme = this.levelThemes[themeIndex];
        
        // Update level display in UI
        document.getElementById('level').textContent = this.currentLevel;
        
        // Reset level state tracking
        this.enemiesSpawned = false;
        this.initialEnemyCount = 0;
        this.levelStartTime = Date.now();
        
        // Show level intro with theme
        this.showLevelIntro(level, theme);
        
        // Reset enemy formation for new level
        if (this.game.enemyManager) {
            this.game.enemyManager.enemies = [];
            this.game.enemyManager.createFormation(this.currentLevel);
        } else {
            console.error("Enemy manager not initialized");
        }
    }
    
    // Show level intro with theme
    showLevelIntro(level, theme) {
        // Create a temporary overlay for level intro
        const overlay = document.createElement('div');
        overlay.className = 'level-intro';
        
        // Add level info
        const levelNumber = document.createElement('h2');
        levelNumber.textContent = `LEVEL ${level}`;
        
        // Add theme name
        const themeName = document.createElement('h3');
        themeName.textContent = theme.name;
        
        // Add description
        const description = document.createElement('p');
        description.textContent = theme.description;
        
        // Add elements to overlay
        overlay.appendChild(levelNumber);
        overlay.appendChild(themeName);
        overlay.appendChild(description);
        
        // Add to game container
        const gameContainer = document.getElementById('game-screen');
        if (gameContainer) {
            gameContainer.appendChild(overlay);
            
            // Animate in
            setTimeout(() => {
                overlay.classList.add('active');
                
                // Animate out and remove after delay
                setTimeout(() => {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 500);
                }, 2000);
            }, 0);
        }
    }
    
    // Track when enemies have spawned
    enemiesHaveSpawned(count) {
        console.log(`Level ${this.currentLevel}: ${count} enemies have spawned`);
        this.enemiesSpawned = true;
        this.initialEnemyCount = count;
    }
    
    update() {
        // Skip if transitioning
        if (this.isTransitioning) {
            this.handleTransition();
            return;
        }
        
        // Don't check for level completion until:
        // 1. Enemies have been spawned
        // 2. We've waited the minimum level duration
        // 3. There were actually enemies to begin with
        const now = Date.now();
        const levelElapsed = now - this.levelStartTime;
        const minTimeElapsed = levelElapsed > this.minLevelDuration;
        
        if (this.enemiesSpawned && minTimeElapsed) {
            if (this.initialEnemyCount === 0) {
                // If no enemies were created for this level despite enemiesSpawned being true,
                // then we need to generate a new formation
                console.warn("No enemies were created for this level, creating new formation");
                if (this.game.enemyManager) {
                    this.enemiesSpawned = false;
                    this.game.enemyManager.createFormation(this.currentLevel);
                }
                return;
            }
            
            // Check if all enemies are destroyed
            const enemiesCount = this.game.enemyManager ? this.game.enemyManager.enemies.length : 0;
            
            if (enemiesCount === 0) {
                console.log("Level complete! All enemies destroyed.");
                this.goToNextLevel();
            }
        }
    }
    
    goToNextLevel() {
        // Fix: Ensure we're incrementing a valid number
        const nextLevel = (this.currentLevel || 0) + 1;
        
        // Clear lingering powerups between levels
        if (this.game.clearNonPersistentPowerups) {
            this.game.clearNonPersistentPowerups();
        }
        
        // Start transition effect
        this.isTransitioning = true;
        this.transitionTimer = 0;
        this.messageFlashTimer = 0;
        this.messageVisible = true;
        
        console.log(`Transitioning to level ${nextLevel}`);
    }
    
    handleTransition() {
        // Update transition timer
        this.transitionTimer++;
        
        // Flash "Level Complete" message
        this.messageFlashTimer++;
        if (this.messageFlashTimer >= 30) { // Flash every half second
            this.messageFlashTimer = 0;
            this.messageVisible = !this.messageVisible;
        }
        
        // When transition is complete, start next level
        if (this.transitionTimer >= this.transitionDuration) {
            this.isTransitioning = false;
            
            // Fix: Ensure we're incrementing the level correctly
            const nextLevel = (this.currentLevel || 0) + 1;
            this.startLevel(nextLevel);
        }
    }
    
    renderTransition() {
        const ctx = this.game.ctx;
        const width = this.game.width;
        const height = this.game.height;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Only show the message when it should be visible (for flashing effect)
        if (this.messageVisible) {
            // Level complete message
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillStyle = '#FFFF00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LEVEL COMPLETE', width / 2, height / 2 - 40);
            
            // Prepare for next level message
            ctx.font = '18px "Press Start 2P", monospace';
            ctx.fillStyle = '#00FFFF';
            
            // Fix: Ensure we display a valid next level number
            const nextLevel = (this.currentLevel || 0) + 1;
            ctx.fillText(`PREPARE FOR LEVEL ${nextLevel}`, width / 2, height / 2 + 20);
        }
        
        // Progress bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(width / 4, height / 2 + 60, width / 2, 20);
        
        // Progress bar fill
        const progressWidth = (this.transitionTimer / this.transitionDuration) * (width / 2);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(width / 4, height / 2 + 60, progressWidth, 20);
    }
    
    // Fix: Add a reset method for game restart
    reset() {
        this.currentLevel = 1;
        this.isTransitioning = false;
        this.errors = 0;
        
        // Update level display in UI
        document.getElementById('level').textContent = this.currentLevel;
    }
}

// Make LevelManager available globally
if (typeof window !== 'undefined') {
    window.LevelManager = LevelManager;
}
