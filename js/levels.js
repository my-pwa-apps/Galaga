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
        
        // Fix: Add error tracking
        this.errors = 0;
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
        // Fix: Ensure level is a valid number
        if (isNaN(level) || level < 1) {
            console.error("Invalid level number:", level);
            level = 1; // Fallback to level 1
        }
        
        console.log(`Starting level ${level}`);
        this.currentLevel = level;
        
        // Update level display in UI
        document.getElementById('level').textContent = this.currentLevel;
        
        // Fix: Ensure enemy manager exists before using it
        if (this.game.enemyManager) {
            // Reset enemy formation for new level
            this.game.enemyManager.enemies = [];
            this.game.enemyManager.createFormation(this.currentLevel);
        } else {
            console.error("Enemy manager not initialized");
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
    
    update() {
        // Skip if transitioning
        if (this.isTransitioning) {
            this.handleTransition();
            return;
        }
        
        // Check if level is complete (all enemies destroyed)
        const enemiesRemaining = this.game.countActiveEnemies ? this.game.countActiveEnemies() : 0;
        
        if (enemiesRemaining <= 0) {
            console.log("Level complete!");
            this.goToNextLevel();
        }
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
