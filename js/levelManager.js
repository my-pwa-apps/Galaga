class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.enemiesPerLevel = 15; // Base number of enemies
        this.enemiesInCurrentLevel = 0;
        this.enemiesKilled = 0;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 3000; // 3 seconds for level transition
        this.transitionStartTime = 0;
        
        // Level completion message
        this.levelCompleteMessage = '';
        this.messageOpacity = 0;
    }
    
    reset() {
        this.currentLevel = 1;
        this.enemiesKilled = 0;
        this.isTransitioning = false;
        this.transitionProgress = 0;
    }
    
    startLevel(level) {
        this.currentLevel = level;
        this.enemiesKilled = 0;
        this.enemiesInCurrentLevel = this.calculateEnemiesForLevel(level);
        
        // Clear any existing enemies
        this.game.enemyManager.clearEnemies();
        
        // Spawn initial wave of enemies for this level
        this.spawnEnemiesForLevel(level);
        
        // Update UI to show current level
        this.game.updateUI();
        
        // Show level announcement
        this.showLevelAnnouncement(level);
    }
    
    calculateEnemiesForLevel(level) {
        // Increase enemies per level, capping at a reasonable amount
        return Math.min(this.enemiesPerLevel + (level - 1) * 5, 50);
    }
    
    spawnEnemiesForLevel(level) {
        // Number of initial enemies to spawn
        const initialSpawn = Math.min(10, Math.floor(this.enemiesInCurrentLevel / 2));
        
        // Calculate enemy distribution based on level
        const bossCount = Math.floor(level / 3); // One boss every 3 levels
        const octopusCount = Math.max(1, Math.floor(level / 2)); // At least one octopus from level 2
        const spinnerCount = Math.max(1, Math.floor(level / 4)); // At least one spinner from level 4
        const guardianCount = Math.max(0, Math.floor(level / 5)); // Guardians from level 5
        const advancedCount = Math.floor(initialSpawn * 0.3); // 30% advanced enemies
        const basicCount = initialSpawn - (bossCount + octopusCount + spinnerCount + guardianCount + advancedCount);
        
        // Create enemy arrays for each type
        const enemies = [
            ...Array(bossCount).fill('boss'),
            ...Array(octopusCount).fill('octopus'),
            ...Array(spinnerCount).fill('spinner'),
            ...Array(guardianCount).fill('guardian'),
            ...Array(advancedCount).fill('advanced'),
            ...Array(Math.max(0, basicCount)).fill('basic')
        ];
        
        // Shuffle the enemies array for randomization
        this.shuffleArray(enemies);
        
        // Spawn the enemies in formation
        const patterns = ['sine', 'zigzag', 'circle', 'dive'];
        for (let i = 0; i < enemies.length; i++) {
            const type = enemies[i];
            const x = this.game.width * (0.2 + Math.random() * 0.6); // Between 20% and 80% of width
            const y = -50 - i * 30; // Stagger vertical positions
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            this.game.enemyManager.createEnemy(type, x, y, pattern);
        }
    }
    
    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    update() {
        if (this.isTransitioning) {
            const now = Date.now();
            const elapsed = now - this.transitionStartTime;
            
            this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
            
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
                this.startLevel(this.currentLevel + 1);
            }
        } else {
            // Count active enemies
            const activeEnemies = this.game.enemyManager.enemies.length;
            
            // Calculate enemies killed
            this.enemiesKilled = this.enemiesInCurrentLevel - activeEnemies;
            
            // Check if all enemies in this level are defeated
            if (activeEnemies === 0 && this.enemiesKilled >= this.enemiesInCurrentLevel) {
                this.completeLevel();
            }
            
            // Periodically spawn more enemies if below threshold and not all have been spawned
            if (activeEnemies < 5 && this.enemiesKilled < this.enemiesInCurrentLevel * 0.7) {
                // 2% chance each frame to spawn a new enemy if few are left
                if (Math.random() < 0.02) {
                    this.spawnEnemy();
                }
            }
        }
    }
    
    spawnEnemy() {
        const availableTypes = ['basic', 'advanced'];
        
        // Add special types based on level
        if (this.currentLevel >= 2) availableTypes.push('octopus');
        if (this.currentLevel >= 3) availableTypes.push('spinner');
        if (this.currentLevel >= 4) availableTypes.push('guardian');
        if (this.currentLevel >= 5) availableTypes.push('boss');
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const x = this.game.width * Math.random();
        const y = -50;
        const patterns = ['sine', 'zigzag', 'circle', 'dive'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        this.game.enemyManager.createEnemy(type, x, y, pattern);
    }
    
    completeLevel() {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        this.transitionProgress = 0;
        
        // Display level complete message
        this.levelCompleteMessage = `LEVEL ${this.currentLevel} COMPLETE`;
        this.messageOpacity = 1;
        
        // Initialize light speed effect
        this.game.initLightSpeedEffect();
        
        // Play level complete sound
        if (window.audioManager) {
            window.audioManager.play('levelComplete', 0.5);
        }
    }
    
    renderTransition() {
        // Used for non-lightspeed transition effects or additional UI elements
        this.game.ctx.save();
        
        // Render level complete message
        if (this.messageOpacity > 0) {
            this.game.ctx.globalAlpha = this.messageOpacity;
            this.game.ctx.fillStyle = 'white';
            this.game.ctx.font = 'bold 36px "Press Start 2P", monospace';
            this.game.ctx.textAlign = 'center';
            this.game.ctx.textBaseline = 'middle';
            this.game.ctx.fillText(
                this.levelCompleteMessage,
                this.game.width / 2,
                this.game.height / 2 - 50
            );
            
            // Draw "Prepare for Lightspeed" message
            this.game.ctx.font = 'bold 24px "Press Start 2P", monospace';
            this.game.ctx.fillText(
                'PREPARE FOR LIGHTSPEED',
                this.game.width / 2,
                this.game.height / 2 + 50
            );
            
            // Fade out message
            this.messageOpacity -= 0.005;
        }
        
        this.game.ctx.restore();
    }
    
    showLevelAnnouncement(level) {
        // Create a DOM element for the announcement
        const announcement = document.createElement('div');
        announcement.className = 'level-announcement';
        announcement.textContent = `LEVEL ${level}`;
        
        // Add to the game container
        const gameContainer = document.querySelector('.game-container') || document.body;
        gameContainer.appendChild(announcement);
        
        // Animate in and out
        setTimeout(() => {
            announcement.classList.add('show');
            
            // Remove after animation
            setTimeout(() => {
                announcement.classList.remove('show');
                setTimeout(() => {
                    gameContainer.removeChild(announcement);
                }, 1000);
            }, 2000);
        }, 100);
    }
}
