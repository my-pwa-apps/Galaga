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
        
        // Initialize patterns or set default
        this.initWavePatterns();
        this.currentWavePattern = 0;
    }
    
    // Initialize wave patterns safely
    initWavePatterns() {
        try {
            this.wavePatterns = this.generateWavePatterns();
            
            // If wavePatterns is undefined or empty, create a default pattern
            if (!this.wavePatterns || !this.wavePatterns.length) {
                console.warn('Wave patterns not generated properly, using default pattern');
                this.createDefaultPattern();
            }
        } catch (error) {
            console.error('Error generating wave patterns:', error);
            this.createDefaultPattern();
        }
    }
    
    // Create a simple default pattern if normal generation fails
    createDefaultPattern() {
        const centerX = this.game ? this.game.width / 2 : 300;
        
        // Simple straight-line entry pattern
        const straightPattern = [];
        for (let i = 0; i < 4; i++) {
            const startX = centerX - 150 + (i * 100);
            const path = [
                { x: startX, y: -50 },
                { x: startX, y: 100 },
                { x: startX, y: 150 }
            ];
            straightPattern.push(path);
        }
        
        this.wavePatterns = [straightPattern];
    }
    
    createFormation(level) {
        // Fix: Validate level parameter
        if (isNaN(level) || level < 1) {
            console.error("Invalid level passed to createFormation:", level);
            level = 1; // Default to level 1
        }
        
        // Get difficulty parameters from level manager
        let difficultyParams;
        try {
            difficultyParams = this.game.levelManager.getDifficultyParams();
        } catch (error) {
            console.error("Error getting difficulty params:", error);
            // Use default parameters if there's an error
            difficultyParams = {
                enemySpeed: 1.0,
                enemyHealth: 1,
                bossHealth: 3,
                fireRate: 0.005,
                bossFireRate: 0.008,
                pointMultiplier: 1.0
            };
        }
        
        // Fix: Initialize wavePatterns if undefined
        if (!this.wavePatterns || !Array.isArray(this.wavePatterns) || this.wavePatterns.length === 0) {
            console.log("Regenerating wave patterns");
            try {
                this.wavePatterns = this.generateWavePatterns();
            } catch (error) {
                console.error("Error generating wave patterns:", error);
                // Create a simple default pattern
                const centerX = this.game.width / 2;
                this.wavePatterns = [[
                    [{ x: centerX - 100, y: -50 }, { x: centerX - 100, y: 100 }],
                    [{ x: centerX, y: -50 }, { x: centerX, y: 100 }],
                    [{ x: centerX + 100, y: -50 }, { x: centerX + 100, y: 100 }]
                ]];
            }
        }
        
        // Choose a wave pattern based on level with better error handling
        try {
            this.currentWavePattern = (level - 1) % Math.max(1, this.wavePatterns.length);
            const entryPaths = this.wavePatterns[this.currentWavePattern];
            
            // Fix: Enemies creation logic...
            // ...existing code...
            
        } catch (error) {
            console.error("Error in createFormation:", error);
            // Create a simple fallback formation
            this.createFallbackFormation();
        }
    }
    
    // Add a fallback method to create a simple formation if the main method fails
    createFallbackFormation() {
        console.log("Creating fallback formation");
        // Clear any existing enemies
        this.enemies = [];
        
        // Create a simple grid of enemies
        const rows = 3;
        const cols = 5;
        const spacingX = 50;
        const spacingY = 40;
        const startX = (this.game.width - (cols - 1) * spacingX) / 2;
        const startY = 100;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create simpler enemies
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                
                const type = row === 0 ? 'boss' : 'basic';
                const health = row === 0 ? 3 : 1;
                const points = row === 0 ? 300 : 100;
                
                const enemy = new Enemy({
                    game: this.game,
                    x: x,
                    y: y,
                    formationX: x,
                    formationY: y,
                    entryPath: [{ x: x, y: -30 }, { x: x, y: y }],
                    type: type,
                    points: points,
                    health: health
                });
                
                this.enemies.push(enemy);
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
        // Add safety check at the beginning
        if (!this.game || typeof this.game.width === 'undefined') {
            console.error('Game object not properly initialized in EnemyManager');
            return this.createDefaultPattern();
        }
        
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
        
        return patterns || [];
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
