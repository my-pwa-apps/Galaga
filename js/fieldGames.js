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
    soilBands: ['#9c5b2e', '#7b4425', '#60341f', '#452618'],

    reset() {
        this.player = { x: 240, y: 520, facing: { x: 1, y: 0 }, speed: 150 };
        this.pumpCooldown = 0;
        this.moveCooldown = 0;
        this.tunnels = new Set();
        this.enemies = [];
        this.seedTunnels();

        for (let index = 0; index < 4 + Math.min(4, GameState.level); index++) {
            const fygar = index % 3 === 2;
            this.enemies.push({
                x: 72 + (index % 4) * 96,
                y: 132 + Math.floor(index / 4) * 82,
                speed: 48 + GameState.level * 4,
                type: fygar ? 'fygar' : 'pooka',
                color: fygar ? '#45d36f' : '#ff5b8a',
                inflate: 0,
                directionTimer: 0
            });
            this.markTunnel(this.enemies[index].x, this.enemies[index].y);
        }

        this.markTunnel(this.player.x, this.player.y);
    },

    seedTunnels() {
        for (let row = 4; row <= 22; row++) this.addTunnelCell(10, row);
        for (let col = 3; col <= 10; col++) this.addTunnelCell(col, 8);
        for (let col = 10; col <= 16; col++) this.addTunnelCell(col, 12);
        for (let col = 4; col <= 13; col++) this.addTunnelCell(col, 17);
        for (let row = 8; row <= 14; row++) this.addTunnelCell(4, row);
        for (let row = 12; row <= 19; row++) this.addTunnelCell(16, row);
    },

    addTunnelCell(col, row) {
        this.tunnels.add(`${col},${row}`);
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
        context.fillStyle = '#050514';
        context.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

        this.drawSurface(context, time);

        for (let index = 0; index < this.soilBands.length; index++) {
            context.fillStyle = this.soilBands[index];
            context.fillRect(0, 76 + index * 132, GameConfig.CANVAS_WIDTH, 132);
        }

        context.fillStyle = 'rgba(255, 230, 120, 0.16)';
        for (let y = 116; y < GameConfig.CANVAS_HEIGHT; y += 66) {
            context.fillRect(0, y, GameConfig.CANVAS_WIDTH, 2);
        }

        this.drawTunnels(context);

        this.drawRocks(context, time);
        this.drawPumpLine(context);
        this.drawPlayer(context, time);
        for (const enemy of this.enemies) this.drawEnemy(context, enemy, time);
        this.drawHUD(context);
    },

    drawSurface(context, time) {
        context.fillStyle = '#11164c';
        context.fillRect(0, 0, GameConfig.CANVAS_WIDTH, 76);
        context.fillStyle = '#3bd36f';
        context.fillRect(0, 58, GameConfig.CANVAS_WIDTH, 18);
        context.fillStyle = '#1a8f41';
        for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 16) {
            context.fillRect(x, 52 + Math.sin(time * 2 + x) * 2, 9, 8);
        }
        context.fillStyle = '#ffffff';
        for (let index = 0; index < 22; index++) {
            const x = 14 + index * 22;
            const y = 34 + ((index * 19) % 17);
            context.fillRect(x, y, 2, 2);
        }
    },

    drawRocks(context, time) {
        context.save();
        context.fillStyle = '#a86a39';
        context.strokeStyle = '#3a1c12';
        context.lineWidth = 2;
        for (let index = 0; index < 5; index++) {
            const x = 54 + index * 94;
            const y = 166 + ((index * 83) % 322);
            context.save();
            context.translate(x, y + Math.sin(time * 2 + index) * 1.5);
            context.beginPath();
            context.moveTo(-13, 7);
            context.lineTo(-7, -12);
            context.lineTo(10, -10);
            context.lineTo(16, 5);
            context.lineTo(3, 15);
            context.closePath();
            context.fill();
            context.stroke();
            context.restore();
        }
        context.restore();
    },

    drawTunnels(context) {
        context.save();
        const hasTunnel = (col, row) => this.tunnels.has(`${col},${row}`);

        for (const key of this.tunnels) {
            const [col, row] = key.split(',').map(Number);
            const x = col * this.tileSize;
            const y = row * this.tileSize;
            context.fillStyle = '#080410';
            context.fillRect(x, y, this.tileSize, this.tileSize);
            context.fillStyle = 'rgba(255, 255, 255, 0.025)';
            context.fillRect(x + 5, y + 4, this.tileSize - 10, 2);
        }

        context.strokeStyle = 'rgba(255, 205, 126, 0.24)';
        context.lineWidth = 3;
        context.lineCap = 'round';
        for (const key of this.tunnels) {
            const [col, row] = key.split(',').map(Number);
            const x = col * this.tileSize;
            const y = row * this.tileSize;

            if (!hasTunnel(col, row - 1)) {
                context.beginPath();
                context.moveTo(x + 3, y + 2);
                context.lineTo(x + this.tileSize - 3, y + 2);
                context.stroke();
            }
            if (!hasTunnel(col, row + 1)) {
                context.beginPath();
                context.moveTo(x + 3, y + this.tileSize - 2);
                context.lineTo(x + this.tileSize - 3, y + this.tileSize - 2);
                context.stroke();
            }
            if (!hasTunnel(col - 1, row)) {
                context.beginPath();
                context.moveTo(x + 2, y + 3);
                context.lineTo(x + 2, y + this.tileSize - 3);
                context.stroke();
            }
            if (!hasTunnel(col + 1, row)) {
                context.beginPath();
                context.moveTo(x + this.tileSize - 2, y + 3);
                context.lineTo(x + this.tileSize - 2, y + this.tileSize - 3);
                context.stroke();
            }
        }
        context.restore();
    },

    drawPumpLine(context) {
        if (!InputManager.isFire() || this.pumpCooldown <= 0.18) return;
        const length = 106;
        const endX = this.player.x + this.player.facing.x * length;
        const endY = this.player.y + this.player.facing.y * length;
        context.save();
        context.strokeStyle = '#e9f6ff';
        context.lineWidth = 4;
        context.setLineDash([7, 5]);
        context.beginPath();
        context.moveTo(this.player.x, this.player.y);
        context.lineTo(endX, endY);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = '#ff74c8';
        context.fillRect(endX - 5, endY - 5, 10, 10);
        context.restore();
    },

    drawPlayer(context, time) {
        context.save();
        context.translate(this.player.x, this.player.y);
        if (this.player.facing.x < 0) context.scale(-1, 1);

        const walk = Math.sin(time * 14) * 2;
        const bob = Math.sin(time * 9) * 1.5;
        context.shadowColor = '#58d9ff';
        context.shadowBlur = 12;
        context.translate(0, bob);
        context.fillStyle = 'rgba(4, 2, 10, 0.55)';
        context.fillRect(-16, 15, 32, 6);
        context.fillStyle = '#f4f8ff';
        context.fillRect(-11, -8, 22, 23);
        context.fillStyle = '#2aa8ff';
        context.fillRect(-12, -5, 24, 9);
        context.fillStyle = '#ffffff';
        context.fillRect(-10, -22, 20, 14);
        context.fillStyle = '#2aa8ff';
        context.fillRect(-13, -27, 26, 8);
        context.fillStyle = '#f6d4a2';
        context.fillRect(-7, -17, 14, 9);
        context.fillStyle = '#0b1730';
        context.fillRect(2, -17, 5, 4);
        context.fillStyle = '#f24fa8';
        context.fillRect(9, -5, 17, 6);
        context.fillStyle = '#ffffff';
        context.fillRect(24, -4, 15, 4);
        context.fillStyle = '#ff74c8';
        context.fillRect(38, -5, 7, 6);
        context.fillStyle = '#0b1730';
        context.fillRect(-9, 14, 6, 9 + walk);
        context.fillRect(4, 14, 6, 9 - walk);
        context.fillStyle = '#ffffff';
        context.fillRect(-12, 22 + walk, 9, 4);
        context.fillRect(4, 22 - walk, 9, 4);
        context.restore();
    },

    drawEnemy(context, enemy, time) {
        if (enemy.type === 'fygar') {
            this.drawFygar(context, enemy, time);
            return;
        }

        this.drawPooka(context, enemy, time);
    },

    drawPooka(context, enemy, time) {
        const radius = 12 + enemy.inflate * 4 + Math.sin(time * 8) * 1.5;
        context.save();
        context.translate(enemy.x, enemy.y);
        context.shadowColor = enemy.color;
        context.shadowBlur = 10;
        context.fillStyle = enemy.color;
        context.beginPath();
        context.arc(0, -1, radius, Math.PI, 0);
        context.lineTo(radius - 2, 7);
        context.quadraticCurveTo(radius * 0.4, 17 + enemy.inflate * 2, 0, 12 + enemy.inflate * 2);
        context.quadraticCurveTo(-radius * 0.4, 17 + enemy.inflate * 2, -radius + 2, 7);
        context.closePath();
        context.fill();
        context.fillStyle = 'rgba(255,255,255,0.25)';
        context.beginPath();
        context.arc(-5, -5, Math.max(4, radius * 0.28), 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(-5, -4, 3, 0, Math.PI * 2);
        context.arc(5, -4, 3, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#1a0b2a';
        context.fillRect(-6, -5, 2, 2);
        context.fillRect(4, -5, 2, 2);
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-8, 6);
        context.quadraticCurveTo(0, 11 + enemy.inflate, 8, 6);
        context.stroke();
        context.strokeStyle = enemy.color;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-radius + 2, 5);
        context.lineTo(-radius - 7, 10 + Math.sin(time * 12) * 2);
        context.moveTo(radius - 2, 5);
        context.lineTo(radius + 7, 10 - Math.sin(time * 12) * 2);
        context.stroke();
        context.restore();
    },

    drawFygar(context, enemy, time) {
        const inflate = enemy.inflate * 3;
        context.save();
        context.translate(enemy.x, enemy.y);
        context.shadowColor = '#45d36f';
        context.shadowBlur = 10;
        context.fillStyle = '#45d36f';
        context.fillRect(-15 - inflate, -8 - inflate, 28 + inflate * 2, 18 + inflate * 2);
        context.fillStyle = '#8dff75';
        context.fillRect(-10 - inflate, -13 - inflate, 20 + inflate * 2, 8);
        context.fillStyle = '#ffffff';
        context.fillRect(8 + inflate, -5, 4, 4);
        context.fillStyle = '#09200b';
        context.fillRect(10 + inflate, -4, 2, 2);
        context.fillStyle = '#ffdf55';
        context.beginPath();
        context.moveTo(14 + inflate, 0);
        context.lineTo(28 + inflate + Math.sin(time * 10) * 4, -8);
        context.lineTo(24 + inflate, 0);
        context.lineTo(29 + inflate + Math.sin(time * 10) * 3, 8);
        context.closePath();
        context.fill();
        context.strokeStyle = '#145b24';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-15 - inflate, 8 + inflate);
        context.lineTo(-22 - inflate, 15 + Math.sin(time * 9) * 2);
        context.moveTo(0, 10 + inflate);
        context.lineTo(-4, 18 - Math.sin(time * 9) * 2);
        context.stroke();
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
    cellSize: 24,
    segmentSpacing: 20,

    reset() {
        this.player = { x: 240, y: 578, speed: 220 };
        this.bullets = [];
        this.fireCooldown = 0;
        this.segments = [];
        this.mushrooms = [];

        for (let index = 0; index < 12 + Math.min(8, GameState.level); index++) {
            this.segments.push({
                x: 168 - index * this.segmentSpacing,
                y: 96,
                hp: 1,
                direction: 1,
                phase: index * 0.55
            });
        }
        for (let row = 0; row < 16; row++) {
            for (let col = 0; col < 18; col++) {
                const noise = Math.sin((row + 1) * 12.9898 + (col + 1) * 78.233 + GameState.level * 6.17) * 43758.5453;
                if (noise - Math.floor(noise) > 0.13) continue;
                this.mushrooms.push({
                    x: 36 + col * this.cellSize,
                    y: 118 + row * this.cellSize,
                    hp: 2
                });
            }
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
        if (!this.segments.length) return;

        const speed = 78 + GameState.level * 8;
        const head = this.segments[0];
        const nextX = head.x + head.direction * speed * deltaTime;
        const hitWall = nextX < 18 || nextX > 462;
        const hitMushroom = this.mushrooms.some(mushroom =>
            Math.abs(mushroom.x - nextX) < 16 && Math.abs(mushroom.y - head.y) < 16);

        if (hitWall || hitMushroom) {
            head.direction *= -1;
            head.x = this.clamp(head.x, 18, 462);
            head.y += this.cellSize;
            if (head.y > 618) head.y = 96;
        } else {
            head.x = nextX;
        }

        for (let index = 1; index < this.segments.length; index++) {
            const leader = this.segments[index - 1];
            const segment = this.segments[index];
            const dx = leader.x - segment.x;
            const dy = leader.y - segment.y;
            const distance = Math.hypot(dx, dy);
            if (distance > this.segmentSpacing) {
                const pull = distance - this.segmentSpacing;
                segment.x += (dx / distance) * pull;
                segment.y += (dy / distance) * pull;
            }
            segment.direction = leader.x >= segment.x ? 1 : -1;
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
        context.fillStyle = '#02040a';
        context.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        context.strokeStyle = 'rgba(75, 255, 104, 0.08)';
        for (let x = 24; x < GameConfig.CANVAS_WIDTH; x += 48) {
            context.beginPath();
            context.moveTo(x, 58);
            context.lineTo(x, GameConfig.CANVAS_HEIGHT);
            context.stroke();
        }
        context.strokeStyle = 'rgba(255, 79, 216, 0.06)';
        for (let y = 92; y < 500; y += this.cellSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(GameConfig.CANVAS_WIDTH, y);
            context.stroke();
        }
        this.drawHUD(context);

        for (const mushroom of this.mushrooms) this.drawMushroom(context, mushroom);
        for (const bullet of this.bullets) {
            context.fillStyle = '#fff47a';
            context.fillRect(bullet.x - 2, bullet.y - 10, 4, 12);
        }
        this.drawSegmentLinks(context);
        for (let index = this.segments.length - 1; index >= 0; index--) {
            this.drawSegment(context, this.segments[index], time, index === 0);
        }
        this.drawPlayer(context, time);
    },

    drawSegmentLinks(context) {
        context.save();
        context.strokeStyle = '#ff8c4d';
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.globalAlpha = 0.7;
        context.beginPath();
        for (let index = 1; index < this.segments.length; index++) {
            const previous = this.segments[index - 1];
            const current = this.segments[index];
            if (Math.hypot(previous.x - current.x, previous.y - current.y) > this.segmentSpacing * 1.9) continue;
            context.moveTo(previous.x, previous.y);
            context.lineTo(current.x, current.y);
        }
        context.stroke();
        context.restore();
    },

    drawMushroom(context, mushroom) {
        context.save();
        context.shadowColor = mushroom.hp > 1 ? '#ff4fd8' : '#7a2cff';
        context.shadowBlur = 6;
        context.fillStyle = mushroom.hp > 1 ? '#ff4fd8' : '#7a2cff';
        context.beginPath();
        context.arc(mushroom.x, mushroom.y - 2, 10, Math.PI, 0);
        context.rect(mushroom.x - 8, mushroom.y - 2, 16, 10);
        context.fill();
        context.fillStyle = '#42ff66';
        context.fillRect(mushroom.x - 4, mushroom.y + 5, 8, 8);
        context.fillStyle = 'rgba(255,255,255,0.7)';
        context.fillRect(mushroom.x - 5, mushroom.y - 4, 3, 3);
        context.fillRect(mushroom.x + 2, mushroom.y - 6, 3, 3);
        context.restore();
    },

    drawSegment(context, segment, time, isHead) {
        context.save();
        context.translate(segment.x, segment.y + Math.sin(time * 10 + segment.phase) * 2);
        context.fillStyle = isHead ? '#ff5f5f' : '#ffd84d';
        context.shadowColor = isHead ? '#ff5f5f' : '#ffd84d';
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(0, 0, isHead ? 11 : 9, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
        context.fillStyle = '#121018';
        context.fillRect(segment.direction * 3 - 2, -4, 3, 3);
        context.fillRect(segment.direction * 3 - 2, 3, 3, 3);
        context.strokeStyle = isHead ? '#ffffff' : '#ff8c4d';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-6, -9);
        context.lineTo(-10, -15);
        context.moveTo(6, -9);
        context.lineTo(10, -15);
        context.stroke();
        context.restore();
    },

    drawPlayer(context, time) {
        context.save();
        context.translate(this.player.x, this.player.y);
        const pulse = 0.5 + Math.sin(time * 10) * 0.5;
        context.shadowColor = '#7df9ff';
        context.shadowBlur = 10 + pulse * 8;
        context.fillStyle = '#43e8ff';
        context.beginPath();
        context.moveTo(0, -23);
        context.lineTo(13, 4);
        context.lineTo(13, 17);
        context.lineTo(-13, 17);
        context.lineTo(-13, 4);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
        context.fillStyle = '#ffffff';
        context.fillRect(-3, -31, 6, 20);
        context.fillStyle = '#ff4fd8';
        context.fillRect(-10, 4, 20, 5);
        context.fillStyle = '#03121f';
        context.fillRect(-5, -4, 10, 6);
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-12, 16);
        context.lineTo(-18, 22);
        context.moveTo(12, 16);
        context.lineTo(18, 22);
        context.stroke();
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
