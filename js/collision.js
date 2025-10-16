// ============================================
// COLLISION SYSTEM
// Handles all collision detection
// ============================================

const CollisionSystem = {
    // Simple circle collision
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (r1 + r2);
    },
    
    // Rectangle collision
    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return (
            x1 < x2 + w2 &&
            x1 + w1 > x2 &&
            y1 < y2 + h2 &&
            y1 + h1 > y2
        );
    },
    
    // Point in rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Check bullet vs bullet collision
    checkBulletBulletCollision(bullet1, bullet2, radius = 8) {
        return this.circleCollision(
            bullet1.x, bullet1.y, radius,
            bullet2.x, bullet2.y, radius
        );
    },
    
    // Check bullet vs enemy collision
    checkBulletEnemyCollision(bullet, enemy) {
        const hitRadius = (enemy.w + enemy.h) / 4;
        return this.circleCollision(
            bullet.x, bullet.y, 3,
            enemy.x, enemy.y, hitRadius
        );
    },
    
    // Check bullet vs player collision
    checkBulletPlayerCollision(bullet, player) {
        return this.circleCollision(
            bullet.x, bullet.y, 3,
            player.x, player.y, player.w / 2
        );
    },
    
    // Check enemy vs player collision
    checkEnemyPlayerCollision(enemy, player) {
        return this.circleCollision(
            enemy.x, enemy.y, (enemy.w + enemy.h) / 3,
            player.x, player.y, player.w / 2
        );
    },
    
    // Check powerup vs player collision
    checkPowerupPlayerCollision(powerup, player) {
        return this.circleCollision(
            powerup.x, powerup.y, powerup.w / 2,
            player.x, player.y, player.w / 2
        );
    },
    
    // Comprehensive collision check
    checkAll(gameState, callbacks = {}) {
        const {
            onBulletBulletHit,
            onBulletEnemyHit,
            onBulletPlayerHit,
            onEnemyPlayerHit,
            onPowerupCollected,
            onEnemyDestroyed
        } = callbacks;
        
        // Player bullets vs enemy bullets
        if (onBulletBulletHit) {
            for (let i = gameState.bullets.length - 1; i >= 0; i--) {
                const pBullet = gameState.bullets[i];
                if (pBullet.from !== 'player') continue;
                
                for (let j = gameState.enemyBullets.length - 1; j >= 0; j--) {
                    const eBullet = gameState.enemyBullets[j];
                    if (eBullet.from !== 'enemy') continue;
                    
                    if (this.checkBulletBulletCollision(pBullet, eBullet)) {
                        onBulletBulletHit(i, j, pBullet, eBullet);
                        break;
                    }
                }
            }
        }
        
        // Player bullets vs enemies
        if (onBulletEnemyHit) {
            for (let i = gameState.bullets.length - 1; i >= 0; i--) {
                const bullet = gameState.bullets[i];
                if (bullet.from !== 'player') continue;
                
                for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                    const enemy = gameState.enemies[j];
                    
                    if (this.checkBulletEnemyCollision(bullet, enemy)) {
                        const destroyed = (enemy.hp - 1) <= 0;
                        onBulletEnemyHit(i, j, bullet, enemy, destroyed);
                        
                        if (destroyed && onEnemyDestroyed) {
                            onEnemyDestroyed(enemy);
                        }
                        break;
                    }
                }
            }
        }
        
        // Enemy bullets vs player
        if (onBulletPlayerHit && gameState.player.alive) {
            for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = gameState.enemyBullets[i];
                if (bullet.from !== 'enemy') continue;
                
                if (this.checkBulletPlayerCollision(bullet, gameState.player)) {
                    onBulletPlayerHit(i, bullet);
                }
            }
        }
        
        // Enemies vs player
        if (onEnemyPlayerHit && gameState.player.alive) {
            for (let i = 0; i < gameState.enemies.length; i++) {
                const enemy = gameState.enemies[i];
                
                if (this.checkEnemyPlayerCollision(enemy, gameState.player)) {
                    if (!gameState.player.shield) {
                        onEnemyPlayerHit(enemy);
                    }
                }
            }
        }
        
        // Powerups vs player
        if (onPowerupCollected) {
            for (let i = gameState.powerups.length - 1; i >= 0; i--) {
                const powerup = gameState.powerups[i];
                
                if (this.checkPowerupPlayerCollision(powerup, gameState.player)) {
                    onPowerupCollected(i, powerup);
                }
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSystem;
}
