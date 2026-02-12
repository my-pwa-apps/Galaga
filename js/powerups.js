// ============================================
// POWERUP MANAGEMENT SYSTEM
// Powerup types, effects, spawning
// ============================================

const PowerupManager = {
    types: ['double', 'speed', 'shield', 'health'],
    spawnTimer: 0,
    spawnInterval: 15,
    
    // Initialize powerup manager
    init() {
        // Powerup Manager ready
        return this;
    },
    
    // Update powerup spawning
    update(dt, gameState) {
        this.spawnTimer += dt;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnRandom(gameState);
            this.spawnTimer = 0;
        }
        
        // Update powerup positions (iterate backward for safe splicing)
        for (let i = gameState.powerups.length - 1; i >= 0; i--) {
            const powerup = gameState.powerups[i];
            powerup.y += 50 * dt; // Fall speed
            powerup.rotation = (powerup.rotation || 0) + dt * 2;
            
            // Remove if off-screen
            if (powerup.y > GameConfig.CANVAS_HEIGHT + 50) {
                gameState.powerups.splice(i, 1);
            }
        }
    },
    
    // Spawn random powerup
    spawnRandom(gameState) {
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        
        gameState.powerups.push({
            type,
            x: Math.random() * (GameConfig.CANVAS_WIDTH - 40) + 20,
            y: -20,
            w: 16,
            h: 16,
            rotation: 0
        });
    },
    
    // Spawn specific powerup at location
    spawn(type, x, y, gameState) {
        if (!this.types.includes(type)) {
            console.warn(`Unknown powerup type: ${type}`);
            return;
        }
        
        gameState.powerups.push({
            type,
            x,
            y,
            w: 16,
            h: 16,
            rotation: 0
        });
    },
    
    // Apply powerup effect to player
    apply(powerup, gameState) {
        const player = gameState.player;
        
        switch (powerup.type) {
            case 'double':
                player.power = 'double';
                player.powerTimer = 10; // 10 seconds
                debugLog('Double shot activated');
                break;
                
            case 'speed':
                player.power = 'rapid';
                player.powerTimer = 8; // 8 seconds
                debugLog('Rapid fire activated');
                break;
                
            case 'shield':
                player.shield = true;
                player.powerTimer = 12; // 12 seconds
                debugLog('Shield activated');
                break;
                
            case 'health':
                gameState.lives = Math.min(gameState.lives + 1, 5);
                debugLog('Extra life');
                break;
        }
        
        // Track collection
        if (gameState.stats) {
            gameState.stats.powerupsCollected++;
        }
        
        // Play sound
        if (AudioEngine && AudioEngine.powerup) {
            AudioEngine.powerup();
        }
    },
    
    // Update powerup timers
    updateTimers(dt, gameState) {
        const player = gameState.player;
        
        if (player.powerTimer > 0) {
            player.powerTimer -= dt;
            
            if (player.powerTimer <= 0) {
                // Powerup expired
                if (player.power === 'double' || player.power === 'rapid') {
                    player.power = 'normal';
                    debugLog('Powerup expired');
                }
                if (player.shield) {
                    player.shield = false;
                    debugLog('Shield expired');
                }
                player.powerTimer = 0;
            }
        }
    },
    
    // Draw all powerups
    draw(ctx, gameState, time) {
        gameState.powerups.forEach(powerup => {
            ctx.save();
            ctx.translate(powerup.x, powerup.y);
            ctx.rotate(time * 2);
            
            switch (powerup.type) {
                case 'double':
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('x2', 0, 0);
                    break;
                    
                case 'speed':
                    ctx.fillStyle = '#ffff00';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('>>', 0, 0);
                    break;
                    
                case 'shield':
                    ctx.fillStyle = '#00ffff';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('S', 0, 0);
                    break;
                    
                case 'health':
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('+', 0, 0);
                    break;
            }
            
            ctx.restore();
        });
    },
    
    // Draw powerup indicator on HUD
    drawIndicator(ctx, gameState) {
        const player = gameState.player;
        
        if (player.powerTimer > 0) {
            const x = 10;
            const y = 80;
            const barWidth = 100;
            const barHeight = 8;
            
            // Determine powerup type and color
            let label = '';
            let color = '#ffffff';
            
            if (player.power === 'double') {
                label = 'DOUBLE SHOT';
                color = '#00ff00';
            } else if (player.power === 'rapid') {
                label = 'RAPID FIRE';
                color = '#ffff00';
            } else if (player.shield) {
                label = 'SHIELD';
                color = '#00ffff';
            }
            
            // Draw label
            ctx.fillStyle = color;
            ctx.font = '10px monospace';
            ctx.fillText(label, x, y);
            
            // Draw timer bar
            const timerPercent = Math.min(player.powerTimer / 12, 1); // Max 12 seconds
            ctx.strokeStyle = color;
            ctx.strokeRect(x, y + 4, barWidth, barHeight);
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 4, barWidth * timerPercent, barHeight);
        }
    },
    
    // Reset powerup manager
    reset() {
        this.spawnTimer = 0;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerupManager;
}
