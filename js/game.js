class Game {
    constructor(options) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 600;
        this.height = 800;
        this.frameCount = 0;
        this.score = 0;
        
        // Set up the game
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize game components
        this.player = new Player(this);
        this.controls = new Controls(this);
        this.projectiles = [];
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.levelManager = new LevelManager(this);
        this.explosions = [];
        
        // Initial game state
        this.gameState = 'start';
        
        // Initialize UI and audio
        this.setupAudioControls();
        this.initUI();
        
        // Start animation loop
        this.animate();
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
    
    animate() {
        // Request the next frame
        requestAnimationFrame(() => this.animate());
        
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
        this.levelManager.checkLevelCompletion();
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
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            // Remove projectiles that are off screen
            if (projectile.y < 0 || projectile.y > this.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => projectile.draw());
    }
    
    updateExplosions() {
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
        this.explosions.forEach(explosion => explosion.draw());
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
        
        // Initialize level
        this.levelManager.startLevel(1);
        
        // Play background music
        if (window.audioManager) {
            window.audioManager.playBackgroundMusic();
        }
    }
    
    checkCollisions() {
        // Implement collision detection logic here
        // This would check collisions between projectiles, enemies, player, and power-ups
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
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.playSound('gameOver');
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
