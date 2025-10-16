// ============================================
// ENEMY MANAGEMENT SYSTEM
// Spawning, AI, formations, attack patterns
// ============================================

const EnemyManager = {
    types: ['bee', 'butterfly', 'boss', 'scorpion', 'moth', 'dragonfly', 'wasp', 'beetle'],
    spawnTimer: 0,
    spawnInterval: 2,
    maxEnemies: 32,
    waveNumber: 0,
    
    // Formation grid
    formationSpots: [],
    attackQueue: [],
    
    // Initialize enemy manager
    init() {
        this.setupFormation();
        console.log('✅ Enemy Manager initialized');
        return this;
    },
    
    // Setup enemy formation spots (Galaga-style grid)
    setupFormation() {
        this.formationSpots = [];
        const rows = 4;
        const cols = 8;
        const spacingX = 40;
        const spacingY = 30;
        const startX = (GameConfig.CANVAS_WIDTH - (cols - 1) * spacingX) / 2;
        const startY = 60;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.formationSpots.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    taken: false,
                    row: r,
                    col: c
                });
            }
        }
        
        console.log(`Formation setup: ${this.formationSpots.length} spots`);
    },
    
    // Get an empty formation spot
    getEmptyFormationSpot() {
        const availableSpots = this.formationSpots.filter(s => !s.taken);
        if (availableSpots.length > 0) {
            const spot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
            spot.taken = true;
            return spot;
        }
        return null;
    },
    
    // Progressive difficulty - enemy type unlocks
    getAvailableTypes(level) {
        const types = ['bee'];
        if (level >= 2) types.push('butterfly', 'dragonfly');
        if (level >= 3) types.push('scorpion');
        if (level >= 4) types.push('moth', 'wasp');
        if (level >= 6) types.push('beetle');
        if (level >= 8) types.push('boss');
        return types;
    },
    
    // Get enemy properties based on type and level
    getEnemyProperties(type, level) {
        const config = GameConfig.ENEMIES[type];
        if (!config) {
            console.warn(`Unknown enemy type: ${type}`);
            return GameConfig.ENEMIES.bee;
        }
        
        const props = { ...config };
        
        // Scale with level (slower progression for early levels)
        const levelMultiplier = 1 + Math.max(0, (level - 1) * 0.08);
        props.hp = Math.floor(props.hp * levelMultiplier);
        props.speed = Math.floor(props.speed * Math.min(levelMultiplier, 1.4));
        props.shootChance = Math.min(props.shootChance * (1 + Math.max(0, (level - 1) * 0.03)), 0.06);
        props.score = Math.floor(props.score * levelMultiplier);
        
        return props;
    },
    
    // Spawn new wave of enemies
    spawnWave(level, gameState) {
        this.waveNumber++;
        console.log(`Spawning wave ${this.waveNumber} for level ${level}`);
        
        const availableTypes = this.getAvailableTypes(level);
        const enemyCount = Math.min(6 + level * 2, 20);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy(level, gameState, availableTypes);
            }, i * 300);
        }
    },
    
    // Spawn a single enemy
    spawnEnemy(level, gameState, availableTypes = null) {
        if (gameState.enemies.length >= this.maxEnemies) return;
        
        if (!availableTypes) {
            availableTypes = this.getAvailableTypes(level);
        }
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const props = this.getEnemyProperties(type, level);
        
        // Get formation spot
        const formationSpot = this.getEmptyFormationSpot();
        if (!formationSpot) return;
        
        // Random entrance position
        const entranceX = Math.random() * GameConfig.CANVAS_WIDTH;
        const entranceY = -30;
        
        const enemy = {
            type,
            x: entranceX,
            y: entranceY,
            targetX: formationSpot.x,
            targetY: formationSpot.y,
            formationSpot,
            state: GameConfig.ENEMY_STATE.ENTRANCE,
            entranceProgress: 0,
            formationTime: 0,
            attackTime: 0,
            shootTimer: 0,
            ...props,
            maxHP: props.hp,
            entrancePath: this.createEntrancePath(entranceX, entranceY, formationSpot.x, formationSpot.y)
        };
        
        gameState.enemies.push(enemy);
    },
    
    // Create smooth entrance path (bezier curve)
    createEntrancePath(startX, startY, endX, endY) {
        const controlX1 = startX + (Math.random() - 0.5) * 100;
        const controlY1 = startY + 100;
        const controlX2 = endX + (Math.random() - 0.5) * 100;
        const controlY2 = endY - 50;
        
        return { startX, startY, controlX1, controlY1, controlX2, controlY2, endX, endY };
    },
    
    // Update enemy AI
    update(dt, gameState) {
        const enemies = gameState.enemies;
        
        enemies.forEach(enemy => {
            switch (enemy.state) {
                case GameConfig.ENEMY_STATE.ENTRANCE:
                    this.updateEntrance(enemy, dt);
                    break;
                case GameConfig.ENEMY_STATE.FORMATION:
                    this.updateFormation(enemy, dt, gameState);
                    break;
                case GameConfig.ENEMY_STATE.ATTACK:
                    this.updateAttack(enemy, dt, gameState);
                    break;
            }
            
            // Shooting logic
            enemy.shootTimer += dt;
            const shootCooldown = 1.5;
            
            if (enemy.shootTimer > shootCooldown) {
                let shootProbability = enemy.shootChance;
                
                if (enemy.state === GameConfig.ENEMY_STATE.ATTACK) {
                    shootProbability = gameState.waveConfig.attackingShootChance;
                } else if (enemy.state === GameConfig.ENEMY_STATE.FORMATION) {
                    shootProbability = gameState.waveConfig.formationShootChance;
                }
                
                if (Math.random() < shootProbability) {
                    this.enemyShoot(enemy, gameState);
                    enemy.shootTimer = 0;
                }
            }
        });
    },
    
    // Update enemy entrance animation
    updateEntrance(enemy, dt) {
        enemy.entranceProgress += dt * 0.5;
        
        if (enemy.entranceProgress >= 1) {
            enemy.state = GameConfig.ENEMY_STATE.FORMATION;
            enemy.x = enemy.targetX;
            enemy.y = enemy.targetY;
            return;
        }
        
        // Bezier curve interpolation
        const t = enemy.entranceProgress;
        const path = enemy.entrancePath;
        const t1 = 1 - t;
        
        enemy.x = t1 * t1 * t1 * path.startX +
                  3 * t1 * t1 * t * path.controlX1 +
                  3 * t1 * t * t * path.controlX2 +
                  t * t * t * path.endX;
                  
        enemy.y = t1 * t1 * t1 * path.startY +
                  3 * t1 * t1 * t * path.controlY1 +
                  3 * t1 * t * t * path.controlY2 +
                  t * t * t * path.endY;
    },
    
    // Update enemy in formation
    updateFormation(enemy, dt, gameState) {
        enemy.formationTime += dt;
        
        // Gentle formation movement (swaying)
        const sway = Math.sin(enemy.formationTime * 2 + enemy.formationSpot.col) * 5;
        const bob = Math.sin(enemy.formationTime * 3 + enemy.formationSpot.row) * 3;
        enemy.x = enemy.targetX + sway;
        enemy.y = enemy.targetY + bob;
        
        const waveConfig = gameState.waveConfig;
        const attackRoll = Math.random();
        
        if (attackRoll < waveConfig.baseAttackChance && this.attackQueue.length < waveConfig.maxAttackers) {
            enemy.state = GameConfig.ENEMY_STATE.ATTACK;
            enemy.attackTime = 0;
            enemy.attackPath = this.createAttackPath(enemy, gameState.player);
            this.attackQueue.push(enemy);
        }
        else if (attackRoll < waveConfig.groupAttackChance && this.attackQueue.length < waveConfig.maxAttackers - 1) {
            const nearbyEnemies = gameState.enemies.filter(e => 
                e.state === GameConfig.ENEMY_STATE.FORMATION && 
                e !== enemy &&
                Math.abs(e.formationSpot.row - enemy.formationSpot.row) <= 1 &&
                Math.abs(e.formationSpot.col - enemy.formationSpot.col) <= 1
            );
            
            if (nearbyEnemies.length > 0 && Math.random() < 0.5) {
                enemy.state = GameConfig.ENEMY_STATE.ATTACK;
                enemy.attackTime = 0;
                enemy.attackPath = this.createAttackPath(enemy, gameState.player);
                this.attackQueue.push(enemy);
                
                const buddy = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                buddy.state = GameConfig.ENEMY_STATE.ATTACK;
                buddy.attackTime = Math.random() * 0.3;
                buddy.attackPath = this.createAttackPath(buddy, gameState.player);
                this.attackQueue.push(buddy);
            }
        }
    },
    
    // Update attacking enemy
    updateAttack(enemy, dt, gameState) {
        enemy.attackTime += dt;
        
        const duration = 3.5;
        if (enemy.attackTime >= duration) {
            const canvasHeight = GameConfig.CANVAS_HEIGHT;
            const canvasWidth = GameConfig.CANVAS_WIDTH;
            
            if (enemy.y < canvasHeight + 50 && enemy.x > -50 && enemy.x < canvasWidth + 50) {
                enemy.state = GameConfig.ENEMY_STATE.ENTRANCE;
                enemy.entranceProgress = 0;
                enemy.entrancePath = this.createEntrancePath(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
            } else {
                enemy.formationSpot.taken = false;
                const index = gameState.enemies.indexOf(enemy);
                if (index > -1) gameState.enemies.splice(index, 1);
            }
            
            const queueIndex = this.attackQueue.indexOf(enemy);
            if (queueIndex > -1) this.attackQueue.splice(queueIndex, 1);
            return;
        }
        
        // Follow attack path
        const t = enemy.attackTime / duration;
        const path = enemy.attackPath;
        
        switch(path.pattern) {
            case 'dive':
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.sin(t * Math.PI * 4) * path.wobble;
                enemy.y = path.startY + (path.endY - path.startY) * t * t;
                break;
                
            case 'swoop':
                const swoopCurve = Math.sin(t * Math.PI);
                enemy.x = path.startX + (path.endX - path.startX) * t;
                enemy.y = path.startY + (path.endY - path.startY) * swoopCurve + Math.sin(t * Math.PI * 2) * path.wobble * 0.5;
                break;
                
            case 'loop':
                const loopAngle = t * Math.PI * 2;
                const radius = path.wobble;
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.cos(loopAngle) * radius;
                enemy.y = path.startY + (path.endY - path.startY) * t + Math.sin(loopAngle) * radius;
                break;
                
            default:
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.sin(t * Math.PI * 4) * path.wobble;
                enemy.y = path.startY + (path.endY - path.startY) * t;
        }
    },
    
    // Create attack path with variety
    createAttackPath(enemy, player) {
        const startX = enemy.x;
        const startY = enemy.y;
        const patternType = Math.random();
        let endX, endY, wobble, pattern;
        
        if (patternType < 0.4) {
            // Direct dive at player
            endX = player.x + (Math.random() - 0.5) * 80;
            endY = GameConfig.CANVAS_HEIGHT + 50;
            wobble = 20 + Math.random() * 30;
            pattern = 'dive';
        } else if (patternType < 0.7) {
            // Swooping arc
            endX = startX < GameConfig.CANVAS_WIDTH / 2 ? GameConfig.CANVAS_WIDTH + 50 : -50;
            endY = player.y + (Math.random() - 0.5) * 100;
            wobble = 60 + Math.random() * 50;
            pattern = 'swoop';
        } else {
            // Loop pattern
            endX = GameConfig.CANVAS_WIDTH - startX;
            endY = GameConfig.CANVAS_HEIGHT + 50;
            wobble = 80 + Math.random() * 60;
            pattern = 'loop';
        }
        
        return { startX, startY, endX, endY, wobble, pattern };
    },
    
    // Enemy shooting
    enemyShoot(enemy, gameState) {
        const bullet = {
            x: enemy.x,
            y: enemy.y + enemy.h / 2,
            w: 4,
            h: 6,
            speed: gameState.waveConfig.bulletSpeed,
            from: 'enemy',
            color: enemy.color,
            vx: 0,
            vy: 1
        };
        
        gameState.enemyBullets.push(bullet);
        
        if (AudioEngine && AudioEngine.enemyShoot) {
            AudioEngine.enemyShoot();
        }
    },
    
    // Draw all enemies
    draw(ctx, gameState, time) {
        gameState.enemies.forEach(enemy => {
            const attacking = enemy.state === GameConfig.ENEMY_STATE.ATTACK;
            
            // Draw alien sprite
            AlienSprites.draw(ctx, enemy.type, enemy.x, enemy.y, time, 1, attacking);
            
            // Draw health bar for tougher enemies
            if (enemy.maxHP > 1) {
                const healthPercent = enemy.hp / enemy.maxHP;
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
                ctx.fillRect(enemy.x - 10, enemy.y - 18, 20 * healthPercent, 2);
            }
        });
    },
    
    // Reset enemy manager
    reset() {
        this.waveNumber = 0;
        this.attackQueue = [];
        this.formationSpots.forEach(spot => spot.taken = false);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyManager;
}
