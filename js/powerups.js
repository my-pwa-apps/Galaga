// Power-up system for Galaga game

class PowerUp {
    constructor(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = 40; // Increased size (was 30)
        this.height = 40;
        this.radius = 20; // Increased radius (was 15)
        this.speed = 1; // Slowed down for visibility (was 1.5)
        this.type = options.type || this.getRandomType();
        this.color = this.getColorForType();
        this.active = true;
        this.pulsePhase = 0;
        this.rotationAngle = 0;
        this.collectSound = new Audio('data:audio/wav;base64,UklGRpYEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXIEAACBhYqFbF1fdJOnp1ogAAAsWICgjTsAAAAAABIwfLDd5nhFNAAAgKPM3dy1h10AAAAASnOMnXQ0AAAAAAAAVZbP7a1lQjkAAEKczO3cgU8AAAAAAEB9utDckFAvAAAAACZdrf//ulAvAAAAAABZos7oejkAAAAAAAAkTJK+mlElAAAAGzh8ye+zNgAAAAAAR5XAvlYOAAAAAAA3aoLWrBwAAAAAAAADD1mKj00tCwkJExROha6usViGqrWwoHj/');
        this.collectSound.volume = 0.3;
        
        // Create a trail of particles
        this.particles = [];
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x,
                y: this.y + (i * 5),
                size: 5 - (i * 0.4),
                alpha: 1 - (i * 0.1)
            });
        }
    }

    getRandomType() {
        const types = ['rapid-fire', 'shield', 'extra-life', 'double-shot', 'speed-boost', 'multi-shot', 'bomb'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getColorForType() {
        switch (this.type) {
            case 'rapid-fire': return '#FF0000'; // Red
            case 'shield': return '#00FFFF'; // Cyan
            case 'extra-life': return '#00FF00'; // Green
            case 'double-shot': return '#FFFF00'; // Yellow
            case 'speed-boost': return '#FF00FF'; // Magenta
            case 'multi-shot': return '#FFA500'; // Orange
            case 'bomb': return '#8A2BE2'; // Blue Violet
            default: return '#FFFFFF'; // White
        }
    }

    update() {
        // Update position
        this.y += this.speed;
        this.pulsePhase = (this.pulsePhase + 0.1) % (Math.PI * 2);
        this.rotationAngle += 0.05;
        
        // Update particle trail
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (i === 0) {
                this.particles[i].x = this.x;
                this.particles[i].y = this.y;
            } else {
                // Make particles follow the previous particle
                this.particles[i].x = this.particles[i-1].x;
                this.particles[i].y = this.particles[i-1].y;
            }
        }
        
        // Remove if out of screen
        if (this.y > this.game.height + 30) {
            return true;
        }
        
        return false;
    }

    draw() {
        const ctx = this.game.ctx;
        
        // Draw particle trail first (behind power-up)
        this.drawParticleTrail(ctx);
        
        const pulseFactor = 0.2 * Math.sin(this.pulsePhase) + 1.1;
        const size = this.radius * pulseFactor;
        
        ctx.save();
        
        // Apply rotation
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        
        // Stronger glow effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        
        // Draw the power-up shape
        ctx.fillStyle = this.color;
        
        // Draw different shapes based on power-up type
        switch(this.type) {
            case 'rapid-fire':
                this.drawStar(ctx, 0, 0, size, 5);
                break;
            case 'shield':
                this.drawShield(ctx, 0, 0, size);
                break;
            case 'extra-life':
                this.drawHeart(ctx, 0, 0, size);
                break;
            case 'double-shot':
                this.drawDiamond(ctx, 0, 0, size);
                break;
            case 'speed-boost':
                this.drawLightning(ctx, 0, 0, size);
                break;
            case 'multi-shot':
                this.drawMultiShot(ctx, 0, 0, size);
                break;
            case 'bomb':
                this.drawBomb(ctx, 0, 0, size);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
        }
        
        // Highlight effect
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(-size/3, -size/3, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw attention circle
        this.drawAttentionCircle(ctx);
    }
    
    drawParticleTrail(ctx) {
        // Draw trail particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    drawAttentionCircle(ctx) {
        // Draw an expanding circle around the power-up
        const pulseSize = this.radius * 2 * (1 + Math.sin(this.pulsePhase) * 0.3);
        
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.5 - (0.3 * Math.sin(this.pulsePhase));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    // Various drawing functions for different power-up shapes
    drawStar(ctx, x, y, size, points = 5) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? size : size/2;
            const angle = (i * Math.PI) / points;
            const xPoint = x + radius * Math.sin(angle);
            const yPoint = y + radius * Math.cos(angle);
            
            if (i === 0) {
                ctx.moveTo(xPoint, yPoint);
            } else {
                ctx.lineTo(xPoint, yPoint);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
    
    drawShield(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x + size, y - size);
        ctx.lineTo(x, y);
        ctx.fill();
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + size/2);
        ctx.bezierCurveTo(
            x, y, 
            x - size, y, 
            x - size, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x - size, y + size, 
            x, y + size, 
            x, y + size/2
        );
        ctx.bezierCurveTo(
            x, y + size, 
            x + size, y + size, 
            x + size, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x + size, y, 
            x, y, 
            x, y + size/2
        );
        ctx.fill();
    }
    
    drawDiamond(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
    }
    
    drawLightning(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x - size/2, y - size);
        ctx.lineTo(x + size/4, y - size/4);
        ctx.lineTo(x - size/4, y + size/4);
        ctx.lineTo(x + size/2, y + size);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
    }
    
    drawMultiShot(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x, y - size);
        ctx.closePath();
        ctx.fill();
    }
    
    drawBomb(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    apply(player) {
        if (window.audioManager) {
            window.audioManager.play('powerUp', 0.7);
        }
        
        let duration = 0;
        
        switch(this.type) {
            case 'rapid-fire':
                player.maxShootCooldown = 5;
                duration = 600; // 10 seconds at 60fps
                player.activePower = 'RAPID FIRE';
                break;
            case 'shield':
                player.shield = true;
                player.shieldHealth = 3;
                player.activePower = 'SHIELD';
                duration = 900; // 15 seconds at 60fps - longer than other power-ups
                break;
            case 'extra-life':
                player.lives++;
                document.getElementById('lives').textContent = player.lives;
                player.activePower = '+1 LIFE';
                // Extra life is instant, no timer needed
                break;
            case 'double-shot':
                player.doubleShot = true;
                duration = 600; // 10 seconds at 60fps
                player.activePower = 'DOUBLE SHOT';
                break;
            case 'speed-boost':
                player.speed = 8;
                duration = 600; // 10 seconds at 60fps
                player.activePower = 'SPEED BOOST';
                break;
            case 'multi-shot':
                player.multiShot = true;
                duration = 450; // 7.5 seconds at 60fps
                player.activePower = 'MULTI SHOT';
                break;
            case 'bomb':
                // Clear all enemies on screen
                this.detonateScreenBomb();
                player.activePower = 'SCREEN BOMB';
                // Bomb is instant, no timer needed
                break;
        }
        
        // Set the power-up timer and initial duration
        if (duration > 0) {
            player.powerUpTimer = duration;
            player.initialPowerUpTimer = duration; // Store initial duration for calculating percentage
        }
        
        document.getElementById('active-power').textContent = player.activePower;
        
        // Show power-up notification
        const notification = document.getElementById('powerup-notification');
        notification.textContent = `${this.type.toUpperCase()} ACTIVATED!`;
        notification.classList.remove('hidden');
        
        // Hide the notification after 2 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 2000);
        
        // Visual flash effect on pickup
        this.createPickupEffect();
    }
    
    createPickupEffect() {
        // Create a visual flash effect when collecting a power-up
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = this.color;
        flash.style.opacity = '0.3';
        flash.style.zIndex = '100';
        flash.style.pointerEvents = 'none';
        
        document.querySelector('.game-container').appendChild(flash);
        
        // Fade out and remove
        setTimeout(() => {
            flash.style.transition = 'opacity 0.5s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        }, 50);
    }
    
    // Also add the missing detonateScreenBomb method if it doesn't exist
    detonateScreenBomb() {
        // Create explosion at each enemy position
        for (let enemy of this.game.enemyManager.enemies) {
            this.game.createExplosion(enemy.x, enemy.y, enemy.radius * 1.5, 30);
        }
        
        // Add score for each enemy
        if (this.game.enemyManager.enemies.length > 0) {
            const totalScore = this.game.enemyManager.enemies.reduce((sum, enemy) => sum + enemy.points, 0);
            this.game.score += totalScore;
            document.getElementById('score').textContent = this.game.score;
        }
        
        // Clear all enemies
        this.game.enemyManager.enemies = [];
        
        // Big explosion in center of screen
        this.game.createExplosion(this.game.width / 2, this.game.height / 2, 200, 90);
    }
}

class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];
        this.dropChance = 0.1; // Increased from 0.02 to 0.1 (10% chance)
        this.lastDropTime = 0;
        this.minDropInterval = 120; // Decreased from 300 to 120
        this.guaranteedDropKillCount = 15; // Decreased from 20 to 15
        this.enemiesDestroyedSinceDrop = 0;
        this.levelStartPowerUp = true; // Enable automatic level-start power-up
    }
    
    update() {
        // Update existing power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.update() || !powerUp.active) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // Check for collision with the player
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkCollision(powerUp, this.game.player)) {
                powerUp.apply(this.game.player);
                powerUp.active = false;
                this.powerUps.splice(i, 1);
                this.enemiesDestroyedSinceDrop = 0;
            }
        }
        
        // Force a power-up drop if none have appeared for a very long time
        const currentTime = this.game.frameCount;
        if (this.powerUps.length === 0 && currentTime - this.lastDropTime > 1800) { // Decreased from 3600 to 1800 (30 seconds)
            this.forcePowerUpDrop();
        }
    }
    
    // Helper function to check collisions
    checkCollision(powerUp, player) {
        return powerUp.x < player.x + player.width &&
               powerUp.x + powerUp.width > player.x &&
               powerUp.y < player.y + player.height &&
               powerUp.y + powerUp.height > player.y;
    }
    
    trySpawnPowerUp(x, y) {
        console.log("Trying to spawn power-up");
        const currentTime = this.game.frameCount;
        
        // Always increment kill counter
        this.enemiesDestroyedSinceDrop++;
        
        // Force drop after killing enough enemies
        if (this.enemiesDestroyedSinceDrop >= this.guaranteedDropKillCount) {
            console.log("Guaranteed power-up drop after " + this.guaranteedDropKillCount + " kills");
            this.createPowerUp(x, y);
            return;
        }
        
        // Regular chance-based drops
        if (currentTime - this.lastDropTime < this.minDropInterval) {
            return;
        }
        
        if (Math.random() < this.dropChance) {
            console.log("Random power-up spawned!");
            this.createPowerUp(x, y);
        }
    }
    
    createPowerUp(x, y) {
        const powerUp = new PowerUp({
            game: this.game,
            x: x,
            y: y
        });
        this.powerUps.push(powerUp);
        this.lastDropTime = this.game.frameCount;
        this.enemiesDestroyedSinceDrop = 0;
        console.log("Power-up created at", x, y, "Type:", powerUp.type);
    }
    
    forcePowerUpDrop() {
        // Drop a power-up from a random position at top of screen
        const x = Math.random() * (this.game.width - 100) + 50;
        this.createPowerUp(x, 0);
        console.log("Forced power-up drop");
    }
    
    spawnLevelStartPowerUp() {
        if (this.levelStartPowerUp) {
            // Spawn a power-up in the middle of the screen
            setTimeout(() => {
                const x = this.game.width / 2;
                const y = this.game.height / 2;
                
                // Create the power-up
                this.createPowerUp(x, y);
                console.log("Level start power-up spawned!");
            }, 2000); // Delay to let the level start first
        }
    }
    
    reset() {
        this.powerUps = [];
        this.lastDropTime = 0;
        this.enemiesDestroyedSinceDrop = 0;
        this.levelStartPowerUp = true;
    }
    
    draw() {
        this.powerUps.forEach(powerUp => {
            powerUp.draw();
        });
    }
}
