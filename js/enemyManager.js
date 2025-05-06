class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.enemyTypes = [
            'basic',        // Basic enemy
            'advanced',     // Advanced enemy
            'boss',         // Boss enemy
            'octopus',      // Octopus enemy with tentacles
            'spinner',      // Spinning enemy
            'guardian'      // Guardian enemy
        ];
        this.enemySizes = {
            basic: { width: 35, height: 35, scale: 1.15 },
            advanced: { width: 40, height: 40, scale: 1.15 },
            boss: { width: 60, height: 50, scale: 1.15 },
            octopus: { width: 50, height: 55, scale: 1.15 },
            spinner: { width: 45, height: 45, scale: 1.15 },
            guardian: { width: 42, height: 48, scale: 1.15 }
        };
        
        // Tentacle animation variables for octopus enemy
        this.tentacleFrame = 0;
        this.tentacleMaxFrames = 60; // Animation cycle length
        this.tentacleAnimSpeed = 1; // Update every frame
        
        // Color palettes for enemies
        this.colorPalettes = {
            basic: ['#FF5555', '#FF3333', '#FF0000', '#CC0000'],
            advanced: ['#55FF55', '#33FF33', '#00FF00', '#00CC00'],
            boss: ['#FF55FF', '#FF33FF', '#FF00FF', '#CC00CC'],
            octopus: ['#5555FF', '#3333FF', '#0000FF', '#0000CC'],
            spinner: ['#FFFF55', '#FFFF33', '#FFFF00', '#CCCC00'],
            guardian: ['#55FFFF', '#33FFFF', '#00FFFF', '#00CCCC']
        };
    }
    
    createEnemy(type, x, y, pattern = 'sine') {
        // Enhanced enemy creation with more diverse behaviors
        const enemySize = this.enemySizes[type] || this.enemySizes.basic;
        
        const enemy = {
            type: type,
            x: x,
            y: y,
            width: enemySize.width,
            height: enemySize.height,
            radius: Math.max(enemySize.width, enemySize.height) / 2.5,
            scale: enemySize.scale,
            health: type === 'boss' ? 5 : (type === 'octopus' || type === 'guardian') ? 3 : 1,
            points: type === 'boss' ? 300 : (type === 'octopus') ? 200 : (type === 'advanced' || type === 'spinner' || type === 'guardian') ? 150 : 100,
            speed: type === 'boss' ? 2 : (type === 'spinner') ? 3.5 : (type === 'basic') ? 3 : 2.5,
            pattern: pattern,
            active: true,
            patternParams: {
                amplitude: 80 + Math.random() * 40,
                period: 100 + Math.random() * 100,
                phase: Math.random() * Math.PI * 2
            },
            fireRate: type === 'boss' ? 0.01 : (type === 'octopus') ? 0.008 : (type === 'advanced' || type === 'guardian') ? 0.006 : 0.004,
            lastShot: 0,
            colorPalette: this.colorPalettes[type],
            rotationAngle: 0,
            // Special properties for specific enemy types
            tentaclePhase: type === 'octopus' ? Math.random() * Math.PI * 2 : 0,
            spinSpeed: type === 'spinner' ? 0.05 + Math.random() * 0.05 : 0
        };
        
        this.enemies.push(enemy);
        return enemy;
    }
    
    update() {
        // Update tentacle animation frame
        this.tentacleFrame = (this.tentacleFrame + this.tentacleAnimSpeed) % this.tentacleMaxFrames;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Update enemy position based on pattern
            this.updateEnemyPosition(enemy);
            
            // Handle enemy firing
            if (Math.random() < enemy.fireRate && this.game.player.active) {
                this.enemyFire(enemy);
            }
            
            // Special behavior for specific enemy types
            if (enemy.type === 'spinner') {
                enemy.rotationAngle += enemy.spinSpeed;
            }
            
            // Remove enemies that have moved off screen
            if (enemy.y > this.game.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateEnemyPosition(enemy) {
        switch(enemy.pattern) {
            case 'sine':
                enemy.y += enemy.speed;
                enemy.x += Math.sin(enemy.y / enemy.patternParams.period + enemy.patternParams.phase) * 2;
                break;
            case 'zigzag':
                enemy.y += enemy.speed;
                if (Math.floor(enemy.y / 30) % 2 === 0) {
                    enemy.x += enemy.speed * 0.5;
                } else {
                    enemy.x -= enemy.speed * 0.5;
                }
                break;
            case 'circle':
                enemy.y += enemy.speed * 0.7;
                enemy.x += Math.sin(enemy.y / 50) * 3;
                break;
            case 'dive':
                enemy.y += enemy.speed * 1.5;
                break;
            default:
                enemy.y += enemy.speed;
        }
    }
    
    enemyFire(enemy) {
        // Different projectile patterns based on enemy type
        switch(enemy.type) {
            case 'boss':
                // Boss fires 3 shots in a spread
                this.game.projectilePool.get(enemy.x, enemy.y + enemy.height/2, 0, 5, true);
                this.game.projectilePool.get(enemy.x - 15, enemy.y + enemy.height/2, -1, 5, true);
                this.game.projectilePool.get(enemy.x + 15, enemy.y + enemy.height/2, 1, 5, true);
                break;
            case 'octopus':
                // Octopus fires in a wave pattern
                this.game.projectilePool.get(enemy.x - 10, enemy.y + enemy.height/2, -0.5, 4, true);
                this.game.projectilePool.get(enemy.x + 10, enemy.y + enemy.height/2, 0.5, 4, true);
                break;
            case 'guardian':
                // Guardian fires a tracking shot that follows the player
                const dx = this.game.player.x - enemy.x;
                const dy = this.game.player.y - enemy.y;
                const angle = Math.atan2(dy, dx);
                const vx = Math.cos(angle) * 2;
                this.game.projectilePool.get(enemy.x, enemy.y + enemy.height/2, vx, 4, true);
                break;
            default:
                // Standard single shot
                this.game.projectilePool.get(enemy.x, enemy.y + enemy.height/2, 0, 4, true);
        }
        
        // Play enemy shooting sound
        if (window.audioManager) {
            window.audioManager.play('enemyShoot', 0.15);
        }
    }
    
    draw() {
        this.enemies.forEach(enemy => {
            // Save context before transformations
            this.game.ctx.save();
            
            // Move to enemy position and apply rotation if needed
            this.game.ctx.translate(enemy.x, enemy.y);
            if (enemy.type === 'spinner') {
                this.game.ctx.rotate(enemy.rotationAngle);
            }
            
            // Draw the appropriate enemy type
            switch(enemy.type) {
                case 'basic':
                    this.drawBasicEnemy(enemy);
                    break;
                case 'advanced':
                    this.drawAdvancedEnemy(enemy);
                    break;
                case 'boss':
                    this.drawBossEnemy(enemy);
                    break;
                case 'octopus':
                    this.drawOctopusEnemy(enemy);
                    break;
                case 'spinner':
                    this.drawSpinnerEnemy(enemy);
                    break;
                case 'guardian':
                    this.drawGuardianEnemy(enemy);
                    break;
                default:
                    this.drawBasicEnemy(enemy);
            }
            
            // Restore context
            this.game.ctx.restore();
            
            // Draw enemy health bar for boss and special enemies
            if (enemy.health > 1) {
                const maxHealth = enemy.type === 'boss' ? 5 : 3;
                const healthPercent = enemy.health / maxHealth;
                const barWidth = enemy.width;
                const barHeight = 4;
                
                // Health bar background
                this.game.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.game.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 10, barWidth, barHeight);
                
                // Health bar fill
                this.game.ctx.fillStyle = enemy.health > maxHealth/2 ? 'lime' : 'yellow';
                this.game.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 10, barWidth * healthPercent, barHeight);
            }
        });
    }
    
    drawBasicEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw triangular ship
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(0, -h/2);
        this.game.ctx.lineTo(-w/2, h/3);
        this.game.ctx.lineTo(w/2, h/3);
        this.game.ctx.closePath();
        
        // Fill with gradient
        const gradient = this.game.ctx.createLinearGradient(0, -h/2, 0, h/3);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[2]);
        this.game.ctx.fillStyle = gradient;
        this.game.ctx.fill();
        
        // Add details
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-w/4, 0);
        this.game.ctx.lineTo(w/4, 0);
        this.game.ctx.lineTo(0, h/3);
        this.game.ctx.closePath();
        this.game.ctx.fillStyle = colors[3];
        this.game.ctx.fill();
        
        // Add cockpit
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, -h/6, w/6, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[1];
        this.game.ctx.fill();
    }
    
    drawAdvancedEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw main body (rounded rectangle)
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-w/2 + w/10, -h/2);
        this.game.ctx.lineTo(w/2 - w/10, -h/2);
        this.game.ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + h/10);
        this.game.ctx.lineTo(w/2, h/2 - h/10);
        this.game.ctx.quadraticCurveTo(w/2, h/2, w/2 - w/10, h/2);
        this.game.ctx.lineTo(-w/2 + w/10, h/2);
        this.game.ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - h/10);
        this.game.ctx.lineTo(-w/2, -h/2 + h/10);
        this.game.ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + w/10, -h/2);
        this.game.ctx.closePath();
        
        // Fill with gradient
        const gradient = this.game.ctx.createRadialGradient(0, 0, w/10, 0, 0, w/2);
        gradient.addColorStop(0, colors[1]);
        gradient.addColorStop(0.7, colors[0]);
        gradient.addColorStop(1, colors[3]);
        this.game.ctx.fillStyle = gradient;
        this.game.ctx.fill();
        
        // Draw wings
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-w/3, -h/6);
        this.game.ctx.lineTo(-w*0.7, 0);
        this.game.ctx.lineTo(-w/3, h/6);
        this.game.ctx.moveTo(w/3, -h/6);
        this.game.ctx.lineTo(w*0.7, 0);
        this.game.ctx.lineTo(w/3, h/6);
        this.game.ctx.strokeStyle = colors[2];
        this.game.ctx.lineWidth = 3;
        this.game.ctx.stroke();
        
        // Draw center detail
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/5, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[2];
        this.game.ctx.fill();
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/8, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[1];
        this.game.ctx.fill();
    }
    
    drawBossEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw main body (large oval)
        this.game.ctx.beginPath();
        this.game.ctx.ellipse(0, 0, w/2, h/3, 0, 0, Math.PI * 2);
        
        // Fill with gradient
        const gradient = this.game.ctx.createRadialGradient(0, 0, w/10, 0, 0, w/2);
        gradient.addColorStop(0, colors[1]);
        gradient.addColorStop(0.6, colors[0]);
        gradient.addColorStop(1, colors[3]);
        this.game.ctx.fillStyle = gradient;
        this.game.ctx.fill();
        
        // Draw top section
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-w/4, -h/3);
        this.game.ctx.lineTo(-w/3, -h/2);
        this.game.ctx.lineTo(w/3, -h/2);
        this.game.ctx.lineTo(w/4, -h/3);
        this.game.ctx.closePath();
        this.game.ctx.fillStyle = colors[2];
        this.game.ctx.fill();
        
        // Draw bottom section
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-w/4, h/3);
        this.game.ctx.lineTo(-w/3, h/2);
        this.game.ctx.lineTo(w/3, h/2);
        this.game.ctx.lineTo(w/4, h/3);
        this.game.ctx.closePath();
        this.game.ctx.fillStyle = colors[2];
        this.game.ctx.fill();
        
        // Draw center details - "eyes"
        this.game.ctx.beginPath();
        this.game.ctx.arc(-w/6, -h/10, w/10, 0, Math.PI * 2);
        this.game.ctx.arc(w/6, -h/10, w/10, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[1];
        this.game.ctx.fill();
        
        // Draw weapon ports
        this.game.ctx.beginPath();
        this.game.ctx.rect(-w/4, h/6, w/8, h/8);
        this.game.ctx.rect(w/4 - w/8, h/6, w/8, h/8);
        this.game.ctx.fillStyle = '#000';
        this.game.ctx.fill();
        this.game.ctx.strokeStyle = colors[1];
        this.game.ctx.lineWidth = 2;
        this.game.ctx.stroke();
    }
    
    drawOctopusEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw head (dome shape)
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, -h/6, w/2.5, Math.PI, 0);
        this.game.ctx.lineTo(w/2.5, h/6);
        this.game.ctx.quadraticCurveTo(0, h/3, -w/2.5, h/6);
        this.game.ctx.closePath();
        
        // Fill with gradient
        const gradient = this.game.ctx.createRadialGradient(0, -h/8, w/10, 0, -h/8, w/2);
        gradient.addColorStop(0, colors[1]);
        gradient.addColorStop(0.7, colors[0]);
        gradient.addColorStop(1, colors[3]);
        this.game.ctx.fillStyle = gradient;
        this.game.ctx.fill();
        
        // Draw eyes
        this.game.ctx.beginPath();
        this.game.ctx.arc(-w/6, -h/6, w/10, 0, Math.PI * 2);
        this.game.ctx.arc(w/6, -h/6, w/10, 0, Math.PI * 2);
        this.game.ctx.fillStyle = 'white';
        this.game.ctx.fill();
        
        // Draw pupils - follow player for creepy effect
        const playerDir = Math.atan2(
            this.game.player.y - (enemy.y - h/6),
            this.game.player.x - enemy.x
        );
        const eyeRadius = w/10;
        const pupilDistance = eyeRadius * 0.5;
        
        this.game.ctx.beginPath();
        this.game.ctx.arc(
            -w/6 + Math.cos(playerDir) * pupilDistance, 
            -h/6 + Math.sin(playerDir) * pupilDistance, 
            w/20, 0, Math.PI * 2
        );
        this.game.ctx.arc(
            w/6 + Math.cos(playerDir) * pupilDistance, 
            -h/6 + Math.sin(playerDir) * pupilDistance, 
            w/20, 0, Math.PI * 2
        );
        this.game.ctx.fillStyle = 'black';
        this.game.ctx.fill();
        
        // Draw animated tentacles
        this.drawOctopusTentacles(enemy, w, h, colors);
    }
    
    drawOctopusTentacles(enemy, w, h, colors) {
        // Draw 8 animated tentacles
        const numTentacles = 8;
        const baseWidth = w/20;
        const tentacleLength = h/2;
        const phase = this.tentacleFrame / this.tentacleMaxFrames * Math.PI * 2;
        
        for (let i = 0; i < numTentacles; i++) {
            const angle = (i / numTentacles) * Math.PI * 2;
            const wavePhase = phase + enemy.tentaclePhase + angle;
            
            this.game.ctx.beginPath();
            this.game.ctx.moveTo(
                Math.cos(angle) * w/4,
                h/6
            );
            
            // Create a wavy tentacle using quadratic curves
            for (let j = 0; j < 3; j++) {
                const segment = j / 3;
                const nextSegment = (j + 1) / 3;
                
                // Control point offset perpendicular to tentacle
                const waveAmplitude = w/8 * (1 - segment); // Waves are smaller toward the tip
                const waveOffset = Math.sin(wavePhase + j) * waveAmplitude;
                
                const perpX = Math.sin(angle) * waveOffset;
                const perpY = -Math.cos(angle) * waveOffset;
                
                // End points of each segment
                const endX = Math.cos(angle) * w/4 * (1 - nextSegment * 0.5) + Math.sin(angle) * waveOffset * 0.5;
                const endY = h/6 + tentacleLength * nextSegment;
                
                // Control point
                const ctrlX = Math.cos(angle) * w/4 * (1 - segment * 0.75) + perpX;
                const ctrlY = h/6 + tentacleLength * segment + perpY;
                
                this.game.ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            }
            
            // Vary tentacle width based on segment
            const gradient = this.game.ctx.createLinearGradient(0, h/6, 0, h/6 + tentacleLength);
            gradient.addColorStop(0, colors[2]);
            gradient.addColorStop(0.7, colors[0]);
            gradient.addColorStop(1, colors[3]);
            
            this.game.ctx.lineWidth = baseWidth * (1.2 - i % 2 * 0.4); // Vary thickness between tentacles
            this.game.ctx.strokeStyle = gradient;
            this.game.ctx.lineCap = 'round';
            this.game.ctx.stroke();
            
            // Draw suction cups on every other tentacle
            if (i % 2 === 0) {
                const cupCount = 3;
                for (let j = 1; j <= cupCount; j++) {
                    const segment = j / (cupCount + 1);
                    const waveOffset = Math.sin(wavePhase + j) * (w/10) * (1 - segment);
                    
                    const cupX = Math.cos(angle) * w/4 * (1 - segment * 0.5) + Math.sin(angle) * waveOffset;
                    const cupY = h/6 + tentacleLength * segment;
                    
                    // Draw suction cup
                    this.game.ctx.beginPath();
                    this.game.ctx.arc(cupX, cupY, baseWidth * (0.8 - segment * 0.3), 0, Math.PI * 2);
                    this.game.ctx.fillStyle = colors[1];
                    this.game.ctx.fill();
                }
            }
        }
    }
    
    drawSpinnerEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw spinning outer ring
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/2, 0, Math.PI * 2);
        this.game.ctx.arc(0, 0, w/2.5, 0, Math.PI * 2, true);
        this.game.ctx.closePath();
        
        // Fill with gradient
        const outerGradient = this.game.ctx.createRadialGradient(0, 0, w/3, 0, 0, w/2);
        outerGradient.addColorStop(0, colors[0]);
        outerGradient.addColorStop(1, colors[2]);
        this.game.ctx.fillStyle = outerGradient;
        this.game.ctx.fill();
        
        // Draw blade decorations on the ring
        const bladeCount = 6;
        for (let i = 0; i < bladeCount; i++) {
            const angle = (i / bladeCount) * Math.PI * 2;
            
            this.game.ctx.save();
            this.game.ctx.rotate(angle);
            
            this.game.ctx.beginPath();
            this.game.ctx.moveTo(0, -w/2.5);
            this.game.ctx.lineTo(w/10, -w/2);
            this.game.ctx.lineTo(-w/10, -w/2);
            this.game.ctx.closePath();
            
            this.game.ctx.fillStyle = colors[1];
            this.game.ctx.fill();
            
            this.game.ctx.restore();
        }
        
        // Draw inner core
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/4, 0, Math.PI * 2);
        
        // Core gradient
        const coreGradient = this.game.ctx.createRadialGradient(0, 0, w/10, 0, 0, w/4);
        coreGradient.addColorStop(0, colors[1]);
        coreGradient.addColorStop(0.7, colors[3]);
        coreGradient.addColorStop(1, colors[0]);
        this.game.ctx.fillStyle = coreGradient;
        this.game.ctx.fill();
        
        // Draw center detail
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/8, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[2];
        this.game.ctx.fill();
    }
    
    drawGuardianEnemy(enemy) {
        const w = enemy.width * enemy.scale;
        const h = enemy.height * enemy.scale;
        const colors = enemy.colorPalette;
        
        // Draw shield shape
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(0, -h/2);
        this.game.ctx.quadraticCurveTo(w/2, -h/3, w/2, 0);
        this.game.ctx.quadraticCurveTo(w/2, h/3, 0, h/2);
        this.game.ctx.quadraticCurveTo(-w/2, h/3, -w/2, 0);
        this.game.ctx.quadraticCurveTo(-w/2, -h/3, 0, -h/2);
        this.game.ctx.closePath();
        
        // Fill with gradient
        const gradient = this.game.ctx.createRadialGradient(0, 0, w/10, 0, 0, w/1.5);
        gradient.addColorStop(0, colors[1]);
        gradient.addColorStop(0.6, colors[0]);
        gradient.addColorStop(1, colors[3]);
        this.game.ctx.fillStyle = gradient;
        this.game.ctx.fill();
        
        // Draw shield details - circular pattern
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/3, 0, Math.PI * 2);
        this.game.ctx.strokeStyle = colors[2];
        this.game.ctx.lineWidth = 3;
        this.game.ctx.stroke();
        
        // Draw segments
        const segments = 6;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            this.game.ctx.beginPath();
            this.game.ctx.moveTo(0, 0);
            this.game.ctx.lineTo(
                Math.cos(angle) * w/2.5,
                Math.sin(angle) * w/2.5
            );
            this.game.ctx.strokeStyle = colors[2];
            this.game.ctx.lineWidth = 2;
            this.game.ctx.stroke();
        }
        
        // Draw center core
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/6, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[1];
        this.game.ctx.fill();
        
        // Draw eye
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, w/12, 0, Math.PI * 2);
        this.game.ctx.fillStyle = colors[3];
        this.game.ctx.fill();
    }
    
    // Method to clear all enemies
    clearEnemies() {
        this.enemies = [];
    }
}
