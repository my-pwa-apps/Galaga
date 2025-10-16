// ============================================
// GALAGA - MAIN GAME LOOP
// Coordinates all modules and game logic
// ============================================

// Game instance
const GalagaGame = {
    // Timing
    lastTime: 0,
    dt: 0,
    currentTime: 0,
    
    // Session
    sessionId: null,
    
    // Screen effects
    screenShake: 0,
    
    // Background
    stars: [],
    starLayers: [],
    
    // Initialize the game
    init() {
        console.log('🎮 Initializing Galaga game...');
        
        // Initialize renderer
        Renderer.init('gameCanvas');
        
        // Initialize all systems
        AudioEngine.init();
        GraphicsOptimizer.init();
        ObjectPool.init();
        EnemyManager.init();
        PowerupManager.init();
        FirebaseService.init();
        
        // Initialize input with callbacks
        InputManager.init(Renderer.canvas, {
            onStateChange: (keyCode) => this.handleKeyPress(keyCode)
        });
        
        // Generate session ID
        this.sessionId = FirebaseService.generateSessionId();
        
        // Initialize background stars
        this.initStars();
        
        // Fetch high scores
        this.fetchHighScores();
        
        // Reset game state
        GameState.reset();
        
        console.log('✅ Game initialized successfully!');
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    },
    
    // Main game loop
    gameLoop() {
        this.currentTime = performance.now();
        this.dt = Math.min(0.1, (this.currentTime - this.lastTime) / 1000);
        this.lastTime = this.currentTime;
        
        // Clear canvas
        Renderer.clear(GameConfig.COLORS.BACKGROUND);
        
        // Draw background stars
        this.updateAndDrawStars(this.dt);
        
        // Apply screen shake
        const hasShake = Renderer.applyScreenShake(this.screenShake);
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - this.dt * 60);
        }
        
        // State machine
        switch (GameState.current) {
            case GameConfig.STATE.SPLASH:
                this.updateSplash(this.dt);
                this.drawSplash();
                break;
                
            case GameConfig.STATE.PLAYING:
                this.updateGameplay(this.dt);
                this.drawGameplay();
                break;
                
            case GameConfig.STATE.PAUSED:
                this.drawGameplay();
                this.drawPauseScreen();
                break;
                
            case GameConfig.STATE.GAME_OVER:
                this.drawGameOver();
                break;
                
            case GameConfig.STATE.ENTER_HIGH_SCORE:
                this.drawEnterHighScore();
                break;
        }
        
        // Reset transforms
        if (hasShake) {
            Renderer.resetTransform();
        }
        
        // Performance tracking
        GraphicsOptimizer.frameRendered();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    },
    
    // Update splash screen
    updateSplash(dt) {
        // Just wait for input
    },
    
    // Update gameplay
    updateGameplay(dt) {
        // Update difficulty
        this.updateDifficulty();
        
        // Update game statistics
        GameState.updateStats(dt);
        
        // Update player
        this.updatePlayer(dt);
        
        // Update enemies
        if (GameState.enemies.length === 0) {
            EnemyManager.spawnWave(GameState.level, GameState);
        }
        EnemyManager.update(dt, GameState);
        
        // Update powerups
        PowerupManager.update(dt, GameState);
        PowerupManager.updateTimers(dt, GameState);
        
        // Update bullets
        this.updateBullets(dt);
        
        // Update enemy bullets
        this.updateEnemyBullets(dt);
        
        // Update particles
        this.updateParticles(dt);
        
        // Check collisions
        this.checkCollisions();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake -= dt * 60;
        }
        
        // Check for level complete
        if (GameState.enemies.length === 0 && GameState.levelTransition === 0) {
            this.completeLevel();
        }
        
        // Handle level transition
        if (GameState.levelTransition > 0) {
            GameState.levelTransition -= dt;
            if (GameState.levelTransition <= 0) {
                GameState.level++;
                this.updateDifficulty();
                AudioEngine.levelComplete();
            }
        }
    },
    
    // Update player
    updatePlayer(dt) {
        const player = GameState.player;
        
        // Movement
        if (InputManager.isLeft()) {
            player.x -= GameConfig.PLAYER.SPEED * dt;
        }
        if (InputManager.isRight()) {
            player.x += GameConfig.PLAYER.SPEED * dt;
        }
        
        // Clamp to screen
        player.x = Math.max(GameConfig.PLAYER.WIDTH / 2, 
                           Math.min(GameConfig.CANVAS_WIDTH - GameConfig.PLAYER.WIDTH / 2, player.x));
        
        // Shooting
        player.cooldown -= dt;
        if (InputManager.isFire() && player.cooldown <= 0) {
            this.playerShoot();
            
            const cooldownTime = player.power === 'rapid' ? 0.1 : 0.3;
            player.cooldown = cooldownTime;
        }
    },
    
    // Player shoot
    playerShoot() {
        const player = GameState.player;
        
        AudioEngine.playerShoot();
        GameState.stats.shotsFired++;
        
        if (player.power === 'double') {
            // Double shot
            GameState.bullets.push({
                x: player.x - 8,
                y: player.y - 10,
                w: 3,
                h: 8,
                speed: GameConfig.PLAYER.BULLET_SPEED,
                from: 'player'
            });
            GameState.bullets.push({
                x: player.x + 8,
                y: player.y - 10,
                w: 3,
                h: 8,
                speed: GameConfig.PLAYER.BULLET_SPEED,
                from: 'player'
            });
        } else {
            // Single shot
            GameState.bullets.push({
                x: player.x,
                y: player.y - 10,
                w: 3,
                h: 8,
                speed: GameConfig.PLAYER.BULLET_SPEED,
                from: 'player'
            });
        }
    },
    
    // Update bullets
    updateBullets(dt) {
        for (let i = GameState.bullets.length - 1; i >= 0; i--) {
            const bullet = GameState.bullets[i];
            bullet.y -= bullet.speed * dt;
            
            if (bullet.y < -10) {
                GameState.bullets.splice(i, 1);
            }
        }
    },
    
    // Update enemy bullets
    updateEnemyBullets(dt) {
        for (let i = GameState.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = GameState.enemyBullets[i];
            bullet.y += bullet.speed * dt;
            
            if (bullet.y > GameConfig.CANVAS_HEIGHT + 10) {
                GameState.enemyBullets.splice(i, 1);
            }
        }
    },
    
    // Update particles
    updateParticles(dt) {
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const particle = GameState.particles[i];
            
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt;
            
            if (particle.life <= 0) {
                GameState.particles.splice(i, 1);
            }
        }
    },
    
    // Check all collisions
    checkCollisions() {
        CollisionSystem.checkAll(GameState, {
            onBulletBulletHit: (bulletIdx, enemyBulletIdx, bullet, enemyBullet) => {
                GameState.bullets.splice(bulletIdx, 1);
                GameState.enemyBullets.splice(enemyBulletIdx, 1);
                AudioEngine.bulletHit();
                this.createHitEffect(enemyBullet.x, enemyBullet.y);
                GameState.score += 10;
            },
            
            onBulletEnemyHit: (bulletIdx, enemyIdx, bullet, enemy, destroyed) => {
                GameState.bullets.splice(bulletIdx, 1);
                enemy.hp--;
                GameState.stats.shotsHit++;
                
                if (destroyed) {
                    GameState.score += enemy.score;
                    GameState.stats.enemiesDestroyed++;
                    AudioEngine.explosion();
                    
                    if (enemy.formationSpot) {
                        enemy.formationSpot.taken = false;
                    }
                    
                    GameState.enemies.splice(enemyIdx, 1);
                    this.createExplosion(enemy.x, enemy.y);
                    this.screenShake = 5;
                    
                    // Chance to drop powerup
                    if (Math.random() < 0.1) {
                        const type = PowerupManager.types[Math.floor(Math.random() * PowerupManager.types.length)];
                        PowerupManager.spawn(type, enemy.x, enemy.y, GameState);
                    }
                } else {
                    AudioEngine.hit();
                    this.createHitEffect(enemy.x, enemy.y);
                }
            },
            
            onBulletPlayerHit: (bulletIdx, bullet) => {
                if (GameState.player.shield) {
                    GameState.enemyBullets.splice(bulletIdx, 1);
                    this.createHitEffect(bullet.x, bullet.y);
                    AudioEngine.shieldHit();
                } else {
                    GameState.enemyBullets.splice(bulletIdx, 1);
                    GameState.lives--;
                    
                    if (GameState.lives <= 0) {
                        GameState.player.alive = false;
                        GameState.setState(GameConfig.STATE.GAME_OVER);
                        AudioEngine.playerDeath();
                        
                        // Check for high score
                        this.checkHighScore();
                    }
                    
                    this.createExplosion(GameState.player.x, GameState.player.y);
                    this.screenShake = 10;
                }
            },
            
            onEnemyPlayerHit: (enemy) => {
                GameState.lives--;
                
                if (GameState.lives <= 0) {
                    GameState.player.alive = false;
                    GameState.setState(GameConfig.STATE.GAME_OVER);
                    AudioEngine.playerDeath();
                    this.checkHighScore();
                }
                
                this.createExplosion(GameState.player.x, GameState.player.y);
                this.screenShake = 10;
            },
            
            onPowerupCollected: (powerupIdx, powerup) => {
                PowerupManager.apply(powerup, GameState);
                GameState.powerups.splice(powerupIdx, 1);
            }
        });
    },
    
    // Create hit effect
    createHitEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            GameState.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.3,
                maxLife: 0.3,
                size: 2,
                color: GameConfig.COLORS.PARTICLE_HIT
            });
        }
    },
    
    // Create explosion
    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 100 + Math.random() * 100;
            
            GameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                size: 2 + Math.random() * 2,
                color: Math.random() < 0.5 ? GameConfig.COLORS.PARTICLE_EXPLOSION_1 : GameConfig.COLORS.PARTICLE_EXPLOSION_2
            });
        }
    },
    
    // Complete level
    completeLevel() {
        GameState.levelTransition = 2;
    },
    
    // Update difficulty
    updateDifficulty() {
        const config = GameState.waveConfig;
        const level = GameState.level;
        
        // Apply difficulty scaling
        config.baseAttackChance = GameConfig.DIFFICULTY.BASE_ATTACK_CHANCE * (1 + (level - 1) * 0.05);
        config.groupAttackChance = GameConfig.DIFFICULTY.GROUP_ATTACK_CHANCE * (1 + (level - 1) * 0.03);
        config.maxAttackers = Math.min(4 + Math.floor((level - 1) / 2), 8);
        config.formationShootChance = GameConfig.DIFFICULTY.FORMATION_SHOOT_CHANCE * (1 + (level - 1) * 0.02);
        config.attackingShootChance = GameConfig.DIFFICULTY.ATTACKING_SHOOT_CHANCE * (1 + (level - 1) * 0.02);
        config.bulletSpeed = GameConfig.DIFFICULTY.BULLET_SPEED * (1 + (level - 1) * 0.05);
    },
    
    // Check for high score
    async checkHighScore() {
        const scores = await FirebaseService.fetchHighScores();
        
        if (scores.length < FirebaseService.MAX_HIGH_SCORES || 
            GameState.score > scores[scores.length - 1].score) {
            GameState.setState(GameConfig.STATE.ENTER_HIGH_SCORE);
        }
    },
    
    // Fetch high scores
    async fetchHighScores() {
        try {
            const scores = await FirebaseService.fetchHighScores();
            GameState.highScores = scores;
            console.log(`📊 Loaded ${scores.length} high scores`);
        } catch (error) {
            console.error('Error fetching high scores:', error);
        }
    },
    
    // Handle key press
    handleKeyPress(keyCode) {
        const state = GameState.current;
        
        switch (state) {
            case GameConfig.STATE.SPLASH:
                if (keyCode === 'Space' || keyCode === 'Enter') {
                    AudioEngine.menuSelect();
                    GameState.setState(GameConfig.STATE.PLAYING);
                    GameState.reset();
                }
                break;
                
            case GameConfig.STATE.GAME_OVER:
                if (keyCode === 'Space' || keyCode === 'Enter') {
                    AudioEngine.menuSelect();
                    GameState.setState(GameConfig.STATE.SPLASH);
                    this.fetchHighScores();
                }
                break;
                
            case GameConfig.STATE.PLAYING:
                if (keyCode === 'KeyP') {
                    GameState.setState(GameConfig.STATE.PAUSED);
                }
                break;
                
            case GameConfig.STATE.PAUSED:
                if (keyCode === 'KeyP') {
                    GameState.setState(GameConfig.STATE.PLAYING);
                    this.lastTime = performance.now();
                }
                break;
        }
    },
    
    // Initialize stars
    initStars() {
        this.stars = [];
        this.starLayers = [];
        
        for (let layer = 0; layer < 3; layer++) {
            const layerStars = [];
            const count = layer === 0 ? 50 : 25;
            const speedFactor = layer === 0 ? 1 : (layer === 1 ? 1.5 : 2.5);
            
            for (let i = 0; i < count; i++) {
                layerStars.push({
                    x: Math.random() * GameConfig.CANVAS_WIDTH,
                    y: Math.random() * GameConfig.CANVAS_HEIGHT,
                    size: layer === 0 ? 1 : (layer === 1 ? 1.5 : 2),
                    speed: (Math.random() * 15 + 15) * speedFactor,
                    brightness: layer === 0 ? 0.3 : (layer === 1 ? 0.5 : 0.8)
                });
            }
            
            this.starLayers.push(layerStars);
        }
    },
    
    // Update and draw stars
    updateAndDrawStars(dt) {
        const ctx = Renderer.ctx;
        
        this.starLayers.forEach(layer => {
            layer.forEach(star => {
                star.y += star.speed * dt;
                if (star.y > GameConfig.CANVAS_HEIGHT) {
                    star.y = -5;
                    star.x = Math.random() * GameConfig.CANVAS_WIDTH;
                }
                
                ctx.globalAlpha = star.brightness;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(star.x, star.y, star.size, star.size);
            });
        });
        
        ctx.globalAlpha = 1;
    },
    
    // Draw splash screen
    drawSplash() {
        const ctx = Renderer.ctx;
        
        Renderer.drawText('GALAGA', GameConfig.CANVAS_WIDTH / 2, 150, {
            font: '48px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center',
            shadow: true
        });
        
        Renderer.drawText('PRESS SPACE TO START', GameConfig.CANVAS_WIDTH / 2, 350, {
            font: '16px monospace',
            color: GameConfig.COLORS.TEXT_DIM,
            align: 'center'
        });
        
        // Draw high scores
        Renderer.drawText('HIGH SCORES', GameConfig.CANVAS_WIDTH / 2, 450, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center'
        });
        
        GameState.highScores.slice(0, 5).forEach((entry, i) => {
            const y = 480 + i * 20;
            Renderer.drawText(`${i + 1}. ${entry.name} ${entry.score}`, 
                GameConfig.CANVAS_WIDTH / 2, y, {
                font: '12px monospace',
                color: GameConfig.COLORS.TEXT_DIM,
                align: 'center'
            });
        });
    },
    
    // Draw gameplay
    drawGameplay() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Draw enemies
        EnemyManager.draw(ctx, GameState, time);
        
        // Draw player bullets
        ctx.fillStyle = GameConfig.COLORS.BULLET_PLAYER;
        GameState.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x - 1, bullet.y - 4, 2, 8);
        });
        
        // Draw enemy bullets
        ctx.fillStyle = GameConfig.COLORS.BULLET_ENEMY;
        GameState.enemyBullets.forEach(bullet => {
            ctx.fillRect(bullet.x - 2, bullet.y - 3, 4, 6);
        });
        
        // Draw powerups
        PowerupManager.draw(ctx, GameState, time);
        
        // Draw particles (batched for performance)
        GraphicsOptimizer.batchRenderParticles(ctx, GameState.particles);
        
        // Draw player
        this.drawPlayer(ctx);
        
        // Draw HUD
        this.drawHUD(ctx);
        
        // Draw powerup indicator
        PowerupManager.drawIndicator(ctx, GameState);
        
        // Draw touch controls
        if (InputManager.shouldShowTouchControls()) {
            this.drawTouchControls(ctx);
        }
    },
    
    // Draw player
    drawPlayer(ctx) {
        const player = GameState.player;
        
        if (!player.alive) return;
        
        // Shield effect
        if (player.shield) {
            ctx.save();
            ctx.strokeStyle = GameConfig.COLORS.SHIELD;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(this.currentTime / 100) * 0.3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, GameConfig.PLAYER.WIDTH / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Player ship
        ctx.save();
        ctx.translate(player.x, player.y);
        
        ctx.fillStyle = GameConfig.COLORS.PLAYER;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, 15);
        ctx.lineTo(10, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = GameConfig.COLORS.PLAYER_ACCENT;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-5, 10);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw HUD
    drawHUD(ctx) {
        // Score
        Renderer.drawText(`SCORE: ${GameState.score}`, 10, 10, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT
        });
        
        // Level
        Renderer.drawText(`LEVEL: ${GameState.level}`, 10, 30, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT
        });
        
        // Lives
        Renderer.drawText(`LIVES: ${GameState.lives}`, 10, 50, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT
        });
    },
    
    // Draw touch controls
    drawTouchControls(ctx) {
        const buttons = InputManager.touchControls.buttons;
        
        Object.values(buttons).forEach(button => {
            ctx.strokeStyle = button.pressed ? '#00ff00' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.strokeRect(button.x, button.y, button.w, button.h);
            ctx.globalAlpha = 1;
        });
    },
    
    // Draw pause screen
    drawPauseScreen() {
        Renderer.drawText('PAUSED', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2, {
            font: '32px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center',
            shadow: true
        });
        
        Renderer.drawText('PRESS P TO RESUME', GameConfig.CANVAS_WIDTH / 2, 
            GameConfig.CANVAS_HEIGHT / 2 + 40, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT_DIM,
            align: 'center'
        });
    },
    
    // Draw game over
    drawGameOver() {
        Renderer.drawText('GAME OVER', GameConfig.CANVAS_WIDTH / 2, 250, {
            font: '32px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center',
            shadow: true
        });
        
        Renderer.drawText(`FINAL SCORE: ${GameState.score}`, GameConfig.CANVAS_WIDTH / 2, 320, {
            font: '18px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center'
        });
        
        Renderer.drawText('PRESS SPACE TO CONTINUE', GameConfig.CANVAS_WIDTH / 2, 380, {
            font: '14px monospace',
            color: GameConfig.COLORS.TEXT_DIM,
            align: 'center'
        });
    },
    
    // Draw enter high score
    drawEnterHighScore() {
        Renderer.drawText('NEW HIGH SCORE!', GameConfig.CANVAS_WIDTH / 2, 250, {
            font: '24px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center',
            shadow: true
        });
        
        Renderer.drawText('Enter your name:', GameConfig.CANVAS_WIDTH / 2, 300, {
            font: '16px monospace',
            color: GameConfig.COLORS.TEXT,
            align: 'center'
        });
    }
};

// Start the game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GalagaGame.init());
} else {
    GalagaGame.init();
}
