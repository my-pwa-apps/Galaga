// ============================================
// GALAGA - MAIN GAME LOOP
// Coordinates all modules and game logic
// ============================================

// Debug logging utility
const debugLog = (...args) => {
    if (GameConfig.DEBUG_MODE) {
        console.log(...args);
    }
};

// Game instance
const GalagaGame = {
    // Timing
    lastTime: 0,
    dt: 0,
    currentTime: 0,
    monitorLogTimer: 0,
    lastMonitorLevel: null,
    lastMonitorEnemyCount: null,
    lastMonitorWaveNumber: null,
    lastMonitorSpawningFlag: null,
    
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
    this.resetMonitorDebug();
        
        console.log('✅ Game initialized successfully!');
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    },

    resetMonitorDebug() {
        this.monitorLogTimer = 0;
        this.lastMonitorLevel = null;
        this.lastMonitorEnemyCount = null;
        this.lastMonitorWaveNumber = null;
        this.lastMonitorSpawningFlag = null;
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
        
        // Check for level complete (all enemies destroyed)
        // Conditions:
        //  - No enemies left
        //  - Not already transitioning
        //  - At least one wave spawned (waveNumber > 0)
        //  - Not in the middle of timed spawning phase (spawningWave === false)
        
        // Continuous monitoring when enemies are low OR in level 2+
    const shouldMonitor = (GameState.enemies.length <= 3 || GameState.level >= 2) && GameState.levelTransition <= 0;
        if (shouldMonitor) {
            this.monitorLogTimer += dt;
            const stateChanged = GameState.level !== this.lastMonitorLevel ||
                GameState.enemies.length !== this.lastMonitorEnemyCount ||
                EnemyManager.waveNumber !== this.lastMonitorWaveNumber ||
                EnemyManager.spawningWave !== this.lastMonitorSpawningFlag;
            if (stateChanged || this.monitorLogTimer >= 1) {
                debugLog('[MONITOR] Level:', GameState.level, 'Enemies:', GameState.enemies.length, 'Wave#:', EnemyManager.waveNumber, 'Spawning:', EnemyManager.spawningWave);
                if (GameConfig.DEBUG_MODE) {
                    GameState.enemies.forEach((e, i) => {
                        debugLog(`  Enemy ${i}: state=${e.state}, x=${Math.round(e.x)}, y=${Math.round(e.y)}, type=${e.type}`);
                    });
                }
                this.monitorLogTimer = 0;
                this.lastMonitorLevel = GameState.level;
                this.lastMonitorEnemyCount = GameState.enemies.length;
                this.lastMonitorWaveNumber = EnemyManager.waveNumber;
                this.lastMonitorSpawningFlag = EnemyManager.spawningWave;
            }
        } else {
            this.monitorLogTimer = 0;
            this.lastMonitorLevel = null;
            this.lastMonitorEnemyCount = null;
            this.lastMonitorWaveNumber = null;
            this.lastMonitorSpawningFlag = null;
        }
        
        if (GameState.enemies.length === 0 &&
            GameState.levelTransition === 0 &&
            EnemyManager.waveNumber > 0 &&
            !EnemyManager.spawningWave) {
            console.log('🎉 Level complete! Level:', GameState.level, 'Enemy count:', GameState.enemies.length, 'Wave:', EnemyManager.waveNumber, 'spawningWave:', EnemyManager.spawningWave);
            this.completeLevel();
        } else if (GameState.enemies.length === 0 && GameState.levelTransition === 0) {
            // Debug why level isn't completing
            console.log('[DEBUG] Level not completing - waveNumber:', EnemyManager.waveNumber, 'spawningWave:', EnemyManager.spawningWave, 'enemies:', GameState.enemies.length);
        }
        
        // Handle level transition
        if (GameState.levelTransition > 0) {
            GameState.levelTransition -= dt;
            if (GameState.levelTransition <= 0) {
                GameState.levelTransition = 0;
                GameState.level++;
                console.log('⬆️ Level transition complete! Now starting level', GameState.level);
                this.updateDifficulty();
                EnemyManager.spawnWave(GameState.level, GameState);
                AudioEngine.levelComplete();
            }
        }
    },
    
    // Update player
    updatePlayer(dt) {
        const player = GameState.player;
        
        // Update invulnerability timer
        if (player.invulnerable) {
            player.invulnerabilityTimer -= dt;
            if (player.invulnerabilityTimer <= 0) {
                player.invulnerable = false;
                player.invulnerabilityTimer = 0;
                console.log('✅ Invulnerability ended');
            }
        }
        
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
        
        // Shooting - autofire on mobile, manual on desktop
        player.cooldown -= dt;
        const shouldShoot = InputManager.isTouchDevice ? 
            (player.cooldown <= 0) : // Mobile: autofire
            (InputManager.isFire() && player.cooldown <= 0); // Desktop: manual
            
        if (shouldShoot) {
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
                        EnemyManager.reset(); // cancel pending spawns on player death
                        AudioEngine.playerDeath();
                        
                        // Check for high score
                        this.checkHighScore();
                    }
                    
                    this.createExplosion(GameState.player.x, GameState.player.y);
                    this.screenShake = 10;
                }
            },
            
            onEnemyPlayerHit: (enemyIdx, enemy) => {
                // Only process hit if player isn't already invulnerable
                if (GameState.player.invulnerable) return;
                
                // Remove the enemy that hit the player
                if (enemy.formationSpot) {
                    enemy.formationSpot.taken = false;
                }
                GameState.enemies.splice(enemyIdx, 1);
                
                // Player takes damage
                GameState.lives--;
                AudioEngine.hit();
                
                if (GameState.lives <= 0) {
                    GameState.player.alive = false;
                    GameState.setState(GameConfig.STATE.GAME_OVER);
                    EnemyManager.reset(); // cancel pending spawns on player death
                    AudioEngine.playerDeath();
                    this.checkHighScore();
                } else {
                    // Grant temporary invulnerability
                    GameState.player.invulnerable = true;
                    GameState.player.invulnerabilityTimer = 2.0; // 2 seconds immunity
                    console.log(`💔 Hit! Lives remaining: ${GameState.lives}`);
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
        console.log('🏁 Starting level transition. Current level:', GameState.level);
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
                    this.resetMonitorDebug();
                    EnemyManager.reset(); // clear wave timers & waveNumber before starting
                    EnemyManager.spawnWave(GameState.level, GameState);
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
                
            case GameConfig.STATE.ENTER_HIGH_SCORE:
                // Navigate between initials
                if (keyCode === 'ArrowLeft') {
                    GameState.initialIndex = Math.max(0, GameState.initialIndex - 1);
                } else if (keyCode === 'ArrowRight') {
                    GameState.initialIndex = Math.min(2, GameState.initialIndex + 1);
                }
                // Change letter up/down
                else if (keyCode === 'ArrowUp') {
                    const currentChar = GameState.playerInitials[GameState.initialIndex];
                    const charCode = currentChar.charCodeAt(0);
                    const newChar = charCode === 90 ? 'A' : String.fromCharCode(charCode + 1);
                    GameState.playerInitials[GameState.initialIndex] = newChar;
                } else if (keyCode === 'ArrowDown') {
                    const currentChar = GameState.playerInitials[GameState.initialIndex];
                    const charCode = currentChar.charCodeAt(0);
                    const newChar = charCode === 65 ? 'Z' : String.fromCharCode(charCode - 1);
                    GameState.playerInitials[GameState.initialIndex] = newChar;
                }
                // Submit high score
                else if (keyCode === 'Enter' || keyCode === 'Space') {
                    const name = GameState.playerInitials.join('');
                    FirebaseService.submitHighScore(name, GameState.score, GameState.level, GameState.stats);
                    AudioEngine.menuSelect();
                    GameState.setState(GameConfig.STATE.SPLASH);
                    this.fetchHighScores();
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
        
        // Lightspeed effect during level transition
        const isTransitioning = GameState.levelTransition > 0;
        const transitionProgress = isTransitioning ? (2 - GameState.levelTransition) / 2 : 0;
        const speedMultiplier = isTransitioning ? 1 + (transitionProgress * 20) : 1;
        const stretchFactor = isTransitioning ? 1 + (transitionProgress * 30) : 1;
        
        this.starLayers.forEach(layer => {
            layer.forEach(star => {
                star.y += star.speed * dt * speedMultiplier;
                if (star.y > GameConfig.CANVAS_HEIGHT) {
                    star.y = -5;
                    star.x = Math.random() * GameConfig.CANVAS_WIDTH;
                }
                
                ctx.globalAlpha = star.brightness;
                ctx.fillStyle = '#ffffff';
                
                // Draw stretched star lines during transition (lightspeed effect)
                if (isTransitioning && stretchFactor > 1) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(star.x, star.y - star.size * stretchFactor);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = star.size;
                    ctx.stroke();
                    ctx.restore();
                } else {
                    // Normal star dots
                    ctx.fillRect(star.x, star.y, star.size, star.size);
                }
            });
        });
        
        ctx.globalAlpha = 1;
    },
    
    // Draw splash screen
    drawSplash() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Title with glowing effect
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GALAGA', GameConfig.CANVAS_WIDTH / 2, 120);
        
        // Inner title
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GALAGA', GameConfig.CANVAS_WIDTH / 2, 120);
        ctx.restore();
        
        // Animated subtitle with rainbow effect
        const hue = (time * 50) % 360;
        ctx.save();
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillText('◄ RETRO SPACE SHOOTER ►', GameConfig.CANVAS_WIDTH / 2, 170);
        ctx.restore();
        
        // Draw some sample aliens flying by
        const alienY = 250;
        AlienSprites.draw(ctx, 'skulker', 90, alienY + Math.sin(time * 2) * 5, time, 1.2, false);
        AlienSprites.draw(ctx, 'butterfly', 180, alienY + Math.sin(time * 2 + 1) * 5, time, 1.2, false);
        AlienSprites.draw(ctx, 'octopus', 270, alienY + Math.sin(time * 2 + 2) * 5, time, 1.2, false);
        AlienSprites.draw(ctx, 'parasite', 360, alienY + Math.sin(time * 2 + 3) * 5, time, 1.2, false);
        
        // Pulsing start message
        const pulse = 0.7 + Math.sin(time * 4) * 0.3;
        const startText = InputManager.isTouchDevice ? '▶ TAP TO START ◀' : '▶ PRESS SPACE ◀';
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        Renderer.drawText(startText, GameConfig.CANVAS_WIDTH / 2, 360, {
            font: 'bold 18px monospace',
            color: '#ffff00',
            align: 'center'
        });
        ctx.restore();
        
        // Decorative line
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 410);
        ctx.lineTo(400, 410);
        ctx.stroke();
        
        // Draw high scores with better styling
        Renderer.drawText('═══ HIGH SCORES ═══', GameConfig.CANVAS_WIDTH / 2, 430, {
            font: 'bold 14px monospace',
            color: '#00ffff',
            align: 'center'
        });
        
        GameState.highScores.slice(0, 5).forEach((entry, i) => {
            const y = 460 + i * 22;
            const isTopScore = i === 0;
            
            // Rank medal
            const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
            ctx.font = '13px monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = isTopScore ? '#ffff00' : GameConfig.COLORS.TEXT_DIM;
            ctx.fillText(medals[i], 100, y);
            
            // Name
            ctx.textAlign = 'center';
            ctx.fillStyle = isTopScore ? '#ffaa00' : GameConfig.COLORS.TEXT;
            ctx.fillText(entry.name, GameConfig.CANVAS_WIDTH / 2 - 40, y);
            
            // Score with formatting
            ctx.textAlign = 'right';
            ctx.fillStyle = isTopScore ? '#00ff00' : GameConfig.COLORS.TEXT_DIM;
            ctx.fillText(entry.score.toLocaleString(), 380, y);
        });
    },
    
    // Draw gameplay
    drawGameplay() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Draw enemies
        EnemyManager.draw(ctx, GameState, time);
        
        // Draw player bullets with glow
        GameState.bullets.forEach(bullet => {
            ctx.save();
            // Glow effect
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(bullet.x - 1.5, bullet.y - 5, 3, 10);
            
            // Bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bullet.x - 0.5, bullet.y - 4, 1, 8);
            ctx.restore();
        });
        
        // Draw enemy bullets with glow
        GameState.enemyBullets.forEach(bullet => {
            ctx.save();
            // Glow effect
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(bullet.x - 2, bullet.y - 3, 4, 6);
            
            // Bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffaacc';
            ctx.fillRect(bullet.x - 1, bullet.y - 2, 2, 4);
            ctx.restore();
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
        
        // Invulnerability flashing effect
        if (player.invulnerable) {
            const flash = Math.sin(this.currentTime * 0.02) > 0;
            if (!flash) return; // Skip rendering to create flashing effect
        }
        
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
        
        // Player ship - Hunter-style sleek fighter
        ctx.save();
        ctx.translate(player.x, player.y);
        
        const pulse = Math.sin(this.currentTime * 0.025) * 0.15 + 0.85;
        
        // Engine thrust (behind ship)
        if (player.alive) {
            const thrustPulse = 0.7 + Math.sin(this.currentTime * 0.04) * 0.3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(0, 200, 255, ${thrustPulse * 0.6})`;
            ctx.fillRect(-6, 12, 12, 3);
            ctx.fillStyle = `rgba(100, 200, 255, ${thrustPulse * 0.4})`;
            ctx.fillRect(-4, 15, 8, 2);
        }
        
        // Sleek metallic body - angular Hunter design
        const bodyGradient = ctx.createLinearGradient(0, -12, 0, 12);
        bodyGradient.addColorStop(0, '#33eeff');
        bodyGradient.addColorStop(0.5, '#00aacc');
        bodyGradient.addColorStop(1, '#006688');
        ctx.fillStyle = bodyGradient;
        
        // Main angular chassis
        ctx.beginPath();
        ctx.moveTo(0, -12);      // Sharp nose
        ctx.lineTo(-10, -2);     // Left wing
        ctx.lineTo(-10, 8);      // Left side
        ctx.lineTo(0, 12);       // Bottom center
        ctx.lineTo(10, 8);       // Right side
        ctx.lineTo(10, -2);      // Right wing
        ctx.closePath();
        ctx.fill();
        
        // Metallic highlights (racing stripes)
        ctx.strokeStyle = '#66ffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-7, -2);
        ctx.lineTo(-7, 6);
        ctx.moveTo(7, -2);
        ctx.lineTo(7, 6);
        ctx.stroke();
        
        // Cockpit window - glowing cyan
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#66ffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit center
        ctx.fillStyle = '#0088aa';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Weapon pods on sides
        ctx.fillStyle = '#004466';
        ctx.fillRect(-12, 2, 3, 6);
        ctx.fillRect(9, 2, 3, 6);
        
        // Glowing weapon tips
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 6 * pulse;
        ctx.fillStyle = `rgba(255, 200, 0, ${pulse})`;
        ctx.fillRect(-12, 8, 3, 2);
        ctx.fillRect(9, 8, 3, 2);
        ctx.shadowBlur = 0;
        
        // Tech vents
        ctx.fillStyle = '#003344';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-2 + i * 2, 4, 1, 4);
        }
        
        // Energy core glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.7})`;
        ctx.beginPath();
        ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Angular outline for definition
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#001122';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-10, -2);
        ctx.lineTo(-10, 8);
        ctx.lineTo(0, 12);
        ctx.lineTo(10, 8);
        ctx.lineTo(10, -2);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    },
    
    // Draw HUD
    drawHUD(ctx) {
        // Single line HUD at top
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        
        // Score (left)
        Renderer.drawText(`${GameState.score.toLocaleString()}`, 10, 20, {
            font: 'bold 14px monospace',
            color: '#ffff00'
        });
        
        // Level (center)
        Renderer.drawText(`LV ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 20, {
            font: 'bold 14px monospace',
            color: '#00ff88',
            align: 'center'
        });
        
        // Lives (right) - heart icon with number
        Renderer.drawText(`♥ ${GameState.lives}`, GameConfig.CANVAS_WIDTH - 10, 20, {
            font: 'bold 14px monospace',
            color: '#ff0066',
            align: 'right'
        });
        ctx.restore();
    },
    
    // Draw touch controls
    drawTouchControls(ctx) {
        const buttons = InputManager.touchControls.buttons;
        
        ctx.save();
        
        // Left button
        if (buttons.left) {
            ctx.fillStyle = buttons.left.pressed ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = buttons.left.pressed ? '#00ff00' : '#ffffff';
            ctx.lineWidth = 3;
            ctx.fillRect(buttons.left.x, buttons.left.y, buttons.left.w, buttons.left.h);
            ctx.strokeRect(buttons.left.x, buttons.left.y, buttons.left.w, buttons.left.h);
            
            // Left arrow
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('◄', buttons.left.x + buttons.left.w / 2, buttons.left.y + buttons.left.h / 2);
        }
        
        // Right button
        if (buttons.right) {
            ctx.fillStyle = buttons.right.pressed ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = buttons.right.pressed ? '#00ff00' : '#ffffff';
            ctx.lineWidth = 3;
            ctx.fillRect(buttons.right.x, buttons.right.y, buttons.right.w, buttons.right.h);
            ctx.strokeRect(buttons.right.x, buttons.right.y, buttons.right.w, buttons.right.h);
            
            // Right arrow
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('►', buttons.right.x + buttons.right.w / 2, buttons.right.y + buttons.right.h / 2);
        }
        
        ctx.restore();
    },
    
    // Draw pause screen
    drawPauseScreen() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        // Animated border
        const borderPulse = 0.5 + Math.sin(time * 3) * 0.5;
        ctx.strokeStyle = `rgba(0, 255, 255, ${borderPulse})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(100, 250, 280, 120);
        
        // Title with glow
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        Renderer.drawText('║║ PAUSED ║║', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 20, {
            font: 'bold 36px monospace',
            color: '#00ffff',
            align: 'center'
        });
        ctx.restore();
        
        // Instructions
        const instructionPulse = 0.6 + Math.sin(time * 4) * 0.4;
        ctx.save();
        ctx.globalAlpha = instructionPulse;
        Renderer.drawText('PRESS P TO RESUME', GameConfig.CANVAS_WIDTH / 2, 
            GameConfig.CANVAS_HEIGHT / 2 + 30, {
            font: '16px monospace',
            color: '#ffff00',
            align: 'center'
        });
        ctx.restore();
    },
    
    // Draw game over
    drawGameOver() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Dramatic fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        // Red warning lines
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 200);
        ctx.lineTo(GameConfig.CANVAS_WIDTH, 200);
        ctx.moveTo(0, 420);
        ctx.lineTo(GameConfig.CANVAS_WIDTH, 420);
        ctx.stroke();
        
        // Game Over title with dramatic effect
        ctx.save();
        const textPulse = 0.8 + Math.sin(time * 5) * 0.2;
        ctx.globalAlpha = textPulse;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        Renderer.drawText('GAME OVER', GameConfig.CANVAS_WIDTH / 2, 230, {
            font: 'bold 48px monospace',
            color: '#ff0000',
            align: 'center'
        });
        ctx.restore();
        
        // Stats panel
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.fillRect(90, 290, 300, 80);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(90, 290, 300, 80);
        
        // Final score with formatting
        ctx.save();
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        Renderer.drawText('FINAL SCORE', GameConfig.CANVAS_WIDTH / 2, 305, {
            font: 'bold 14px monospace',
            color: '#00ffff',
            align: 'center'
        });
        Renderer.drawText(`${GameState.score.toLocaleString()}`, GameConfig.CANVAS_WIDTH / 2, 330, {
            font: 'bold 28px monospace',
            color: '#ffff00',
            align: 'center'
        });
        ctx.restore();
        
        // Level reached
        Renderer.drawText(`Level Reached: ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 360, {
            font: '12px monospace',
            color: '#00ff88',
            align: 'center'
        });
        
        // Continue prompt with pulse
        const continuePulse = 0.5 + Math.sin(time * 4) * 0.5;
        const continueText = InputManager.isTouchDevice ? '▶ TAP TO CONTINUE ◀' : '▶ PRESS SPACE ◀';
        ctx.save();
        ctx.globalAlpha = continuePulse;
        Renderer.drawText(continueText, GameConfig.CANVAS_WIDTH / 2, 440, {
            font: 'bold 16px monospace',
            color: '#ffffff',
            align: 'center'
        });
        ctx.restore();
    },
    
    // Draw enter high score
    drawEnterHighScore() {
        const ctx = Renderer.ctx;
        const time = this.currentTime / 1000;
        
        // Background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        // Celebration effect
        const hue = (time * 100) % 360;
        ctx.save();
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 30;
        Renderer.drawText('★ NEW HIGH SCORE! ★', GameConfig.CANVAS_WIDTH / 2, 200, {
            font: 'bold 28px monospace',
            color: `hsl(${hue}, 100%, 60%)`,
            align: 'center'
        });
        ctx.restore();
        
        // Score display
        ctx.save();
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        Renderer.drawText(`${GameState.score.toLocaleString()} POINTS`, GameConfig.CANVAS_WIDTH / 2, 240, {
            font: 'bold 20px monospace',
            color: '#ffff00',
            align: 'center'
        });
        ctx.restore();
        
        // Input panel
        ctx.fillStyle = 'rgba(0, 40, 80, 0.9)';
        ctx.fillRect(80, 280, 320, 100);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(80, 280, 320, 100);
        
        // Instruction
        Renderer.drawText('Enter your initials:', GameConfig.CANVAS_WIDTH / 2, 300, {
            font: '16px monospace',
            color: '#00ffff',
            align: 'center'
        });
        
        // Letter boxes with cursor
        const letters = GameState.playerInitials;
        const boxWidth = 40;
        const boxHeight = 50;
        const spacing = 10;
        const startX = GameConfig.CANVAS_WIDTH / 2 - (3 * boxWidth + 2 * spacing) / 2;
        
        for (let i = 0; i < 3; i++) {
            const x = startX + i * (boxWidth + spacing);
            const y = 320;
            
            // Highlight active box
            if (i === GameState.initialIndex) {
                const pulse = 0.6 + Math.sin(time * 6) * 0.4;
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.3})`;
                ctx.fillRect(x, y, boxWidth, boxHeight);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#004466';
                ctx.lineWidth = 2;
            }
            
            ctx.strokeRect(x, y, boxWidth, boxHeight);
            
            // Letter
            ctx.save();
            if (i === GameState.initialIndex) {
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
            }
            ctx.font = 'bold 32px monospace';
            ctx.fillStyle = i === GameState.initialIndex ? '#ffffff' : '#00aacc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letters[i], x + boxWidth / 2, y + boxHeight / 2);
            ctx.restore();
        }
        
        // Controls hint
        ctx.save();
        ctx.globalAlpha = 0.7;
        Renderer.drawText('↑↓ Change  ←→ Move  ENTER to Submit', GameConfig.CANVAS_WIDTH / 2, 400, {
            font: '12px monospace',
            color: '#aaaaaa',
            align: 'center'
        });
        ctx.restore();
    }
};

// Start the game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GalagaGame.init());
} else {
    GalagaGame.init();
}
