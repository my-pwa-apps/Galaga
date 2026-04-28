// ============================================
// ADDITIONAL ARCADE FIELD GAMES
// Lightweight playable tributes for Dig Dug and Centipede cabinets.
// ============================================

const DigDugGame = {
    player: null,
    enemies: [],
    tunnels: new Set(),
    pumpCooldown: 0,
    moveCooldown: 0,
    tileSize: 24,

    reset() {
        this.player = { x: 240, y: 520, facing: { x: 1, y: 0 }, speed: 150 };
        this.pumpCooldown = 0;
        this.moveCooldown = 0;
        this.tunnels = new Set();
        this.enemies = [];

        for (let index = 0; index < 4 + Math.min(4, GameState.level); index++) {
            this.enemies.push({
                x: 72 + (index % 4) * 96,
                y: 132 + Math.floor(index / 4) * 82,
                speed: 48 + GameState.level * 4,
                color: index % 2 ? '#ff66aa' : '#44ddff',
                inflate: 0,
                directionTimer: 0
            });
        }

        this.markTunnel(this.player.x, this.player.y);
    },

    update(deltaTime) {
        GameState.updateStats(deltaTime);
        this.pumpCooldown = Math.max(0, this.pumpCooldown - deltaTime);
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);

        if (this.enemies.length === 0) {
            GameState.score += 750;
            GameState.level++;
            this.reset();
        }
    },

    updatePlayer(deltaTime) {
        let moveX = 0;
        let moveY = 0;
        if (InputManager.isLeft()) moveX = -1;
        if (InputManager.isRight()) moveX = 1;
        if (InputManager.isUp()) moveY = -1;
        if (InputManager.isDown()) moveY = 1;

        if (moveX || moveY) {
            if (Math.abs(moveX) >= Math.abs(moveY)) moveY = 0;
            if (Math.abs(moveY) > Math.abs(moveX)) moveX = 0;
            this.player.facing = { x: moveX, y: moveY };
            this.player.x = this.clamp(this.player.x + moveX * this.player.speed * deltaTime, 24, 456);
            this.player.y = this.clamp(this.player.y + moveY * this.player.speed * deltaTime, 96, 590);
            this.markTunnel(this.player.x, this.player.y);
        }

        if (InputManager.isFire() && this.pumpCooldown <= 0) {
            this.pumpCooldown = 0.32;
            GameState.stats.shotsFired++;
            this.pumpNearestEnemy();
        }
    },

    pumpNearestEnemy() {
        let target = null;
        let bestDistance = Infinity;
        for (const enemy of this.enemies) {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const alignedHorizontally = Math.abs(dy) < 28 && Math.sign(dx || this.player.facing.x) === this.player.facing.x;
            const alignedVertically = Math.abs(dx) < 28 && Math.sign(dy || this.player.facing.y) === this.player.facing.y;
            const distance = Math.hypot(dx, dy);
            if ((alignedHorizontally || alignedVertically) && distance < 118 && distance < bestDistance) {
                target = enemy;
                bestDistance = distance;
            }
        }

        if (!target) return;
        target.inflate++;
        GameState.stats.shotsHit++;
        if (target.inflate >= 3) {
            this.enemies = this.enemies.filter(enemy => enemy !== target);
            GameState.score += 300;
            GameState.stats.enemiesDestroyed++;
        }
    },

    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const axisHorizontal = Math.abs(dx) > Math.abs(dy);
            const moveX = axisHorizontal ? Math.sign(dx) : 0;
            const moveY = axisHorizontal ? 0 : Math.sign(dy);
            enemy.x = this.clamp(enemy.x + moveX * enemy.speed * deltaTime, 24, 456);
            enemy.y = this.clamp(enemy.y + moveY * enemy.speed * deltaTime, 96, 590);

            if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < 18) {
                this.loseLife();
                return;
            }
        }
    },

    loseLife() {
        GameState.lives--;
        if (GameState.lives <= 0) {
            GalagaGame.handleGameOver();
            return;
        }
        this.player.x = 240;
        this.player.y = 520;
        this.player.facing = { x: 1, y: 0 };
    },

    markTunnel(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                this.tunnels.add(`${col + colOffset},${row + rowOffset}`);
            }
        }
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    draw(context, time) {
        context.fillStyle = '#1b0f2a';
        context.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        context.fillStyle = '#6b3f24';
        context.fillRect(0, 76, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT - 76);

        context.fillStyle = '#05020a';
        for (const key of this.tunnels) {
            const [col, row] = key.split(',').map(Number);
            context.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
        }

        context.strokeStyle = 'rgba(255,255,255,0.08)';
        for (let y = 100; y < GameConfig.CANVAS_HEIGHT; y += 48) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(GameConfig.CANVAS_WIDTH, y);
            context.stroke();
        }

        this.drawPlayer(context);
        for (const enemy of this.enemies) this.drawEnemy(context, enemy, time);
        this.drawHUD(context);
    },

    drawPlayer(context) {
        context.save();
        context.translate(this.player.x, this.player.y);
        context.fillStyle = '#ffffff';
        context.fillRect(-9, -11, 18, 22);
        context.fillStyle = '#4ad7ff';
        context.fillRect(-7, -16, 14, 7);
        context.fillStyle = '#ff74c8';
        context.fillRect(this.player.facing.x * 8 - 3, this.player.facing.y * 8 - 3, 10, 6);
        context.restore();
    },

    drawEnemy(context, enemy, time) {
        const radius = 12 + enemy.inflate * 4 + Math.sin(time * 8) * 1.5;
        context.save();
        context.translate(enemy.x, enemy.y);
        context.fillStyle = enemy.color;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        context.fillRect(-5, -4, 3, 3);
        context.fillRect(3, -4, 3, 3);
        context.restore();
    },

    drawHUD(context) {
        const arcadeFont = "'Press Start 2P', monospace";
        Renderer.drawText('DIG DUG', 12, 16, { font: `10px ${arcadeFont}`, color: '#ff74c8' });
        Renderer.drawText(GameState.score.toLocaleString(), 12, 34, { font: `10px ${arcadeFont}`, color: '#ffffff' });
        Renderer.drawText(`ROUND ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 24, { font: `9px ${arcadeFont}`, color: '#ffe66d', align: 'center' });
        Renderer.drawText(`LIVES ${GameState.lives}`, GameConfig.CANVAS_WIDTH - 12, 34, { font: `9px ${arcadeFont}`, color: '#4ad7ff', align: 'right' });
    }
};

const CentipedeGame = {
    player: null,
    bullets: [],
    segments: [],
    mushrooms: [],
    fireCooldown: 0,
    direction: 1,

    reset() {
        this.player = { x: 240, y: 578, speed: 220 };
        this.bullets = [];
        this.fireCooldown = 0;
        this.direction = 1;
        this.segments = [];
        this.mushrooms = [];

        for (let index = 0; index < 12 + Math.min(8, GameState.level); index++) {
            this.segments.push({ x: 54 + index * 24, y: 112, hp: 1 });
        }
        for (let index = 0; index < 34; index++) {
            this.mushrooms.push({
                x: 24 + (index * 83) % 432,
                y: 142 + (index * 47) % 330,
                hp: 2
            });
        }
    },

    update(deltaTime) {
        GameState.updateStats(deltaTime);
        this.fireCooldown = Math.max(0, this.fireCooldown - deltaTime);
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateCentipede(deltaTime);

        if (this.segments.length === 0) {
            GameState.score += 1000;
            GameState.level++;
            this.reset();
        }
    },

    updatePlayer(deltaTime) {
        let moveX = 0;
        let moveY = 0;
        if (InputManager.isLeft()) moveX = -1;
        if (InputManager.isRight()) moveX = 1;
        if (InputManager.isUp()) moveY = -1;
        if (InputManager.isDown()) moveY = 1;
        this.player.x = this.clamp(this.player.x + moveX * this.player.speed * deltaTime, 18, 462);
        this.player.y = this.clamp(this.player.y + moveY * this.player.speed * deltaTime, 500, 610);

        if (InputManager.isFire() && this.fireCooldown <= 0 && this.bullets.length < 3) {
            this.fireCooldown = 0.16;
            this.bullets.push({ x: this.player.x, y: this.player.y - 18 });
            GameState.stats.shotsFired++;
        }
    },

    updateBullets(deltaTime) {
        for (const bullet of this.bullets) bullet.y -= 420 * deltaTime;
        this.bullets = this.bullets.filter(bullet => bullet.y > 64);

        for (const bullet of [...this.bullets]) {
            const hitSegment = this.segments.find(segment => Math.hypot(segment.x - bullet.x, segment.y - bullet.y) < 13);
            if (hitSegment) {
                this.segments = this.segments.filter(segment => segment !== hitSegment);
                this.mushrooms.push({ x: hitSegment.x, y: hitSegment.y, hp: 2 });
                this.bullets = this.bullets.filter(activeBullet => activeBullet !== bullet);
                GameState.score += 100;
                GameState.stats.shotsHit++;
                GameState.stats.enemiesDestroyed++;
                continue;
            }

            const hitMushroom = this.mushrooms.find(mushroom => Math.abs(mushroom.x - bullet.x) < 11 && Math.abs(mushroom.y - bullet.y) < 11);
            if (hitMushroom) {
                hitMushroom.hp--;
                this.bullets = this.bullets.filter(activeBullet => activeBullet !== bullet);
                if (hitMushroom.hp <= 0) {
                    this.mushrooms = this.mushrooms.filter(mushroom => mushroom !== hitMushroom);
                    GameState.score += 10;
                }
            }
        }
    },

    updateCentipede(deltaTime) {
        const speed = 78 + GameState.level * 8;
        let shouldDrop = false;
        for (const segment of this.segments) {
            segment.x += this.direction * speed * deltaTime;
            if (segment.x < 18 || segment.x > 462 || this.mushrooms.some(mushroom => Math.abs(mushroom.x - segment.x) < 14 && Math.abs(mushroom.y - segment.y) < 14)) {
                shouldDrop = true;
            }
        }

        if (shouldDrop) {
            this.direction *= -1;
            for (const segment of this.segments) {
                segment.x = this.clamp(segment.x, 18, 462);
                segment.y += 22;
                if (segment.y > 618) segment.y = 96;
            }
        }

        if (this.segments.some(segment => Math.hypot(segment.x - this.player.x, segment.y - this.player.y) < 18)) {
            this.loseLife();
        }
    },

    loseLife() {
        GameState.lives--;
        if (GameState.lives <= 0) {
            GalagaGame.handleGameOver();
            return;
        }
        this.player.x = 240;
        this.player.y = 578;
        this.bullets = [];
        for (const segment of this.segments) segment.y = Math.min(segment.y, 380);
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    draw(context, time) {
        context.fillStyle = '#03040f';
        context.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        this.drawHUD(context);

        for (const mushroom of this.mushrooms) this.drawMushroom(context, mushroom);
        for (const bullet of this.bullets) {
            context.fillStyle = '#fff47a';
            context.fillRect(bullet.x - 2, bullet.y - 10, 4, 12);
        }
        for (const segment of this.segments) this.drawSegment(context, segment, time);
        this.drawPlayer(context);
    },

    drawMushroom(context, mushroom) {
        context.fillStyle = mushroom.hp > 1 ? '#ff4fd8' : '#7a2cff';
        context.beginPath();
        context.arc(mushroom.x, mushroom.y, 9, Math.PI, 0);
        context.rect(mushroom.x - 7, mushroom.y, 14, 8);
        context.fill();
    },

    drawSegment(context, segment, time) {
        context.save();
        context.translate(segment.x, segment.y);
        context.fillStyle = '#68ff4d';
        context.shadowColor = '#68ff4d';
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(0, Math.sin(time * 10 + segment.x) * 2, 10, 0, Math.PI * 2);
        context.fill();
        context.restore();
    },

    drawPlayer(context) {
        context.save();
        context.translate(this.player.x, this.player.y);
        context.fillStyle = '#7df9ff';
        context.fillRect(-12, -8, 24, 16);
        context.fillStyle = '#ffffff';
        context.fillRect(-3, -18, 6, 14);
        context.restore();
    },

    drawHUD(context) {
        const arcadeFont = "'Press Start 2P', monospace";
        Renderer.drawText('CENTIPEDE', 12, 16, { font: `10px ${arcadeFont}`, color: '#68ff4d' });
        Renderer.drawText(GameState.score.toLocaleString(), 12, 34, { font: `10px ${arcadeFont}`, color: '#ffffff' });
        Renderer.drawText(`WAVE ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 24, { font: `9px ${arcadeFont}`, color: '#ff4fd8', align: 'center' });
        Renderer.drawText(`LIVES ${GameState.lives}`, GameConfig.CANVAS_WIDTH - 12, 34, { font: `9px ${arcadeFont}`, color: '#7df9ff', align: 'right' });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DigDugGame, CentipedeGame };
}
