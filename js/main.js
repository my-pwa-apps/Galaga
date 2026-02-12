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
    monitorLogTimer: 0,
    lastMonitorLevel: null,
    lastMonitorEnemyCount: null,
    lastMonitorWaveNumber: null,
    lastMonitorSpawningFlag: null,
    
    // Session
    sessionId: null,
    
    // Screen effects
    screenShake: 0,
    
    // Score popups (floating text for destroyed enemies)
    scorePopups: [],
    
    // Background
    stars: [],
    starLayers: [],
    
    // CRT scanline overlay (pre-rendered)
    scanlineCanvas: null,
    
    // Initialize the game
    init() {
        console.log('Galaga: initializing...');
        
        // Initialize renderer
        Renderer.init('gameCanvas');
        
        // Set up responsive canvas sizing
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });
        
        // Initialize all systems
        AudioEngine.init();
        GraphicsOptimizer.init();
        ObjectPool.init();
        EnemyManager.init();
        FirebaseService.init();
        
        // Initialize input with callbacks
        InputManager.init(Renderer.canvas, {
            onStateChange: (keyCode) => this.handleKeyPress(keyCode)
        });
        
        // Re-measure after touch controls may have appeared
        this.resizeCanvas();
        
        // Generate session ID
        this.sessionId = FirebaseService.generateSessionId();
        
        // Initialize background stars
        this.initStars();
        
        // Pre-render CRT scanline overlay
        this.initScanlines();
        
        // Fetch high scores
        this.fetchHighScores();
        
        // Reset game state
        GameState.reset();
        this.resetMonitorDebug();
        
        console.log('Galaga: ready');
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    },
    
    // Responsive canvas sizing
    resizeCanvas() {
        const canvas = Renderer.canvas;
        const container = document.getElementById('gameContainer');
        const touchControls = document.getElementById('touchControls');
        if (!canvas || !container) return;
        
        const gameW = GameConfig.CANVAS_WIDTH;
        const gameH = GameConfig.CANVAS_HEIGHT;
        const gameAspect = gameW / gameH; // 0.75
        
        // Available space
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Reserve space for touch controls if visible
        const touchHeight = (touchControls && touchControls.classList.contains('visible'))
            ? touchControls.offsetHeight : 0;
        const availH = vh - touchHeight;
        const availW = vw;
        
        // Padding/margins
        const pad = Math.min(16, vw * 0.02);
        const fitW = availW - pad * 2;
        const fitH = availH - pad * 2;
        
        // Scale to fit while maintaining aspect ratio
        let displayW, displayH;
        if (fitW / fitH > gameAspect) {
            // Height-constrained
            displayH = fitH;
            displayW = fitH * gameAspect;
        } else {
            // Width-constrained
            displayW = fitW;
            displayH = fitW / gameAspect;
        }
        
        // Apply CSS size (internal resolution stays 480x640)
        canvas.style.width = Math.floor(displayW) + 'px';
        canvas.style.height = Math.floor(displayH) + 'px';
        
        // Update touch controls max-width to match canvas
        if (touchControls) {
            touchControls.style.maxWidth = Math.floor(displayW) + 'px';
        }
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
        
        // Subtle CRT scanline overlay (pre-rendered for performance)
        if (this.scanlineCanvas) {
            Renderer.ctx.drawImage(this.scanlineCanvas, 0, 0);
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
        
        // Update bullets
        this.updateBullets(dt);
        
        // Update enemy bullets
        this.updateEnemyBullets(dt);
        
        // Update particles
        this.updateParticles(dt);
        
        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y -= 40 * dt; // Float upward
            popup.life -= dt;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Screen shake is already updated in gameLoop()
        
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
            debugLog('🎉 Level complete! Level:', GameState.level, 'Enemy count:', GameState.enemies.length);
            this.completeLevel();
        }
        
        // Handle level transition
        if (GameState.levelTransition > 0) {
            GameState.levelTransition -= dt;
            if (GameState.levelTransition <= 0) {
                GameState.levelTransition = 0;
                GameState.level++;
                debugLog('⬆️ Level transition complete! Now starting level', GameState.level);
                this.updateDifficulty();
                EnemyManager.setupFormation();
                EnemyManager.spawnWave(GameState.level, GameState);
                AudioEngine.levelComplete();
            }
        }
    },
    
    // Update player
    updatePlayer(dt) {
        const player = GameState.player;
        if (!player.alive) return;
        
        // Update invulnerability timer
        if (player.invulnerable) {
            player.invulnerabilityTimer -= dt;
            if (player.invulnerabilityTimer <= 0) {
                player.invulnerable = false;
                player.invulnerabilityTimer = 0;
                debugLog('✅ Invulnerability ended');
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
        
        // Shooting - always manual (touch fire button or keyboard space)
        player.cooldown -= dt;
        if (InputManager.isFire() && player.cooldown <= 0) {
            this.playerShoot();
            player.cooldown = GameConfig.PLAYER.COOLDOWN;
        }
    },
    
    // Player shoot (max 2 bullets on screen - authentic Galaga behavior)
    playerShoot() {
        const player = GameState.player;
        
        // Original Galaga limits player to 2 bullets on screen at once
        const maxBullets = GameConfig.PLAYER.MAX_BULLETS;
        let playerBulletCount = 0;
        for (let i = 0; i < GameState.bullets.length; i++) {
            if (GameState.bullets[i].from === 'player') playerBulletCount++;
        }
        if (playerBulletCount >= maxBullets) return;
        
        AudioEngine.playerShoot();
        GameState.stats.shotsFired++;
        
        GameState.bullets.push({
            x: player.x,
            y: player.y - 10,
            w: 3,
            h: 8,
            speed: GameConfig.PLAYER.BULLET_SPEED,
            from: 'player'
        });
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
                    // Original Galaga: diving enemies are worth more
                    const isDiving = enemy.state === GameConfig.ENEMY_STATE.ATTACK;
                    const score = isDiving ? (enemy.diveScore || enemy.score * 2) : enemy.score;
                    GameState.score += score;
                    GameState.stats.enemiesDestroyed++;
                    AudioEngine.explosion();
                    
                    if (enemy.formationSpot) {
                        enemy.formationSpot.taken = false;
                    }
                    
                    // Remove from attack queue if attacking
                    if (isDiving) {
                        const queueIdx = EnemyManager.attackQueue.indexOf(enemy);
                        if (queueIdx > -1) EnemyManager.attackQueue.splice(queueIdx, 1);
                    }
                    
                    GameState.enemies.splice(enemyIdx, 1);
                    this.createExplosion(enemy.x, enemy.y);
                    this.screenShake = 3;
                    
                    // Floating score popup
                    this.scorePopups.push({
                        x: enemy.x,
                        y: enemy.y,
                        text: `${score}`,
                        life: 1.0,
                        maxLife: 1.0
                    });
                    
                } else {
                    AudioEngine.hit();
                    this.createHitEffect(enemy.x, enemy.y);
                }
            },
            
            onBulletPlayerHit: (bulletIdx, bullet) => {
                if (GameState.player.invulnerable) return;
                
                GameState.enemyBullets.splice(bulletIdx, 1);
                GameState.lives--;
                
                if (GameState.lives <= 0) {
                    GameState.player.alive = false;
                    GameState.setState(GameConfig.STATE.GAME_OVER);
                    EnemyManager.reset();
                    AudioEngine.playerDeath();
                    this.checkHighScore();
                } else {
                    // Brief invulnerability after hit
                    GameState.player.invulnerable = true;
                    GameState.player.invulnerabilityTimer = 1.5;
                }
                
                this.createExplosion(GameState.player.x, GameState.player.y);
                this.screenShake = 10;
            },
            
            onEnemyPlayerHit: (enemyIdx, enemy) => {
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
                    EnemyManager.reset();
                    AudioEngine.playerDeath();
                    this.checkHighScore();
                } else {
                    // Brief invulnerability after hit
                    GameState.player.invulnerable = true;
                    GameState.player.invulnerabilityTimer = 1.5;
                    debugLog(`Hit! Lives remaining: ${GameState.lives}`);
                }
                
                this.createExplosion(GameState.player.x, GameState.player.y);
                this.screenShake = 10;
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
        debugLog('🏁 Starting level transition. Current level:', GameState.level);
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
        
        if (GameState.score > 0 && (
            scores.length < FirebaseService.MAX_HIGH_SCORES || 
            scores.length === 0 ||
            GameState.score > scores[scores.length - 1].score
        )) {
            GameState.setState(GameConfig.STATE.ENTER_HIGH_SCORE);
        }
    },
    
    // Fetch high scores
    async fetchHighScores() {
        try {
            const scores = await FirebaseService.fetchHighScores();
            GameState.highScores = scores;
            debugLog(`Loaded ${scores.length} high scores`);
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
                    this.scorePopups = [];
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
    
    // Pre-render CRT scanline overlay to offscreen canvas
    initScanlines() {
        this.scanlineCanvas = document.createElement('canvas');
        this.scanlineCanvas.width = GameConfig.CANVAS_WIDTH;
        this.scanlineCanvas.height = GameConfig.CANVAS_HEIGHT;
        const sctx = this.scanlineCanvas.getContext('2d');
        sctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        for (let y = 0; y < GameConfig.CANVAS_HEIGHT; y += 3) {
            sctx.fillRect(0, y, GameConfig.CANVAS_WIDTH, 1);
        }
    },
    
    // Update and draw stars (batched by layer for performance)
    updateAndDrawStars(dt) {
        const ctx = Renderer.ctx;
        const canvasW = GameConfig.CANVAS_WIDTH;
        const canvasH = GameConfig.CANVAS_HEIGHT;
        
        // Lightspeed effect during level transition
        const isTransitioning = GameState.levelTransition > 0;
        const transitionProgress = isTransitioning ? (2 - GameState.levelTransition) / 2 : 0;
        const speedMultiplier = isTransitioning ? 1 + (transitionProgress * 20) : 1;
        const stretchFactor = isTransitioning ? 1 + (transitionProgress * 30) : 1;
        const doStretch = isTransitioning && stretchFactor > 1;
        
        ctx.fillStyle = '#ffffff';
        
        for (let l = 0; l < this.starLayers.length; l++) {
            const layer = this.starLayers[l];
            const brightness = layer[0]?.brightness || 0.5;
            ctx.globalAlpha = brightness;
            
            if (doStretch) {
                // Stretched star lines during transition
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                for (let i = 0; i < layer.length; i++) {
                    const star = layer[i];
                    star.y += star.speed * dt * speedMultiplier;
                    if (star.y > canvasH) {
                        star.y = -5;
                        star.x = Math.random() * canvasW;
                    }
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(star.x, star.y - star.size * stretchFactor);
                }
                ctx.lineWidth = layer[0]?.size || 1;
                ctx.stroke();
            } else {
                // Normal star dots — batched fillRect
                for (let i = 0; i < layer.length; i++) {
                    const star = layer[i];
                    star.y += star.speed * dt * speedMultiplier;
                    if (star.y > canvasH) {
                        star.y = -5;
                        star.x = Math.random() * canvasW;
                    }
                    ctx.fillRect(star.x, star.y, star.size, star.size);
                }
            }
        }
        
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
        ctx.font = "bold 40px 'Press Start 2P', monospace";
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
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillText('RETRO SPACE SHOOTER', GameConfig.CANVAS_WIDTH / 2, 170);
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
            font: "bold 14px 'Press Start 2P', monospace",
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
        Renderer.drawText('\u2550\u2550\u2550 HIGH SCORES \u2550\u2550\u2550', GameConfig.CANVAS_WIDTH / 2, 430, {
            font: "11px 'Press Start 2P', monospace",
            color: '#00ffff',
            align: 'center'
        });
        
        GameState.highScores.slice(0, 5).forEach((entry, i) => {
            const y = 460 + i * 22;
            const isTopScore = i === 0;
            
            // Rank
            const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];
            ctx.font = "9px 'Press Start 2P', monospace";
            ctx.textAlign = 'left';
            ctx.fillStyle = isTopScore ? '#ffff00' : GameConfig.COLORS.TEXT_DIM;
            ctx.fillText(ranks[i], 100, y);
            
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
        
        // Draw player bullets with glow (batched)
        ctx.save();
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < GameState.bullets.length; i++) {
            const bullet = GameState.bullets[i];
            ctx.fillRect(bullet.x - 1.5, bullet.y - 5, 3, 10);
        }
        // Bright core pass
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < GameState.bullets.length; i++) {
            const bullet = GameState.bullets[i];
            ctx.fillRect(bullet.x - 0.5, bullet.y - 4, 1, 8);
        }
        ctx.restore();
        
        // Draw enemy bullets with glow (batched)
        ctx.save();
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ff0066';
        for (let i = 0; i < GameState.enemyBullets.length; i++) {
            const bullet = GameState.enemyBullets[i];
            ctx.fillRect(bullet.x - 2, bullet.y - 3, 4, 6);
        }
        // Bright core pass
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffaacc';
        for (let i = 0; i < GameState.enemyBullets.length; i++) {
            const bullet = GameState.enemyBullets[i];
            ctx.fillRect(bullet.x - 1, bullet.y - 2, 2, 4);
        }
        ctx.restore();
        
        // Draw particles (batched for performance)
        GraphicsOptimizer.batchRenderParticles(ctx, GameState.particles);
        
        // Draw player
        this.drawPlayer(ctx);
        
        // Draw HUD
        this.drawHUD(ctx);
        
        // Draw score popups (floating text)
        if (this.scorePopups.length > 0) {
            ctx.save();
            for (let i = 0; i < this.scorePopups.length; i++) {
                const popup = this.scorePopups[i];
                const alpha = popup.life / popup.maxLife;
                ctx.globalAlpha = alpha;
                ctx.font = "bold 10px 'Press Start 2P', monospace";
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(popup.text, popup.x, popup.y);
            }
            ctx.restore();
        }
        
        // Draw level transition banner
        if (GameState.levelTransition > 0) {
            const progress = (2 - GameState.levelTransition) / 2;
            const bannerAlpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            ctx.save();
            ctx.globalAlpha = Math.max(0, bannerAlpha);
            
            // Banner background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, GameConfig.CANVAS_HEIGHT / 2 - 40, GameConfig.CANVAS_WIDTH, 80);
            
            // Level text
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.font = "20px 'Press Start 2P', monospace";
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`STAGE ${GameState.level + 1}`, GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 8);
            
            ctx.shadowBlur = 0;
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.fillStyle = '#ffff00';
            ctx.fillText('GET READY!', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 18);
            
            ctx.restore();
        }
    },
    
    // Draw player
    drawPlayer(ctx) {
        const player = GameState.player;
        
        if (!player.alive) return;
        
        // Invulnerability flashing effect
        if (player.invulnerable) {
            const flash = Math.sin(this.currentTime * 0.02) > 0;
            if (!flash) return;
        }
        
        // Player ship - Galaga-style fighter
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Engine exhaust glow
        const thrustPulse = 0.7 + Math.sin(this.currentTime * 0.04) * 0.3;
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(100, 150, 255, ${thrustPulse * 0.5})`;
        ctx.fillRect(-3, 10, 6, 4);
        ctx.fillStyle = `rgba(200, 220, 255, ${thrustPulse * 0.7})`;
        ctx.fillRect(-2, 11, 4, 2);
        ctx.shadowBlur = 0;
        
        // Main fuselage (white/light blue like original Galaga)
        const bodyGrad = ctx.createLinearGradient(0, -12, 0, 10);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, '#aaddff');
        bodyGrad.addColorStop(1, '#4488cc');
        ctx.fillStyle = bodyGrad;
        
        // Classic Galaga ship shape - pointed nose, swept wings
        ctx.beginPath();
        ctx.moveTo(0, -14);       // Nose tip
        ctx.lineTo(-3, -6);       // Upper body left
        ctx.lineTo(-5, -2);       // Wing root left
        ctx.lineTo(-13, 6);       // Wing tip left
        ctx.lineTo(-12, 8);       // Wing bottom left
        ctx.lineTo(-5, 4);        // Wing inner left
        ctx.lineTo(-4, 10);       // Lower body left
        ctx.lineTo(4, 10);        // Lower body right
        ctx.lineTo(5, 4);         // Wing inner right
        ctx.lineTo(12, 8);        // Wing bottom right
        ctx.lineTo(13, 6);        // Wing tip right
        ctx.lineTo(5, -2);        // Wing root right
        ctx.lineTo(3, -6);        // Upper body right
        ctx.closePath();
        ctx.fill();
        
        // Wing detail stripes (red accents like original)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(-5, -1);
        ctx.lineTo(-11, 6);
        ctx.lineTo(-10, 7);
        ctx.lineTo(-5, 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -1);
        ctx.lineTo(11, 6);
        ctx.lineTo(10, 7);
        ctx.lineTo(5, 2);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit canopy
        ctx.fillStyle = '#88ccff';
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-2, -2);
        ctx.lineTo(2, -2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Outline for definition
        ctx.strokeStyle = '#224466';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-3, -6);
        ctx.lineTo(-5, -2);
        ctx.lineTo(-13, 6);
        ctx.lineTo(-12, 8);
        ctx.lineTo(-5, 4);
        ctx.lineTo(-4, 10);
        ctx.lineTo(4, 10);
        ctx.lineTo(5, 4);
        ctx.lineTo(12, 8);
        ctx.lineTo(13, 6);
        ctx.lineTo(5, -2);
        ctx.lineTo(3, -6);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    },
    
    // Draw HUD (original Galaga style)
    drawHUD(ctx) {
        const arcadeFont = "'Press Start 2P', monospace";
        
        // Score at top-left
        ctx.save();
        Renderer.drawText('1UP', 10, 12, {
            font: `8px ${arcadeFont}`,
            color: '#ff0000'
        });
        Renderer.drawText(`${GameState.score.toLocaleString()}`, 10, 26, {
            font: `10px ${arcadeFont}`,
            color: '#ffffff'
        });
        
        // HIGH SCORE at top-center
        Renderer.drawText('HIGH SCORE', GameConfig.CANVAS_WIDTH / 2, 12, {
            font: `8px ${arcadeFont}`,
            color: '#ff0000',
            align: 'center'
        });
        const highScore = GameState.highScores.length > 0 ? GameState.highScores[0].score : 0;
        Renderer.drawText(`${Math.max(highScore, GameState.score).toLocaleString()}`, GameConfig.CANVAS_WIDTH / 2, 26, {
            font: `10px ${arcadeFont}`,
            color: '#ffffff',
            align: 'center'
        });
        ctx.restore();
        
        // Lives as small ship icons at bottom-left (original Galaga style)
        const livesY = GameConfig.CANVAS_HEIGHT - 16;
        for (let i = 0; i < GameState.lives - 1; i++) { // -1 because current life is in play
            this.drawMiniShip(ctx, 16 + i * 20, livesY);
        }
        
        // Stage indicator at bottom-right (small flag/badge icons)
        this.drawStageIndicator(ctx);
    },
    
    // Draw a miniature player ship for lives display
    drawMiniShip(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.5, 0.5);
        
        // Classic Galaga ship silhouette
        const grad = ctx.createLinearGradient(0, -12, 0, 8);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#4488cc');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-3, -6);
        ctx.lineTo(-5, -2);
        ctx.lineTo(-13, 6);
        ctx.lineTo(-12, 8);
        ctx.lineTo(-5, 4);
        ctx.lineTo(-4, 10);
        ctx.lineTo(4, 10);
        ctx.lineTo(5, 4);
        ctx.lineTo(12, 8);
        ctx.lineTo(13, 6);
        ctx.lineTo(5, -2);
        ctx.lineTo(3, -6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw stage indicator at bottom-right (like original Galaga stage flags)
    drawStageIndicator(ctx) {
        const baseX = GameConfig.CANVAS_WIDTH - 15;
        const baseY = GameConfig.CANVAS_HEIGHT - 16;
        const level = GameState.level;
        
        // Draw stage badges: large flag = 5 stages, small flag = 1 stage
        let remaining = level;
        let xPos = baseX;
        
        // Large badges (worth 5)
        const largeCount = Math.floor(remaining / 5);
        for (let i = 0; i < largeCount && i < 10; i++) {
            ctx.fillStyle = '#0088ff';
            ctx.fillRect(xPos - 8, baseY - 5, 8, 10);
            // Flag pole
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(xPos - 9, baseY - 6, 1, 12);
            xPos -= 14;
        }
        remaining -= largeCount * 5;
        
        // Small badges (worth 1)
        for (let i = 0; i < remaining; i++) {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(xPos - 5, baseY - 3, 5, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(xPos - 6, baseY - 4, 1, 8);
            xPos -= 10;
        }
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
        Renderer.drawText('PAUSED', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 20, {
            font: "24px 'Press Start 2P', monospace",
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
            font: "10px 'Press Start 2P', monospace",
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
            font: "24px 'Press Start 2P', monospace",
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
            font: "10px 'Press Start 2P', monospace",
            color: '#00ffff',
            align: 'center'
        });
        Renderer.drawText(`${GameState.score.toLocaleString()}`, GameConfig.CANVAS_WIDTH / 2, 330, {
            font: "20px 'Press Start 2P', monospace",
            color: '#ffff00',
            align: 'center'
        });
        ctx.restore();
        
        // Level reached
        Renderer.drawText(`Level Reached: ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 360, {
            font: "9px 'Press Start 2P', monospace",
            color: '#00ff88',
            align: 'center'
        });
        
        // Continue prompt with pulse
        const continuePulse = 0.5 + Math.sin(time * 4) * 0.5;
        const continueText = InputManager.isTouchDevice ? 'TAP TO CONTINUE' : 'PRESS SPACE';
        ctx.save();
        ctx.globalAlpha = continuePulse;
        Renderer.drawText(continueText, GameConfig.CANVAS_WIDTH / 2, 440, {
            font: "10px 'Press Start 2P', monospace",
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
        Renderer.drawText('NEW HIGH SCORE!', GameConfig.CANVAS_WIDTH / 2, 200, {
            font: "16px 'Press Start 2P', monospace",
            color: `hsl(${hue}, 100%, 60%)`,
            align: 'center'
        });
        ctx.restore();
        
        // Score display
        ctx.save();
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        Renderer.drawText(`${GameState.score.toLocaleString()} PTS`, GameConfig.CANVAS_WIDTH / 2, 240, {
            font: "14px 'Press Start 2P', monospace",
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
        Renderer.drawText('ENTER INITIALS', GameConfig.CANVAS_WIDTH / 2, 300, {
            font: "9px 'Press Start 2P', monospace",
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
            ctx.font = "20px 'Press Start 2P', monospace";
            ctx.fillStyle = i === GameState.initialIndex ? '#ffffff' : '#00aacc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letters[i], x + boxWidth / 2, y + boxHeight / 2);
            ctx.restore();
        }
        
        // Controls hint
        ctx.save();
        ctx.globalAlpha = 0.7;
        Renderer.drawText('UP/DN  LEFT/RIGHT  ENTER', GameConfig.CANVAS_WIDTH / 2, 400, {
            font: "7px 'Press Start 2P', monospace",
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
