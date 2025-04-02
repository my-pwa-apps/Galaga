// Enemy ships with improved visuals

class Enemy {
    constructor(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.targetX = options.targetX || this.x;
        this.targetY = options.targetY || this.y;
        this.speed = options.speed || 2;
        this.points = options.points || 100;
        this.type = options.type || 'basic';
        
        // Use the level-specific variation instead of random
        this.subType = options.subType || 0;
        
        this.width = options.width || 25;
        this.height = options.height || 25;
        this.radius = Math.max(this.width, this.height) / 2;
        this.health = options.health || (this.type === 'boss' ? 3 : 1);
        
        this.state = 'entering'; // entering, formation, attacking
        this.formationX = options.formationX || 0;
        this.formationY = options.formationY || 0;
        this.entryPath = options.entryPath || [];
        this.pathIndex = 0;
        this.attackDelay = 0;
        this.fireRate = options.fireRate || 0.005; // Chance to fire per frame
        this.animationPhase = Math.random() * Math.PI * 2; // Random starting phase
    }
    
    update() {
        // Update animation phase
        this.animationPhase += 0.05;
        
        if (this.state === 'entering') {
            this.followEntryPath();
        } else if (this.state === 'formation') {
            this.moveInFormation();
            this.tryToAttack();
            this.tryToShoot();
        } else if (this.state === 'attacking') {
            this.attackPlayer();
        }
    }
    
    followEntryPath() {
        if (this.pathIndex >= this.entryPath.length) {
            this.state = 'formation';
            return;
        }
        
        const target = this.entryPath[this.pathIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
            this.pathIndex++;
        } else {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }
    
    moveInFormation() {
        const dx = this.formationX - this.x;
        const dy = this.formationY - this.y;
        
        this.x += dx * 0.1;
        this.y += dy * 0.1;
        
        // Add slight wave motion in formation
        this.x += Math.sin(this.game.frameCount * 0.03) * 0.5;
    }
    
    tryToAttack() {
        if (this.attackDelay > 0) {
            this.attackDelay--;
            return;
        }
        
        // Random chance to leave formation and attack
        if (Math.random() < 0.001) {
            this.state = 'attacking';
        }
    }
    
    tryToShoot() {
        if (Math.random() < this.fireRate) {
            // Create bullet using the projectile pool with proper parameters
            this.game.projectilePool.get({
                game: this.game,
                x: this.x,
                y: this.y + 20,
                speed: 5, // Positive speed for downward movement
                type: 'enemy',
                isEnemy: true // Explicitly set isEnemy flag
            });
            
            // Play enemy shooting sound
            if (window.audioManager) {
                window.audioManager.play('enemyShoot', 0.2);
            }
        }
    }
    
    attackPlayer() {
        // Calculate angle to player
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        
        // If enemy goes offscreen, put it back in formation
        if (this.y > this.game.height + 50) {
            this.state = 'formation';
            this.x = this.formationX;
            this.y = this.formationY;
        }
    }
    
    draw() {
        // Apply slight hovering effect based on animation phase
        const yOffset = Math.sin(this.animationPhase) * 2;
        
        // Draw the enemy with appropriate sprite based on type
        if (this.type === 'boss') {
            sprites.bossEnemy.draw(this.game.ctx, this.x, this.y + yOffset, this.subType, this.hitFlash);
        } else if (this.type === 'dive') {
            sprites.diveEnemy.draw(this.game.ctx, this.x, this.y + yOffset, this.subType, this.hitFlash);
        } else {
            sprites.basicEnemy.draw(this.game.ctx, this.x, this.y + yOffset, this.subType, this.hitFlash);
        }
    }
    
    hit() {
        this.health--;
        
        // Visual feedback when hit
        this.hitFlash = true;
        
        // Reset hit flash after a short delay
        setTimeout(() => {
            this.hitFlash = false;
        }, 100);
        
        return this.health <= 0;
    }
}

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.formationWidth = 8;
        this.formationHeight = 5;
        this.formationSpacingX = 40;
        this.formationSpacingY = 40;
        this.formationOffsetY = 80;
        this.wavePatterns = this.generateWavePatterns();
        this.currentWavePattern = 0;
    }
    
    createFormation(level) {
        // Get difficulty parameters from level manager
        const difficultyParams = this.game.levelManager.getDifficultyParams();
        
        // Choose a wave pattern based on level
        this.currentWavePattern = (level - 1) % this.wavePatterns.length;
        const entryPaths = this.wavePatterns[this.currentWavePattern];
        let pathIndex = 0;
        
        // Calculate a consistent alien style for this level
        const levelVariation = (level - 1) % 5;
        
        // Determine formation density based on level (more enemies in higher levels)
        const skipProbability = Math.max(0, 0.4 - (level * 0.05)); // Decreases with level
        
        for (let row = 0; row < this.formationHeight; row++) {
            for (let col = 0; col < this.formationWidth; col++) {
                // Skip some enemies based on level to create different formations
                // Lower skip probability in higher levels means more enemies
                if (this.shouldSkipEnemy(row, col, level, skipProbability)) continue;
                
                // Determine enemy type and attributes based on position and level
                let type = 'basic';
                let points = 100;
                let fireRate = difficultyParams.fireRate;
                let health = difficultyParams.enemyHealth;
                
                // Top row is bosses
                if (row === 0) {
                    type = 'boss';
                    points = 300;
                    fireRate = difficultyParams.bossFireRate;
                    health = difficultyParams.bossHealth;
                } 
                // Middle rows sometimes have dive attackers (more in higher levels)
                else if (row === 2 || row === 3) {
                    // Increasing chance of dive attackers in higher levels
                    if (Math.random() < (0.3 + level * 0.03)) {
                        type = 'dive';
                        points = 150;
                        fireRate = difficultyParams.fireRate * 1.5;
                        health = Math.max(1, difficultyParams.enemyHealth - 1);
                    }
                }
                
                // Adjust points based on level
                points = points * difficultyParams.pointMultiplier;
                
                // Formation coordinates
                const formationX = (col * this.formationSpacingX) + 
                               (this.game.width - (this.formationWidth - 1) * this.formationSpacingX) / 2;
                const formationY = (row * this.formationSpacingY) + this.formationOffsetY;
                
                const enemy = new Enemy({
                    game: this.game,
                    x: -50, // Start offscreen
                    y: -50,
                    formationX: formationX,
                    formationY: formationY,
                    entryPath: entryPaths[pathIndex % entryPaths.length],
                    type: type,
                    subType: levelVariation,
                    points: points,
                    speed: difficultyParams.enemySpeed,
                    fireRate: fireRate,
                    health: health,
                    attackChance: difficultyParams.attackChance
                });
                
                this.enemies.push(enemy);
                pathIndex++;
            }
        }
    }
    
    shouldSkipEnemy(row, col, level, skipProbability) {
        // Base pattern logic
        if (level % 5 === 0) {
            // Boss level - but with increasing density in higher levels
            return !(row === 0 || (row % 2 === 0 && col % Math.max(2, 4 - Math.floor(level / 10)) === 0));
        } else if (level % 3 === 0) {
            // V formation
            return !(row === col || row === (this.formationWidth - 1) - col);
        } else if (level % 2 === 0) {
            // Checkerboard pattern
            return (row + col) % 2 !== 0;
        }
        
        // For all other levels, use probability-based skipping
        // In higher levels, we'll have more enemies due to lower skipProbability
        return Math.random() < skipProbability;
    }
    
    generateWavePatterns() {
        // Create different entry path patterns for variety
        const patterns = [];
        const centerX = this.game.width / 2;
        
        // Pattern 1: Swooping from sides
        const swoopPattern = [];
        for (let i = 0; i < 4; i++) {
            const startX = i % 2 === 0 ? -50 : this.game.width + 50;
            const controlX1 = i % 2 === 0 ? centerX - 100 : centerX + 100;
            const controlY1 = 100;
            
            const path = [
                { x: startX, y: -50 },
                { x: controlX1, y: controlY1 },
                { x: centerX, y: 200 }
            ];
            swoopPattern.push(path);
        }
        patterns.push(swoopPattern);
        
        // Pattern 2: Spiral entry
        const spiralPattern = [];
        for (let i = 0; i < 4; i++) {
            const angleOffset = i * Math.PI / 2;
            const path = [];
            
            path.push({ x: centerX, y: -50 });
            
            // Generate spiral points
            for (let t = 0; t <= 1; t += 0.2) {
                const spiralRadius = 200 * t;
                const angle = 4 * Math.PI * t + angleOffset;
                const x = centerX + spiralRadius * Math.cos(angle);
                const y = 100 + spiralRadius * Math.sin(angle) / 2;
                path.push({ x, y });
            }
            
            spiralPattern.push(path);
        }
        patterns.push(spiralPattern);
        
        // Pattern 3: Zig-zag entry
        const zigzagPattern = [];
        for (let i = 0; i < 4; i++) {
            const startX = (i % 4) * (this.game.width / 4);
            const path = [{ x: startX, y: -50 }];
            
            // Create zig-zag
            let currentX = startX;
            let currentY = 0;
            for (let j = 0; j < 3; j++) {
                currentY += 50;
                currentX = currentX > centerX ? currentX - 100 : currentX + 100;
                path.push({ x: currentX, y: currentY });
            }
            
            zigzagPattern.push(path);
        }
        patterns.push(zigzagPattern);
        
        return patterns;
    }
    
    update() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();
        }
    }
    
    draw() {
        this.enemies.forEach(enemy => {
            enemy.draw();
        });
    }
    
    reset() {
        this.enemies = [];
    }
}
