// ============================================
// ENEMY MANAGEMENT SYSTEM
// Spawning, AI, formations, attack patterns
// ============================================

const EnemyManager = {
    types: null, // Will be populated from GameConfig.ENEMIES
    spawnTimer: 0,
    spawnInterval: 2,
    maxEnemies: 32,
    waveNumber: 0,
    spawningWave: false, // true while a wave is in the timed entrance spawning phase
    spawnTimeouts: [], // active setTimeout IDs for wave spawning
    enemiesSpawnedThisWave: 0, // track how many enemies actually spawned
    
    // Formation grid
    formationSpots: [],
    attackQueue: [],
    
    // Initialize enemy manager
    init() {
        // Populate types from config dynamically
        this.types = Object.keys(GameConfig.ENEMIES);
        this.setupFormation();
        this.spawningWave = false;
        this.spawnTimeouts = [];
        console.log('✅ Enemy Manager initialized with types:', this.types);
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
    
    // Progressive difficulty - enemy type unlocks (classic Galaga style)
    getAvailableTypes(level) {
        const unlocks = GameConfig.ENEMY_UNLOCKS;
        
        // Find the highest unlock level that's <= current level
        let availableTypes = unlocks[1]; // Default to level 1
        for (let unlockLevel in unlocks) {
            if (parseInt(unlockLevel) <= level) {
                availableTypes = unlocks[unlockLevel];
            }
        }
        
        return availableTypes || ['skulker'];
    },
    
    // Get enemy properties based on type and level
    getEnemyProperties(type, level) {
        const config = GameConfig.ENEMIES[type];
        if (!config) {
            console.warn(`Unknown enemy type: ${type}`);
            return GameConfig.ENEMIES.skulker || Object.values(GameConfig.ENEMIES)[0];
        }
        
        const props = { ...config };
        const difficulty = GameConfig.DIFFICULTY;
        
        // Scale with level using config values for better balance
        const levelMultiplier = 1 + Math.max(0, (level - 1) * difficulty.HP_SCALE_PER_LEVEL);
        props.hp = Math.floor(props.hp * levelMultiplier);
        props.speed = Math.floor(props.speed * Math.min(levelMultiplier, difficulty.SPEED_SCALE_MAX));
        props.shootChance = Math.min(
            props.shootChance * (1 + Math.max(0, (level - 1) * difficulty.SHOOT_SCALE_PER_LEVEL)), 
            difficulty.SHOOT_CHANCE_MAX
        );
        props.score = Math.floor(props.score * levelMultiplier);
        
        return props;
    },
    
    // Spawn new wave of enemies (Galaga-style formation grouping)
    spawnWave(level, gameState) {
        // Cancel any leftover timeouts from previous wave/session
        if (this.spawnTimeouts.length) {
            this.spawnTimeouts.forEach(id => clearTimeout(id));
            this.spawnTimeouts = [];
        }
        this.waveNumber++;
        this.enemiesSpawnedThisWave = 0;
        if (GameConfig.DEBUG_MODE) {
            console.log(`Spawning wave ${this.waveNumber} for level ${level}`);
        }

        const availableTypes = this.getAvailableTypes(level);
        const enemyCount = Math.min(8 + level * 2, 24);

        // Classic Galaga grouping: assign types to rows
        // Top rows: Elite enemies, Bottom rows: Common enemies
        const typesByRow = this.assignTypesToFormationRows(availableTypes, level);

        // Mark that we are in spawning phase so level completion logic waits
        this.spawningWave = true;
        let spawned = 0;
        const totalToSpawn = enemyCount;

        for (let i = 0; i < enemyCount; i++) {
            const timeoutId = setTimeout(() => {
                const success = this.spawnEnemyWithType(level, gameState, typesByRow);
                if (success) {
                    this.enemiesSpawnedThisWave++;
                }
                spawned++;
                if (GameConfig.DEBUG_MODE) {
                    console.log(`[SPAWN] Spawned ${spawned}/${totalToSpawn} enemies (${this.enemiesSpawnedThisWave} successful)`);
                }
                if (spawned >= totalToSpawn) {
                    // All spawn attempts completed
                    this.spawningWave = false;
                    console.log(`Wave ${this.waveNumber} fully spawned - ${this.enemiesSpawnedThisWave} enemies active`);
                }
            }, i * 300);
            this.spawnTimeouts.push(timeoutId);
        }
    },
    
    // Assign enemy types to formation rows (Galaga-style)
    assignTypesToFormationRows(availableTypes, level) {
        const typesByRow = {};
        
        // Classic Galaga formation: 
        // Row 0 (top): Boss/elite enemies
        // Row 1: Medium enemies
        // Row 2-3: Common/weak enemies
        
        if (availableTypes.includes('boss')) {
            typesByRow[0] = ['boss', 'beetle', 'octopus'];
        } else if (availableTypes.includes('beetle')) {
            typesByRow[0] = ['beetle', 'octopus', 'wasp'];
        } else if (availableTypes.includes('octopus')) {
            typesByRow[0] = ['octopus', 'wasp', 'butterfly'];
        } else {
            typesByRow[0] = ['butterfly', 'wraith'];
        }
        
        typesByRow[1] = availableTypes.includes('wasp') ? ['wasp', 'wraith', 'butterfly'] : ['butterfly', 'wraith'];
        typesByRow[2] = availableTypes.includes('parasite') ? ['parasite', 'wraith', 'skulker'] : ['wraith', 'skulker'];
        typesByRow[3] = ['skulker'];
        
        // Filter to only include available types
        for (let row in typesByRow) {
            typesByRow[row] = typesByRow[row].filter(t => availableTypes.includes(t));
            if (typesByRow[row].length === 0) {
                typesByRow[row] = [availableTypes[0]]; // Fallback
            }
        }
        
        return typesByRow;
    },
    
    // Spawn a single enemy with row-based type (Galaga-style)
    spawnEnemyWithType(level, gameState, typesByRow) {
        if (gameState.enemies.length >= this.maxEnemies) return false;
        
        // Get formation spot first
        const formationSpot = this.getEmptyFormationSpot();
        if (!formationSpot) {
            if (GameConfig.DEBUG_MODE) {
                console.log('[DEBUG] spawnEnemy aborted - no formation spot available. Current enemies:', gameState.enemies.length);
            }
            return false;
        }
        
        // Select enemy type based on formation row (Galaga-style grouping)
        const rowTypes = typesByRow[formationSpot.row] || typesByRow[0];
        const type = rowTypes[Math.floor(Math.random() * rowTypes.length)];
        const props = this.getEnemyProperties(type, level);
        
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
        if (GameConfig.DEBUG_MODE && gameState.enemies.length % 5 === 0) {
            console.log(`[DEBUG] Spawned enemy #${gameState.enemies.length} in wave ${this.waveNumber}`);
        }
        return true;
    },
    
    // Legacy spawn function for compatibility
    spawnEnemy(level, gameState, availableTypes = null) {
        if (gameState.enemies.length >= this.maxEnemies) return false;
        
        if (!availableTypes) {
            availableTypes = this.getAvailableTypes(level);
        }
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const props = this.getEnemyProperties(type, level);
        
        // Get formation spot
        const formationSpot = this.getEmptyFormationSpot();
        if (!formationSpot) {
            if (GameConfig.DEBUG_MODE) {
                console.log('[DEBUG] spawnEnemy aborted - no formation spot available. Current enemies:', gameState.enemies.length);
            }
            return false;
        }
        
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
        if (gameState.enemies.length % 5 === 0) {
            console.log(`[DEBUG] Spawned enemy #${gameState.enemies.length} in wave ${this.waveNumber}`);
        }
        return true;
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
        
        // Remove enemies that flew way off-screen (beyond play area + buffer)
        if (enemy.y > GameConfig.CANVAS_HEIGHT + 100 || 
            enemy.x < -100 || 
            enemy.x > GameConfig.CANVAS_WIDTH + 100) {
            console.log('🚀 Enemy flew off-screen during entrance, removing. Position: x=' + Math.round(enemy.x) + ', y=' + Math.round(enemy.y));
            const index = GameState.enemies.indexOf(enemy);
            if (index > -1) {
                if (enemy.formationSpot) {
                    enemy.formationSpot.taken = false;
                }
                GameState.enemies.splice(index, 1);
                console.log('   Remaining enemies:', GameState.enemies.length);
            }
            return;
        }
        
        // Safety check: if entrance takes too long, snap to formation
        if (enemy.entranceProgress > 3) {
            enemy.state = GameConfig.ENEMY_STATE.FORMATION;
            enemy.x = enemy.targetX;
            enemy.y = enemy.targetY;
        }
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
            // Check if enemy went off-screen - if so, remove it
            // Otherwise return to formation
            if (enemy.y > GameConfig.CANVAS_HEIGHT + 100 || 
                enemy.x < -100 || 
                enemy.x > GameConfig.CANVAS_WIDTH + 100) {
                // Enemy flew off screen, mark for removal
                const queueIndex = this.attackQueue.indexOf(enemy);
                if (queueIndex > -1) this.attackQueue.splice(queueIndex, 1);
                
                if (enemy.formationSpot) {
                    enemy.formationSpot.taken = false;
                }
                
                const enemyIndex = gameState.enemies.indexOf(enemy);
                if (enemyIndex > -1) {
                    console.log('🚀 Enemy flew off-screen, removing. Remaining enemies:', gameState.enemies.length - 1);
                    gameState.enemies.splice(enemyIndex, 1);
                }
                return;
            } else {
                // Enemy is still on screen, return to formation
                enemy.state = GameConfig.ENEMY_STATE.ENTRANCE;
                enemy.entranceProgress = 0;
                enemy.entrancePath = this.createEntrancePath(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
                
                const queueIndex = this.attackQueue.indexOf(enemy);
                if (queueIndex > -1) this.attackQueue.splice(queueIndex, 1);
                return;
            }
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
        if (this.spawnTimeouts.length) {
            this.spawnTimeouts.forEach(id => clearTimeout(id));
            this.spawnTimeouts = [];
        }
        this.waveNumber = 0;
        this.spawningWave = false;
        this.enemiesSpawnedThisWave = 0;
        this.attackQueue = [];
        this.formationSpots.forEach(spot => spot.taken = false);
        console.log('🔄 EnemyManager reset (timers cleared)');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyManager;
}
