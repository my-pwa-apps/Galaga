// Update game state transitions to properly reset controls

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 600;
        this.height = 800;
        this.frameCount = 0;
        this.score = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.player = new Player(this);
        this.controls = new Controls(this);
        this.projectiles = [];
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.levelManager = new LevelManager(this);
        this.explosions = [];
        this.stars = this.generateStars(100);
        
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        
        this.initUI();
        this.animate();
        
        // Initialize audio-related elements
        this.setupAudioControls();
    }
    
    resize() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const ratio = this.width / this.height;
        
        let canvasWidth, canvasHeight;
        
        if (containerHeight * ratio < containerWidth) {
            canvasHeight = containerHeight * 0.9;
            canvasWidth = canvasHeight * ratio;
        } else {
            canvasWidth = containerWidth * 0.9;
            canvasHeight = canvasWidth / ratio;
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
    }
    
    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 0.5
            });
        }
        return stars;
    }
    
    initUI() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
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
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.player.reset();
        this.levelManager.reset();
        this.powerUpManager.reset();
        this.levelManager.startLevel();
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Update score UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.player.lives;
        document.getElementById('active-power').textContent = 'NONE';
        
        // Display initial level
        this.displayLevelInfo();
        
        // Play background music
        if (window.audioManager) {
            window.audioManager.stopAll();
            this.backgroundMusic = window.audioManager.play('background', 0.5);
        }
        
        // Reset controls when starting game to prevent stuck inputs
        if (this.controls) {
            this.controls.reset();
        }
    }
    
    // Add method to display level information
    displayLevelInfo() {
        const level = this.levelManager.currentLevel;
        console.log(`Level ${level} started. Difficulty increased!`);
        
        // You could add a visual indicator of difficulty here if desired
        const diffParams = this.levelManager.getDifficultyParams();
        console.log(`Enemy Speed: ${diffParams.enemySpeed.toFixed(1)}, Boss Health: ${diffParams.bossHealth}`);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.stopAll();
            window.audioManager.play('gameOver', 0.7);
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        // Reset controls when game over
        if (this.controls) {
            this.controls.reset();
        }
    }
    
    update() {
        this.frameCount++;
        
        if (this.gameState !== 'playing') return;
        
        this.player.update();
        this.enemyManager.update();
        this.powerUpManager.update();
        this.levelManager.update();
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const shouldRemove = projectile.update();
            
            if (shouldRemove) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer--;
            if (this.explosions[i].timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        
        // Update stars
        this.updateStars();
        
        this.checkCollisions();
    }
    
    updateStars() {
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            star.y += star.speed;
            
            // If star goes out of view, reset it to the top
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }
    }
    
    checkCollisions() {
        // Player projectiles vs enemies and enemy bullets
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (projectile.type === 'player') {
                for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemyManager.enemies[j];
                    
                    if (detectCollision(projectile, enemy)) {
                        // Create explosion
                        this.createExplosion(enemy.x, enemy.y, enemy.radius * 1.5, 30);
                        
                        // Add score
                        this.score += enemy.points;
                        document.getElementById('score').textContent = this.score;
                        
                        // Try to spawn power-up
                        console.log("Enemy destroyed, trying to spawn power-up");
                        this.powerUpManager.trySpawnPowerUp(enemy.x, enemy.y);
                        
                        // Remove enemy and projectile
                        this.enemyManager.enemies.splice(j, 1);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
                
                // NEW: Check collisions with enemy bullets
                for (let j = this.projectiles.length - 1; j >= 0; j--) {
                    const enemyProjectile = this.projectiles[j];
                    
                    // Skip if checking against itself or non-enemy projectiles
                    if (i === j || enemyProjectile.type !== 'enemy') continue;
                    
                    if (detectCollision(projectile, enemyProjectile)) {
                        // Create small explosion
                        this.createExplosion(enemyProjectile.x, enemyProjectile.y, 10, 20);
                        
                        // Play bullet hit sound
                        if (window.audioManager) {
                            window.audioManager.play('bulletHit', 0.4);
                        }
                        
                        // Remove both projectiles
                        this.projectiles.splice(Math.max(i, j), 1);
                        this.projectiles.splice(Math.min(i, j), 1);
                        
                        // Adjust indices since we removed items
                        if (i > j) i--;
                        break;
                    }
                }
            }
            
            // Enemy projectiles vs player
            if (projectile.type === 'enemy' && !this.player.invulnerable) {
                if (detectCollision(projectile, this.player)) {
                    this.player.hit();
                    
                    // Create explosion
                    this.createExplosion(this.player.x, this.player.y, this.player.radius * 2, 60);
                    
                    this.projectiles.splice(i, 1);
                }
            }
        }
        
        // Enemy ships vs player
        if (!this.player.invulnerable) {
            for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemyManager.enemies[i];
                
                if (detectCollision(enemy, this.player)) {
                    this.player.hit();
                    
                    // Create explosion for both objects
                    this.createExplosion(this.player.x, this.player.y, this.player.radius * 2, 60);
                    this.createExplosion(enemy.x, enemy.y, enemy.radius * 1.5, 30);
                    
                    // Remove enemy and add score
                    this.score += enemy.points;
                    document.getElementById('score').textContent = this.score;
                    this.enemyManager.enemies.splice(i, 1);
                }
            }
        }
    }
    
    createExplosion(x, y, radius, duration) {
        this.explosions.push({
            x: x,
            y: y,
            timer: duration,
            radius: radius,
            initialTimer: duration
        });
        
        // Play explosion sound with volume based on explosion size
        if (window.audioManager) {
            const volumeScale = Math.min(1.0, radius / 30);
            window.audioManager.play('explosion', 0.3 + volumeScale * 0.4);
        }
    }
    
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw all game elements
        if (this.gameState === 'playing') {
            try {
                this.player.draw();
                this.enemyManager.draw();
                this.powerUpManager.draw();
                
                // Draw projectiles
                this.projectiles.forEach(projectile => {
                    projectile.draw();
                });
                
                // Draw explosions
                this.explosions.forEach(explosion => {
                    const opacity = explosion.timer / explosion.initialTimer;
                    if (typeof drawExplosion === 'function') {
                        drawExplosion(this.ctx, explosion.x, explosion.y, explosion.radius, '#FFA500', opacity);
                    } else {
                        // Fallback explosion drawing
                        this.ctx.save();
                        this.ctx.globalAlpha = opacity;
                        this.ctx.fillStyle = '#FFA500';
                        this.ctx.beginPath();
                        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    }
                });
            } catch (error) {
                console.error('Error in draw method:', error);
                // Display error on screen
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('Rendering error: ' + error.message, 20, 30);
            }
        }
    }
    
    drawStars() {
        // Background gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#000010');
        bgGradient.addColorStop(1, '#000030');
        
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw the stars
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Twinkle effect
            const brightness = 0.5 + Math.sin(this.frameCount * 0.05 + i) * 0.5;
            
            // Color based on size (smaller stars are bluer, larger are whiter)
            const hue = 210 - star.size * 20;
            this.ctx.fillStyle = `hsla(${hue}, 100%, ${80 + brightness * 20}%, ${brightness})`;
            
            // Draw the star
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow for larger stars
            if (star.size > 2) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5 * brightness;
                this.ctx.shadowBlur = star.size * 2;
                this.ctx.shadowColor = `hsla(${hue}, 100%, 80%, 1)`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Make game instance globally available for debugging
window.addEventListener('load', () => {
    window.game = new Game();
});
