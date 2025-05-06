// Enhanced enemy variety system
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
        
        // Define enemy themes for different level ranges
        this.enemyThemes = [
            {
                // Theme 1 (Levels 1-3): Classic red/blue alien theme
                name: "Classic",
                colors: {
                    basic: { main: '#FF3300', accent: '#FFDD00', glow: '#FF6600' },
                    special: { main: '#3366FF', accent: '#00FFFF', glow: '#6699FF' },
                    boss: { main: '#FF0099', accent: '#FFDDFF', glow: '#FF66CC' }
                },
                types: ['classic', 'scout']
            },
            {
                // Theme 2 (Levels 4-6): Green alien theme
                name: "Green Invasion",
                colors: {
                    basic: { main: '#33CC33', accent: '#AAFF00', glow: '#66FF66' },
                    special: { main: '#009966', accent: '#00FFCC', glow: '#00CC99' },
                    boss: { main: '#336600', accent: '#CCFF33', glow: '#99CC00' }
                },
                types: ['techno', 'hunter']
            },
            {
                // Theme 3 (Levels 7-9): Purple/dark alien theme
                name: "Dark Fleet",
                colors: {
                    basic: { main: '#6633CC', accent: '#CC99FF', glow: '#9966FF' },
                    special: { main: '#330066', accent: '#9900FF', glow: '#6600CC' },
                    boss: { main: '#990099', accent: '#FF66FF', glow: '#CC33CC' }
                },
                types: ['guardian', 'bomber']
            },
            {
                // Theme 4 (Levels 10+): Gold/elite alien theme
                name: "Golden Armada",
                colors: {
                    basic: { main: '#FFCC00', accent: '#FFFFFF', glow: '#FFDD66' },
                    special: { main: '#CC9900', accent: '#FFFF99', glow: '#FFCC33' },
                    boss: { main: '#996600', accent: '#FFCC99', glow: '#CC9933' }
                },
                types: ['elite', 'mothership']
            }
        ];
        
        // Pre-render enemy assets for better performance
        this.enemyAssets = {};
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
    
    // Get the theme for the current level
    getThemeForLevel(level) {
        // Determine theme based on level range
        if (level <= 3) {
            return this.enemyThemes[0]; // Classic theme (levels 1-3)
        } else if (level <= 6) {
            return this.enemyThemes[1]; // Green theme (levels 4-6)
        } else if (level <= 9) {
            return this.enemyThemes[2]; // Purple theme (levels 7-9)
        } else {
            return this.enemyThemes[3]; // Gold theme (levels 10+)
        }
    }
      // Create enemy formation with level-specific enemies
    createFormation(level) {
        // Validate level parameter
        if (isNaN(level) || level < 1) {
            console.error("Invalid level passed to createFormation:", level);
            level = 1; // Default to level 1
        }
        
        console.log(`Creating enemy formation for level ${level}`);
        
        // Get enhanced difficulty parameters from level manager
        let difficultyParams;
        try {
            difficultyParams = this.game.levelManager.getDifficultyParams();
            console.log(`Difficulty level: ${difficultyParams.difficultyLabel}`);
        } catch (error) {
            console.error("Error getting difficulty params:", error);
            // Use default parameters if there's an error
            difficultyParams = {
                enemySpeed: 1.0,
                enemyHealth: 1,
                bossHealth: 3,
                fireRate: 0.005,
                bossFireRate: 0.008,
                pointMultiplier: 1.0,
                specialBehaviorChance: 0.05,
                teleportUnlocked: level >= 5,
                aggressiveUnlocked: level >= 3,
                bossSpecialAttackChance: Math.min((level - 2) * 0.05, 0.4),
                formationComplexity: Math.min(Math.floor((level + 1) / 3), 4),
                diveChance: Math.min(0.001 + (level - 1) * 0.0003, 0.002),
                difficultyLabel: "Normal"
            };
        }
        
        // Get theme for this level
        const theme = this.getThemeForLevel(level);
        console.log(`Using enemy theme: ${theme.name}`);
        
        // Generate enemy assets for this theme if not already created
        this.generateEnemyAssetsForTheme(theme);
        
        // Clear any existing enemies
        this.enemies = [];
        
        // Initialize wavePatterns if undefined
        if (!this.wavePatterns || !Array.isArray(this.wavePatterns) || this.wavePatterns.length === 0) {
            console.log("Generating wave patterns");
            try {
                this.wavePatterns = this.generateWavePatterns();
                if (!this.wavePatterns || this.wavePatterns.length === 0) {
                    throw new Error("Wave pattern generation resulted in empty patterns");
                }
            } catch (error) {
                console.error("Error generating wave patterns:", error);
                // Create a simple default pattern
                this.createDefaultPattern();
            }
        }
        
        // Choose a wave pattern based on level with error handling
        try {
            const patternIndex = Math.min((level - 1) % Math.max(1, this.wavePatterns.length), this.wavePatterns.length - 1);
            this.currentWavePattern = patternIndex;
            
            const entryPaths = this.wavePatterns[patternIndex];
            
            if (!entryPaths || !Array.isArray(entryPaths) || entryPaths.length === 0) {
                throw new Error("Selected entry path is invalid");
            }
            
            console.log(`Using wave pattern ${patternIndex} with ${entryPaths.length} paths`);
            
            // Generate the enemy formation with level-specific enemies
            this.generateEnemyFormation(level, difficultyParams, entryPaths, theme);
            console.log(`Created ${this.enemies.length} enemies for level ${level}`);
            
            // Signal to level manager that enemies have been created
            if (this.game.levelManager) {
                this.game.levelManager.enemiesHaveSpawned(this.enemies.length);
            }
            
            // Make sure we have at least some enemies
            if (this.enemies.length === 0) {
                console.warn("No enemies created in standard formation, adding fallback enemies");
                this.createFallbackFormation(theme);
                
                // Signal fallback enemies have been created
                if (this.game.levelManager) {
                    this.game.levelManager.enemiesHaveSpawned(this.enemies.length);
                }
            }
        } catch (error) {
            console.error("Error in createFormation:", error);
            // Create a simple fallback formation
            this.createFallbackFormation(theme);
            
            // Signal fallback enemies have been created
            if (this.game.levelManager) {
                this.game.levelManager.enemiesHaveSpawned(this.enemies.length);
            }
        }
    }
    
    // Generate pre-rendered enemy assets for a theme
    generateEnemyAssetsForTheme(theme) {
        // Check if we already have assets for this theme
        const themeKey = theme.name;
        if (this.enemyAssets[themeKey]) {
            return;
        }
        
        console.log(`Generating assets for theme: ${theme.name}`);
        this.enemyAssets[themeKey] = {
            basic: this.createEnemyAsset('basic', theme.colors.basic),
            special: this.createEnemyAsset('special', theme.colors.special),
            boss: this.createEnemyAsset('boss', theme.colors.boss)
        };
    }    // Create a pre-rendered enemy asset with improved visual diversity
    createEnemyAsset(type, colors) {
        // Larger canvas size for better rendering quality
        const enemySize = 100;  // Increased from 80 for more detail
        const canvas = document.createElement('canvas');
        canvas.width = enemySize;
        canvas.height = enemySize;
        const ctx = canvas.getContext('2d');
        
        // Center point
        const centerX = enemySize / 2;
        const centerY = enemySize / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Enhanced shadow and glow effects
        ctx.shadowBlur = type === 'boss' ? 20 : (type === 'special' ? 18 : 15);
        ctx.shadowColor = colors.glow;
        
        // Randomize slightly for visual diversity within same enemy types
        const variationSeed = Math.random();
        const colorShift = variationSeed * 20 - 10; // -10 to +10 color variation
        
        // Apply color variation
        const adjustColor = (color) => {
            const rgb = color.match(/\d+/g).map(Number);
            return `rgb(${Math.min(255, Math.max(0, rgb[0] + colorShift))}, 
                       ${Math.min(255, Math.max(0, rgb[1] + colorShift))}, 
                       ${Math.min(255, Math.max(0, rgb[2] + colorShift))})`;
        };
        
        ctx.fillStyle = adjustColor(colors.main);
        ctx.strokeStyle = adjustColor(colors.accent);
        
        // Get size for this enemy type (larger sizes)
        const width = type === 'boss' ? 70 : (type === 'special' ? 55 : 48);
        const height = type === 'boss' ? 70 : (type === 'special' ? 55 : 48);
        
        // Create enemy shape based on type
        if (type === 'boss') {
            // More complex, larger boss shape
            this.drawBossShape(ctx, width, height, colors);
        } else if (type === 'special') {
            // Special enemy shape
            this.drawSpecialEnemyShape(ctx, width, height, colors);
        } else {
            // Basic enemy shape
            this.drawBasicEnemyShape(ctx, width, height, colors);
        }
        
        ctx.restore();
        return canvas;
    }
      // Draw enhanced basic enemy shape with more detail and visual diversity
    drawBasicEnemyShape(ctx, width, height, colors) {
        // Generate variation id for this specific enemy (0-3)
        const variationId = Math.floor(Math.random() * 4);
        
        // Base shape with variations
        ctx.beginPath();
        
        if (variationId === 0) {
            // Classic shape with smoother curves
            ctx.moveTo(0, -height/2); // Top center
            ctx.bezierCurveTo(
                width/3, -height/2,
                width/2, -height/3,
                width/2, -height/4
            );
            ctx.lineTo(width/2, height/4);
            ctx.quadraticCurveTo(width/2, height/3, width/3, height/2);
            ctx.lineTo(-width/3, height/2);
            ctx.quadraticCurveTo(-width/2, height/3, -width/2, height/4);
            ctx.lineTo(-width/2, -height/4);
            ctx.bezierCurveTo(
                -width/2, -height/3,
                -width/3, -height/2,
                0, -height/2
            );
        } else if (variationId === 1) {
            // Octagonal variation
            ctx.moveTo(-width/2, -height/4);
            ctx.lineTo(-width/3, -height/2);
            ctx.lineTo(width/3, -height/2);
            ctx.lineTo(width/2, -height/4);
            ctx.lineTo(width/2, height/4);
            ctx.lineTo(width/3, height/2);
            ctx.lineTo(-width/3, height/2);
            ctx.lineTo(-width/2, height/4);
        } else if (variationId === 2) {
            // More circular variation
            ctx.arc(0, 0, width/2, 0, Math.PI * 2);
        } else {
            // Hexagonal variation
            ctx.moveTo(0, -height/2);
            ctx.lineTo(width/2, -height/4);
            ctx.lineTo(width/2, height/4);
            ctx.lineTo(0, height/2);
            ctx.lineTo(-width/2, height/4);
            ctx.lineTo(-width/2, -height/4);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add texture details based on variation
        ctx.lineWidth = 2;
        
        if (variationId === 0 || variationId === 2) {
            // Horizontal stripes for some variations
            ctx.beginPath();
            ctx.moveTo(-width/3, height/6);
            ctx.lineTo(width/3, height/6);
            ctx.stroke();
            
            // Add second line for more detail in circular variation
            if (variationId === 2) {
                ctx.beginPath();
                ctx.moveTo(-width/3, -height/6);
                ctx.lineTo(width/3, -height/6);
                ctx.stroke();
            }
        } else {
            // Cross pattern for other variations
            ctx.beginPath();
            ctx.moveTo(0, -height/3);
            ctx.lineTo(0, height/3);
            ctx.moveTo(-width/3, 0);
            ctx.lineTo(width/3, 0);
            ctx.stroke();
        }
        
        // Eyes with glow effect
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFFFFF';
        
        // Eye positions vary with shape
        const eyeX = variationId === 2 ? width/4 : width/5;
        const eyeY = variationId === 3 ? height/4 : height/5;
        const eyeSize = variationId === 0 ? width/8 : width/9;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils with glowing effect
        ctx.fillStyle = colors.glow;
        ctx.shadowBlur = 8;
        ctx.shadowColor = colors.glow;
        
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width/5, height/5, width/16, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw special enemy shape
    drawSpecialEnemyShape(ctx, width, height, colors) {
        // More angular "special" enemy shape
        ctx.beginPath();
        ctx.moveTo(0, -height/2); // Top point
        ctx.lineTo(width/2, -height/4); // Upper right
        ctx.lineTo(width/2, height/4); // Lower right
        ctx.lineTo(width/4, height/2); // Bottom right
        ctx.lineTo(-width/4, height/2); // Bottom left
        ctx.lineTo(-width/2, height/4); // Lower left
        ctx.lineTo(-width/2, -height/4); // Upper left
        ctx.closePath();
        ctx.fill();
        
        // Decorative patterns
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-width/3, 0);
        ctx.lineTo(width/3, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-width/4, -height/4);
        ctx.lineTo(width/4, -height/4);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFFFFF';
        
        // Left eye - different shape
        ctx.beginPath();
        ctx.ellipse(-width/5, height/6, width/10, width/16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye - different shape
        ctx.beginPath();
        ctx.ellipse(width/5, height/6, width/10, width/16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Antennas
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-width/4, -height/2);
        ctx.lineTo(-width/6, -height/2 - height/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width/4, -height/2);
        ctx.lineTo(width/6, -height/2 - height/3);
        ctx.stroke();
        
        // Antenna tips
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(-width/6, -height/2 - height/3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width/6, -height/2 - height/3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw boss enemy shape
    drawBossShape(ctx, width, height, colors) {
        // Larger, more imposing boss shape
        ctx.beginPath();
        
        // Top arc
        ctx.arc(0, -height/4, width/3, Math.PI, 0, true);
        
        // Right side
        ctx.lineTo(width/2, height/4);
        ctx.quadraticCurveTo(width/2 + width/10, height/3, width/2, height/2);
        
        // Bottom
        ctx.lineTo(-width/2, height/2);
        
        // Left side
        ctx.quadraticCurveTo(-width/2 - width/10, height/3, -width/2, height/4);
        ctx.lineTo(-width/2, -height/4);
        
        ctx.closePath();
        ctx.fill();
        
        // Decorative patterns
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-width/3, height/4);
        ctx.lineTo(width/3, height/4);
        ctx.stroke();
        
        // Add a crown-like structure
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.moveTo(-width/3, -height/3);
        ctx.lineTo(-width/5, -height/2);
        ctx.lineTo(-width/10, -height/3);
        ctx.lineTo(0, -height/2);
        ctx.lineTo(width/10, -height/3);
        ctx.lineTo(width/5, -height/2);
        ctx.lineTo(width/3, -height/3);
        ctx.closePath();
        ctx.fill();
        
        // Eyes - more menacing
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FFFFFF';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(-width/4, 0, width/10, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(width/4, 0, width/10, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils - glowing
        ctx.fillStyle = colors.glow;
        ctx.shadowBlur = 8;
        ctx.shadowColor = colors.glow;
        
        ctx.beginPath();
        ctx.arc(-width/4, 0, width/20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width/4, 0, width/20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Helper function to generate enemy formation with theme
    generateEnemyFormation(level, difficultyParams, entryPaths, theme) {
        // Setup the enemy grid format
        const rows = Math.min(5, 3 + Math.floor(level / 3)); // Increase rows with level
        const cols = Math.min(8, 4 + Math.floor(level / 2)); // Increase columns with level
        
        // Location in screen space for formation
        const gridSpacingX = 50;
        const gridSpacingY = 40;
        const gridOffsetX = (this.game.width - (cols - 1) * gridSpacingX) / 2;
        const gridOffsetY = 80;
        
        let pathIndex = 0;
        
        // Generate enemies in rows and columns with variety
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Determine enemy type and properties based on row and level
                let enemyType, health, points, spriteType, behavior;
                
                if (row === 0) {
                    // Boss enemies on top row
                    enemyType = 'boss';
                    health = difficultyParams.bossHealth;
                    points = 300 * difficultyParams.pointMultiplier;
                    
                    // Add special behaviors for bosses in higher levels
                    if (level >= 5) {
                        behavior = 'aggressive'; // More frequent shooting
                    }
                    if (level >= 8) {
                        behavior = 'teleport'; // Can occasionally teleport
                    }
                } else if (row === 1 && (level >= 3) && (col % 3 === 1)) {
                    // Special enemies in second row (starting from level 3)
                    enemyType = 'special';
                    health = Math.ceil(difficultyParams.enemyHealth * 1.5);
                    points = 200 * difficultyParams.pointMultiplier;
                    
                    // Add special behaviors
                    if (level >= 4) {
                        behavior = 'strafe'; // Move side to side while attacking
                    }
                    if (level >= 7) {
                        behavior = 'dive'; // Occasional diving attacks
                    }
                } else {
                    // Standard enemies in rows below
                    enemyType = 'basic';
                    health = difficultyParams.enemyHealth;
                    points = 100 * difficultyParams.pointMultiplier;
                    
                    // Basic enemies get tougher with level
                    if (level >= 6) {
                        behavior = 'evade'; // Occasionally dodge player shots
                    }
                }
                
                // Get sprite asset for this enemy type from the theme
                spriteType = this.enemyAssets[theme.name][enemyType];
                
                // Calculate grid position
                const formationX = gridOffsetX + col * gridSpacingX;
                const formationY = gridOffsetY + row * gridSpacingY;
                
                // Get an entry path, cycling through available paths
                const entryPath = entryPaths[pathIndex % entryPaths.length];
                pathIndex++;
                
                // Create the enemy with level-specific properties
                const enemy = new Enemy({
                    game: this.game,
                    x: entryPath[0].x,
                    y: entryPath[0].y,
                    formationX: formationX,
                    formationY: formationY,
                    entryPath: entryPath,
                    type: enemyType,
                    sprite: spriteType,
                    points: points,
                    health: health,
                    behavior: behavior,
                    level: level, // Pass level to enemy for possible behavior changes
                    theme: theme.name
                });
                
                this.enemies.push(enemy);
            }
        }
    }
    
    // Create fallback formation with themed enemies
    createFallbackFormation(theme) {
        console.log("Creating fallback formation with theme:", theme.name);
        // Clear any existing enemies
        this.enemies = [];
        
        // Generate assets if not already done
        this.generateEnemyAssetsForTheme(theme);
        
        // Create a simple grid of enemies
        const rows = 2;
        const cols = 3;
        const spacingX = 80;
        const spacingY = 60;
        const startX = (this.game.width - (cols - 1) * spacingX) / 2;
        const startY = 100;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create simpler enemies
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                
                const enemyType = row === 0 ? 'boss' : 'basic';
                const health = row === 0 ? 3 : 1;
                const points = row === 0 ? 300 : 100;
                
                // Create entry path directly from top to formation position
                const entryPath = [
                    { x: x, y: -50 }, // Start off-screen
                    { x: x, y: y }    // End at formation position
                ];
                
                // Get sprite asset for this enemy from the theme
                const spriteType = this.enemyAssets[theme.name][enemyType];
                
                const enemy = new Enemy({
                    game: this.game,
                    x: entryPath[0].x,
                    y: entryPath[0].y,
                    formationX: x,
                    formationY: y,
                    entryPath: entryPath,
                    type: enemyType,
                    sprite: spriteType,
                    points: points,
                    health: health,
                    theme: theme.name
                });
                
                this.enemies.push(enemy);
            }
        }
        
        console.log(`Created ${this.enemies.length} fallback themed enemies`);
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

// Enhanced Enemy class with additional properties and behaviors
class Enemy {
    constructor(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.targetX = options.targetX || this.x;
        this.targetY = options.targetY || this.y;
        this.speed = options.speed || 2;
        this.points = options.points || 100;
        
        // New properties for enhanced enemy system
        this.type = options.type || 'basic';
        this.sprite = options.sprite;
        this.behavior = options.behavior;
        this.level = options.level || 1;
        this.theme = options.theme || 'Classic';
        
        // Behavior timers and states
        this.behaviorTimer = 0;
        this.behaviorState = 'normal';
        this.teleportCooldown = 0;
        this.strafeDir = Math.random() > 0.5 ? 1 : -1;
          // Use the level-specific variation instead of random
        this.subType = options.subType || 0;
        
        // Larger enemies based on type
        if (this.type === 'boss') {
            this.width = options.width || 45; 
            this.height = options.height || 45;
        } else if (this.type === 'special') {
            this.width = options.width || 35;
            this.height = options.height || 35;
        } else {
            this.width = options.width || 30;
            this.height = options.height || 30;
        }
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
        
        // Initialize other parameters
        this.init();
    }
    
    init() {
        // Adjust enemy parameters based on type and level
        if (this.type === 'boss') {
            this.fireRate *= 1.5; // Bosses shoot more often
            this.speed *= 0.9; // Bosses move a bit slower
            this.radius *= 1.2; // Bosses are larger for hitbox
        } else if (this.type === 'special') {
            this.fireRate *= 1.2; // Special enemies shoot somewhat more often
            this.speed *= 1.1; // Special enemies are slightly faster
        }
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
        
        // Apply special behaviors based on enemy type and behavior property
        this.applySpecialBehaviors();
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
    }    tryToShoot() {
        // Reduce base fire rate by 40% to decrease overall bullet count
        if (Math.random() < this.fireRate * 0.6) {
            // Get current level for bullet count scaling
            const currentLevel = this.game.levelManager ? this.game.levelManager.currentLevel : 1;
            
            // Calculate how many bullets to fire based on level (increases gradually but with lower chances)
            // Level 1-5: only single bullets
            // Level 6-10: small chance for double bullets
            // Level 11+: very small chance for triple bullets
            let bulletCount = 1;
            
            if (currentLevel >= 6) {
                // Reduced chance for double bullets, starting at higher levels
                if (Math.random() < (currentLevel - 5) * 0.05) { // Reduced from 0.1 to 0.05
                    bulletCount = 2;
                }
            }
            
            if (currentLevel >= 11) { // Increased from 8 to 11
                // Very small chance for triple bullets
                if (Math.random() < (currentLevel - 10) * 0.025) { // Reduced from 0.05 to 0.025
                    bulletCount = 3;
                }
            }
            
            // Fire the determined number of bullets
            for (let i = 0; i < bulletCount; i++) {
                // Add slight spread for multiple bullets
                const offsetX = bulletCount > 1 ? (i - Math.floor(bulletCount / 2)) * 8 : 0;
                
                // Create bullet using the projectile pool with proper parameters
                this.game.projectilePool.get({
                    game: this.game,
                    x: this.x + offsetX,
                    y: this.y + 20,
                    speed: 5, // Positive speed for downward movement
                    type: 'enemy',
                    isEnemy: true // Explicitly set isEnemy flag
                });
            }
            
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
    
    applySpecialBehaviors() {
        // Skip if in entry path or no special behavior
        if (this.isEnteringFormation || !this.behavior) return;
        
        this.behaviorTimer++;
        
        switch (this.behavior) {
            case 'aggressive':
                // More frequent shooting
                this.fireRate = this.baseFireRate * 1.5;
                break;
                
            case 'teleport':
                // Occasional teleportation
                if (this.teleportCooldown > 0) {
                    this.teleportCooldown--;
                } else if (Math.random() < 0.001) {
                    // Teleport to a nearby position
                    const offsetX = (Math.random() - 0.5) * 100;
                    const offsetY = (Math.random() - 0.5) * 50;
                    this.formationX += offsetX;
                    this.formationY += offsetY;
                    
                    // Keep within screen bounds
                    this.formationX = Math.max(50, Math.min(this.game.width - 50, this.formationX));
                    this.formationY = Math.max(50, Math.min(this.game.height / 2, this.formationY));
                    
                    // Create teleport effect
                    if (this.game.createEffect) {
                        this.game.createEffect('teleport', this.x, this.y);
                    }
                    
                    // Set cooldown
                    this.teleportCooldown = 180; // 3 seconds at 60fps
                }
                break;
                
            case 'strafe':
                // Move side to side while attacking
                if (this.behaviorState === 'normal') {
                    // Small side-to-side movement
                    this.formationX += this.strafeDir;
                    
                    // Reverse direction at edges or randomly
                    if (Math.abs(this.formationX - this.originalFormationX) > 30 || Math.random() < 0.01) {
                        this.strafeDir *= -1;
                    }
                }
                break;
                
            case 'dive':
                // Occasional diving attacks
                if (this.behaviorState === 'normal' && Math.random() < 0.001) {
                    this.behaviorState = 'diving';
                    this.originalX = this.formationX;
                    this.originalY = this.formationY;
                    this.diveStartTime = this.behaviorTimer;
                } else if (this.behaviorState === 'diving') {
                    const diveTime = this.behaviorTimer - this.diveStartTime;
                    if (diveTime < 60) {
                        // Dive down
                        this.formationY += 2;
                    } else if (diveTime < 120) {
                        // Return to formation
                        this.formationX = this.originalX + (this.originalX - this.formationX) * 0.1;
                        this.formationY = this.originalY + (this.originalY - this.formationY) * 0.1;
                    } else {
                        // Reset to normal behavior
                        this.behaviorState = 'normal';
                        this.formationX = this.originalX;
                        this.formationY = this.originalY;
                    }
                }
                break;
                
            case 'evade':
                // Occasionally dodge player shots
                if (this.game.projectilePool && Math.random() < 0.1) {
                    // Check for nearby player projectiles
                    const projectiles = this.game.projectilePool.activeProjectiles;
                    for (let i = 0; i < projectiles.length; i++) {
                        const proj = projectiles[i];
                        if (!proj.isEnemy && 
                            Math.abs(proj.x - this.x) < 50 && 
                            proj.y < this.y && 
                            proj.y > this.y - 100) {
                            
                            // Dodge to the side
                            this.formationX += (proj.x > this.x ? -5 : 5);
                            break;
                        }
                    }
                }
                break;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        // Don't draw if dead or off-screen
        if (this.health <= 0 || 
            this.x < -50 || 
            this.x > this.game.width + 50 ||
            this.y < -50 || 
            this.y > this.game.height + 50) {
            return;
        }
        
        ctx.save();        // Add subtle rotation based on movement
        const rotationAmount = this.state === 'attacking' ? 
            Math.sin(this.game.frameCount * 0.05) * 0.2 : 
            Math.sin(this.game.frameCount * 0.02) * 0.05;
        
        // Apply rotation to create more dynamic movement
        ctx.translate(this.x, this.y);
        ctx.rotate(rotationAmount);
        ctx.translate(-this.x, -this.y);
            
        // Enhanced rendering with animation effects
        if (this.sprite) {
            // More pronounced pulsing size effect for dynamic appearance
            const baseAnimSpeed = this.type === 'boss' ? 0.08 : (this.type === 'special' ? 0.06 : 0.04);
            const pulseAmount = Math.sin(this.animationPhase * baseAnimSpeed) * 0.08;
            
            // Size is based on enemy type and animation state
            let width = this.width * (1 + pulseAmount);
            let height = this.height * (1 + pulseAmount);
            
            // When attacking, make the enemy appear more aggressive with larger size
            if (this.state === 'attacking') {
                width *= 1.1;
                height *= 1.1;
            }
            
            // Add slight wobble when moving
            const wobbleX = this.state !== 'formation' ? Math.sin(this.game.frameCount * 0.2) * 2 : 0;
            
            // Draw with enhanced effects
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.hitTimer > 0 ? '#FFFFFF' : 
                             (this.type === 'boss' ? '#FF00FF' : 
                             (this.type === 'special' ? '#FFFF00' : '#00FFFF'));
            
            // Draw the pre-rendered sprite with effects
            ctx.drawImage(
                this.sprite,
                this.x - width/2 + wobbleX,
                this.y - height/2,
                width,
                height
            );
        } else {
            // Fallback to drawing enemy directly
            // Draw the enemy with appropriate sprite based on type
            if (this.type === 'boss') {
                sprites.bossEnemy.draw(this.game.ctx, this.x, this.y, this.subType, this.hitFlash);
            } else if (this.type === 'dive') {
                sprites.diveEnemy.draw(this.game.ctx, this.x, this.y, this.subType, this.hitFlash);
            } else {
                sprites.basicEnemy.draw(this.game.ctx, this.x, this.y, this.subType, this.hitFlash);
            }
        }
        
        // Enhanced special behavior effects
        if (this.behavior === 'teleport') {
            // Enhanced teleport visual effect with rays
            if (this.teleportCooldown < 20) {
                // Outer glow
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#80FFFF';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * (0.8 + Math.sin(this.behaviorTimer * 0.2) * 0.3), 0, Math.PI * 2);
                ctx.fill();
                
                // Inner bright flash
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw teleport rays
                ctx.globalAlpha = 0.6;
                ctx.strokeStyle = '#80FFFF';
                ctx.lineWidth = 2;
                const rayCount = 8;
                for (let i = 0; i < rayCount; i++) {
                    const angle = (Math.PI * 2 / rayCount) * i + (this.game.frameCount * 0.02);
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    const rayLength = this.width * (0.7 + Math.sin(this.behaviorTimer * 0.2) * 0.3);
                    ctx.lineTo(
                        this.x + Math.cos(angle) * rayLength,
                        this.y + Math.sin(angle) * rayLength
                    );
                    ctx.stroke();
                }
            }
        } else if (this.behavior === 'aggressive') {
            // Aggressive enemies get a red aura
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#FF3030';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.7, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.behavior === 'dive' && this.behaviorState === 'diving') {
            // Dive trails
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#3080FF';
            for (let i = 0; i < 3; i++) {
                const trailDist = i * 10;
                const trailSize = this.width/2 - (i * 5);
                ctx.beginPath();
                ctx.arc(this.x, this.y - trailDist, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Enhanced hit effect
        if (this.hitTimer > 0) {
            // Outer flash
            ctx.globalAlpha = 0.4 + (this.hitTimer/10) * 0.6;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/1.5 + (10 - this.hitTimer), 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1.0;
        }
        
        ctx.restore();
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
