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
        
        // Much more gradual difficulty curve - smoother progression
        // First 3 levels are quite easy to let player learn the mechanics
        let speedIncrease, healthIncrease, bossHealthIncrease, fireRateMultiplier;
        
        if (level <= 3) {
            // First three levels have very minimal increases
            speedIncrease = 1.0 + (level - 1) * 0.01; // Only 1% speed increase per level
            healthIncrease = 1; // Basic enemies have 1 health for first 3 levels
            bossHealthIncrease = 3; // Boss health stays at 3 for first 3 levels
            fireRateMultiplier = 1.0 + (level - 1) * 0.02; // Very slow fire rate increase (2%)
        } else if (level <= 7) {
            // Levels 4-7 start ramping up gently
            speedIncrease = 1.03 + (level - 4) * 0.02; // Starting at 3% then +2% per level
            healthIncrease = Math.floor((level - 1) / 3) + 1; // Health increases more slowly
            bossHealthIncrease = 3 + Math.floor((level - 3) / 2); // Boss health increases every 2 levels
            fireRateMultiplier = 1.04 + (level - 4) * 0.03; // Fire rate increases by 3% per level
        } else {
            // Levels 8+ get gradually more challenging
            speedIncrease = 1.11 + (level - 8) * 0.025; // More noticeable speed increases
            healthIncrease = Math.floor((level - 1) / 2.5) + 1; // More health but still gradual
            bossHealthIncrease = 5 + Math.floor((level - 7) / 2); // Boss health continues to scale
            fireRateMultiplier = 1.13 + (level - 8) * 0.035; // Fire rate increases more significantly
        }
        
        // Special behavior unlocks based on level
        // This adds enemy variety gradually rather than all at once
        const specialBehaviorChance = Math.min(0.05 + (level - 3) * 0.03, 0.3); // Max 30% chance for special behaviors
        const teleportUnlocked = level >= 5; // Teleporting enemies appear at level 5
        const aggressiveUnlocked = level >= 3; // Aggressive enemies appear at level 3
        const bossSpecialAttackChance = Math.min((level - 2) * 0.05, 0.4); // Boss special attacks increase gradually
        
        // Enemy formation pattern complexity increases with level
        const formationComplexity = Math.min(Math.floor((level + 1) / 3), 4); // 5 different formation patterns (0-4)
        
        // Return a much more detailed difficulty parameter object with gradual scaling
        return {
            enemySpeed: Math.min(this.baseDifficulty.enemySpeed * speedIncrease, 1.8), // Lower max speed cap
            enemyHealth: Math.min(healthIncrease, 4), // Max health of 4 for regular enemies
            bossHealth: Math.min(bossHealthIncrease, 8), // Max boss health of 8
            fireRate: Math.min(this.baseDifficulty.fireRate * fireRateMultiplier, 0.01), // More controlled max fire rate
            bossFireRate: Math.min(this.baseDifficulty.bossFireRate * fireRateMultiplier, 0.018), // More controlled boss fire rate
            pointMultiplier: 1.0 + (level - 1) * 0.1, // Keep point multiplier the same
            
            // Additional parameters for more nuanced difficulty progression
            specialBehaviorChance: specialBehaviorChance,
            teleportUnlocked: teleportUnlocked,
            aggressiveUnlocked: aggressiveUnlocked,
            bossSpecialAttackChance: bossSpecialAttackChance,
            formationComplexity: formationComplexity,
            
            // Gradually introduce dive attacks
            diveChance: Math.min(0.001 + (level - 1) * 0.0003, 0.002), // Max 0.2% chance per frame
            
            // Difficulty label for UI feedback
            difficultyLabel: level <= 3 ? "Easy" : 
                            (level <= 6 ? "Normal" : 
                            (level <= 9 ? "Hard" : "Extreme"))
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
        
        // Start transition effect with light speed - only use light speed for transitions
        this.isTransitioning = true;
        this.transitionTimer = 0;
        
        // Activate light speed effect - ensure it's always available
        if (!this.game.initLightSpeedEffect) {
            console.error("Light speed effect not available, implementing fallback");
            // Define a minimal implementation if missing
            this.game.lightSpeedActive = true;
            setTimeout(() => {
                this.game.lightSpeedActive = false;
            }, 2500);
        } else {
            this.game.initLightSpeedEffect();
        }
        
        console.log(`Transitioning to level ${nextLevel}`);
    }
    handleTransition() {
        // Update transition timer
        this.transitionTimer++;
        
        // Always use a transition time that matches the light speed effect
        // Make sure we wait for the light speed effect to finish
        const transitionTime = Math.max(this.transitionDuration, 150); // Slightly longer than light speed effect
        
        // When transition is complete, start next level
        if (this.transitionTimer >= transitionTime) {
            this.isTransitioning = false;
            
            // Fix: Ensure we're incrementing the level correctly
            const nextLevel = (this.currentLevel || 0) + 1;
            this.startLevel(nextLevel);
        }
    }
    renderTransition() {
        // Only use the light speed effect for transitions and skip all other rendering
        // If light speed effect is active, let Game handle it completely
        if (this.game.lightSpeedActive) {
            return;
        }
        
        // This is an emergency fallback rendering if for some reason light speed effect fails
        // This should never be visible in normal gameplay
        const ctx = this.game.ctx;
        const width = this.game.width;
        const height = this.game.height;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Only show a minimal message
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillStyle = '#00FFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOADING NEXT LEVEL', width / 2, height / 2);
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
