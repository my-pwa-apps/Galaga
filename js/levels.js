// Enhanced level difficulty progression

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.enemiesPerLevel = 40;
        this.levelCompletionDelay = 180; // 3 seconds at 60fps
        this.completionTimer = 0;
        
        // Add difficulty scaling parameters
        this.baseEnemySpeed = 2;
        this.baseEnemyHealth = 1;
        this.baseBossHealth = 3;
        this.baseFireRate = 0.001;
        this.baseBossFireRate = 0.003;
    }
    
    startLevel() {
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
    
    // Calculate difficulty parameters based on current level
    getDifficultyParams() {
        return {
            enemySpeed: this.baseEnemySpeed + (this.currentLevel * 0.2),
            enemyHealth: this.baseEnemyHealth + Math.floor(this.currentLevel / 4),
            bossHealth: this.baseBossHealth + Math.floor(this.currentLevel / 2),
            fireRate: this.baseFireRate * (1 + this.currentLevel * 0.2),
            bossFireRate: this.baseBossFireRate * (1 + this.currentLevel * 0.15),
            attackChance: 0.001 * (1 + this.currentLevel * 0.1),
            pointMultiplier: 1 + (this.currentLevel * 0.1)
        };
    }
    
    update() {
        // Check if level is completed (all enemies defeated)
        if (this.game.enemyManager.enemies.length === 0 && !this.completionTimer) {
            this.completionTimer = this.levelCompletionDelay;
        }
        
        // Handle level completion timer
        if (this.completionTimer > 0) {
            this.completionTimer--;
            
            if (this.completionTimer <= 0) {
                this.currentLevel++;
                this.startLevel();
            }
        }
    }
    
    reset() {
        this.currentLevel = 1;
        this.completionTimer = 0;
    }
}
