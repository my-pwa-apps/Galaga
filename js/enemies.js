// ============================================
// ENEMY MANAGEMENT SYSTEM
// Spawning, AI, formations, attack patterns
// ============================================

const EnemyManager = {
    types: null, // Will be populated from GameConfig.ENEMIES
    spawnTimer: 0,
    spawnInterval: 2,
    maxEnemies: 42,
    waveNumber: 0,
    spawningWave: false, // true while a wave is in the timed entrance spawning phase
    spawnTimeouts: [], // active setTimeout IDs for wave spawning
    enemiesSpawnedThisWave: 0, // track how many enemies actually spawned
    waveReadyTime: 0,
    
    // Formation grid
    formationSpots: [],
    attackQueue: [],
    entranceSide: 1,
    
    // Initialize enemy manager
    init() {
        // Populate types from config dynamically
        this.types = Object.keys(GameConfig.ENEMIES);
        this.setupFormation();
        this.spawningWave = false;
        this.spawnTimeouts = [];
        debugLog('Enemy Manager initialized with types:', this.types);
        return this;
    },
    
    // Setup enemy formation spots (Galaga-style grid)
    // Original Galaga: Row 0 = 4 bosses, Row 1 = 8 butterflies, Rows 2-4 = 10 bees each
    // We adapt this: 5 rows, cols vary per row for authentic look
    setupFormation() {
        this.formationSpots = [];
        const formationRows = [
            { count: 4,  spacingX: 50 }, // Row 0: bosses/elites (4 wide)
            { count: 8,  spacingX: 40 }, // Row 1: mid-tier (8 wide)
            { count: 10, spacingX: 36 }, // Row 2: common (10 wide)
            { count: 10, spacingX: 36 }, // Row 3: common (10 wide)
            { count: 10, spacingX: 36 }, // Row 4: common (10 wide)
        ];
        const spacingY = 28;
        const startY = 55;

        for (let r = 0; r < formationRows.length; r++) {
            const row = formationRows[r];
            const startX = (GameConfig.CANVAS_WIDTH - (row.count - 1) * row.spacingX) / 2;
            for (let c = 0; c < row.count; c++) {
                this.formationSpots.push({
                    x: startX + c * row.spacingX,
                    y: startY + r * spacingY,
                    taken: false,
                    row: r,
                    col: c
                });
            }
        }
        
        debugLog(`Formation setup: ${this.formationSpots.length} spots (5 rows)`);
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
    
    // Original Galaga keeps the same three enemy classes throughout play.
    getAvailableTypes(level) {
        return GameConfig.ENEMY_UNLOCKS[1];
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
        this.waveReadyTime = performance.now() + this.getEntranceDelay(GameConfig.MAX_ENEMIES - 1) + 2500;
        if (GameConfig.DEBUG_MODE) {
            debugLog(`Spawning wave ${this.waveNumber} for level ${level}`);
        }

        const availableTypes = this.getAvailableTypes(level);
        const enemyCount = GameConfig.MAX_ENEMIES;

        // Classic Galaga grouping: assign types to rows
        // Top rows: Elite enemies, Bottom rows: Common enemies
        const typesByRow = this.assignTypesToFormationRows(availableTypes, level);

        // Mark that we are in spawning phase so level completion logic waits
        this.spawningWave = true;
        let spawned = 0;
        const totalToSpawn = enemyCount;

        for (let i = 0; i < enemyCount; i++) {
            const timeoutId = setTimeout(() => {
                const success = this.spawnEnemyWithType(level, gameState, typesByRow, i);
                if (success) {
                    this.enemiesSpawnedThisWave++;
                }
                spawned++;
                if (GameConfig.DEBUG_MODE) {
                    debugLog(`[SPAWN] Spawned ${spawned}/${totalToSpawn} enemies (${this.enemiesSpawnedThisWave} successful)`);
                }
                if (spawned >= totalToSpawn) {
                    // All spawn attempts completed
                    this.spawningWave = false;
                    debugLog(`Wave ${this.waveNumber} fully spawned - ${this.enemiesSpawnedThisWave} enemies active`);
                }
            }, this.getEntranceDelay(i));
            this.spawnTimeouts.push(timeoutId);
        }
    },

    getEntranceDelay(index) {
        const group = Math.floor(index / 4);
        const step = index % 4;
        return group * 680 + step * 120;
    },
    
    // Assign enemy types to formation rows (Galaga-style)
    // Row 0: bosses/elites, Row 1: mid-tier, Rows 2-4: common
    assignTypesToFormationRows(availableTypes, level) {
        const typesByRow = {};
        
        typesByRow[0] = ['boss'];
        typesByRow[1] = ['butterfly'];
        typesByRow[2] = ['skulker'];
        typesByRow[3] = ['skulker'];
        typesByRow[4] = ['skulker'];
        
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
    spawnEnemyWithType(level, gameState, typesByRow, formationIndex = null) {
        if (gameState.enemies.length >= this.maxEnemies) return false;
        
        const formationSpot = formationIndex === null ?
            this.getEmptyFormationSpot() :
            this.reserveFormationSpot(formationIndex);
        if (!formationSpot) {
            if (GameConfig.DEBUG_MODE) {
                debugLog('[DEBUG] spawnEnemy aborted - no formation spot available. Current enemies:', gameState.enemies.length);
            }
            return false;
        }
        
        // Select enemy type based on formation row (Galaga-style grouping)
        const rowTypes = typesByRow[formationSpot.row] || typesByRow[4];
        const type = rowTypes[0];
        const props = this.getEnemyProperties(type, level);
        
        const entranceSide = this.getEntranceSide(formationIndex || 0);
        const entranceX = entranceSide < 0 ? -30 : GameConfig.CANVAS_WIDTH + 30;
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
            entrancePath: this.createEntrancePath(entranceX, entranceY, formationSpot.x, formationSpot.y, entranceSide)
        };
        
        gameState.enemies.push(enemy);
        return true;
    },

    reserveFormationSpot(index) {
        const spot = this.formationSpots[index];
        if (!spot || spot.taken) return null;
        spot.taken = true;
        return spot;
    },

    getEntranceSide(index) {
        return Math.floor(index / 4) % 2 === 0 ? -1 : 1;
    },
    
    // Create smooth entrance path (bezier curve)
    createEntrancePath(startX, startY, endX, endY, side = null) {
        const entrySide = side || (startX < GameConfig.CANVAS_WIDTH / 2 ? -1 : 1);
        const loopCenterX = entrySide < 0 ? 130 : GameConfig.CANVAS_WIDTH - 130;
        const controlX1 = loopCenterX;
        const controlY1 = 125;
        const controlX2 = endX - entrySide * 85;
        const controlY2 = endY - 70;
        
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
            
            const waveReady = !this.spawningWave && performance.now() >= this.waveReadyTime;
            if (waveReady && enemy.shootTimer > shootCooldown) {
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
        
        // Safety: if enemy flew way off-screen during entrance, snap to target
        if (enemy.y > GameConfig.CANVAS_HEIGHT + 100 || 
            enemy.x < -200 || 
            enemy.x > GameConfig.CANVAS_WIDTH + 200) {
            debugLog('Enemy off-screen during entrance, snapping to formation');
            enemy.state = GameConfig.ENEMY_STATE.FORMATION;
            enemy.x = enemy.targetX;
            enemy.y = enemy.targetY;
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
        if (this.spawningWave || performance.now() < this.waveReadyTime) return;
        if (this.attackQueue.length >= waveConfig.maxAttackers) return;

        if (Math.random() < waveConfig.groupAttackChance) {
            this.launchAttackSquad(enemy, gameState);
        } else if (Math.random() < waveConfig.baseAttackChance) {
            this.launchAttacker(enemy, gameState, 0);
        }
    },

    launchAttackSquad(leader, gameState) {
        const room = gameState.waveConfig.maxAttackers - this.attackQueue.length;
        if (room <= 0) return;

        const squad = [leader];
        const escorts = gameState.enemies
            .filter(enemy => enemy.state === GameConfig.ENEMY_STATE.FORMATION &&
                enemy !== leader &&
                this.isClassicEscort(leader, enemy))
            .sort((a, b) => Math.abs(a.formationSpot.col - leader.formationSpot.col) - Math.abs(b.formationSpot.col - leader.formationSpot.col));

        for (let i = 0; i < escorts.length && squad.length < Math.min(room, 3); i++) {
            squad.push(escorts[i]);
        }

        for (let i = 0; i < squad.length; i++) {
            this.launchAttacker(squad[i], gameState, -i * 0.18);
        }
    },

    isClassicEscort(leader, candidate) {
        if (!leader.formationSpot || !candidate.formationSpot) return false;

        if (leader.type === 'boss') {
            return candidate.type === 'butterfly' &&
                candidate.formationSpot.row === 1 &&
                Math.abs(candidate.formationSpot.col - (leader.formationSpot.col * 2 + 1)) <= 1;
        }

        if (leader.type === 'butterfly') {
            return candidate.type === 'skulker' &&
                candidate.formationSpot.row >= 2 &&
                Math.abs(candidate.formationSpot.col - leader.formationSpot.col) <= 1;
        }

        return candidate.type === 'skulker' &&
            candidate.formationSpot.row === leader.formationSpot.row &&
            Math.abs(candidate.formationSpot.col - leader.formationSpot.col) === 1;
    },

    launchAttacker(enemy, gameState, phaseOffset = 0) {
        if (enemy.state !== GameConfig.ENEMY_STATE.FORMATION) return;
        if (this.attackQueue.includes(enemy)) return;

        enemy.state = GameConfig.ENEMY_STATE.ATTACK;
        enemy.attackTime = phaseOffset;
        enemy.attackPath = this.createAttackPath(enemy, gameState.player);
        this.attackQueue.push(enemy);
    },
    
    // Update attacking enemy
    updateAttack(enemy, dt, gameState) {
        enemy.attackTime += dt;
        
        const duration = 3.8;
        if (enemy.attackTime < 0) return;
        if (enemy.attackTime >= duration) {
            // In original Galaga, enemies that dive off-screen re-enter from the top
            // and fly back to their formation spot
            const queueIndex = this.attackQueue.indexOf(enemy);
            if (queueIndex > -1) this.attackQueue.splice(queueIndex, 1);
            
            // Return to formation via entrance path from top of screen
            enemy.state = GameConfig.ENEMY_STATE.ENTRANCE;
            enemy.entranceProgress = 0;
            // Re-enter from the top, near center
            const reEntryX = enemy.targetX + (Math.random() - 0.5) * 60;
            enemy.x = reEntryX;
            enemy.y = -30;
            enemy.entrancePath = this.createEntrancePath(reEntryX, -30, enemy.targetX, enemy.targetY);
            return;
        }
        
        // Follow attack path
        const t = enemy.attackTime / duration;
        const path = enemy.attackPath;
        
        switch(path.pattern) {
            case 'classicDive':
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.sin(t * Math.PI * 2.5) * path.wobble;
                enemy.y = path.startY + (path.endY - path.startY) * (t * t);
                break;
                
            case 'classicLoop':
                const loopT = Math.min(1, t * 1.4);
                const angle = loopT * Math.PI * 2;
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.cos(angle) * path.wobble * (1 - t * 0.35);
                enemy.y = path.startY + (path.endY - path.startY) * t + Math.sin(angle) * path.wobble * 0.55;
                break;
                
            case 'classicSwoop':
                const side = path.startX < GameConfig.CANVAS_WIDTH / 2 ? 1 : -1;
                enemy.x = path.startX + side * Math.sin(t * Math.PI) * path.wobble + (path.endX - path.startX) * t * 0.35;
                enemy.y = path.startY + (path.endY - path.startY) * t;
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
        
        if (patternType < 0.5) {
            endX = player.x + (Math.random() - 0.5) * 80;
            endY = GameConfig.CANVAS_HEIGHT + 50;
            wobble = 18 + Math.random() * 24;
            pattern = 'classicDive';
        } else if (patternType < 0.82) {
            endX = player.x + (Math.random() - 0.5) * 120;
            endY = GameConfig.CANVAS_HEIGHT + 55;
            wobble = 34 + Math.random() * 20;
            pattern = 'classicLoop';
        } else {
            endX = player.x;
            endY = GameConfig.CANVAS_HEIGHT + 50;
            wobble = 90 + Math.random() * 40;
            pattern = 'classicSwoop';
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
            AlienSprites.draw(ctx, enemy.type, enemy.x, enemy.y, time, 1, attacking);
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
        this.waveReadyTime = 0;
        this.attackQueue = [];
        this.formationSpots.forEach(spot => spot.taken = false);
        debugLog('EnemyManager reset');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyManager;
}
