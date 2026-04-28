// ============================================
// PAC-MAN-STYLE MAZE CHASE TRIBUTE
// Original-inspired mechanics with custom canvas rendering.
// ============================================

const PacManGame = {
    tileSize: 24,
    offsetX: 12,
    offsetY: 72,
    rows: [],
    pellets: new Set(),
    powerPellets: new Set(),
    player: null,
    ghosts: [],
    frightenedTimer: 0,
    nextDirection: { x: 0, y: 0 },
    actorRadius: 9,
    variant: 'pacman',

    maze: [
        '###################',
        '#........#........#',
        '#.##.###.#.###.##.#',
        '#o##.###.#.###.##o#',
        '#.................#',
        '#.##.#.#####.#.##.#',
        '#....#...#...#....#',
        '####.###.#.###.####',
        '   #.#...G...#.#   ',
        '####.#.##G##.#.####',
        '.......#GGG#.......',
        '####.#.#####.#.####',
        '   #.#.......#.#   ',
        '####.# ##### #.####',
        '#........#........#',
        '#.##.###.#.###.##.#',
        '#o.#.....P.....#.o#',
        '##.#.#.#####.#.#.##',
        '#....#...#...#....#',
        '#.######.#.######.#',
        '#.................#',
        '###################'
    ],

    reset() {
        this.variant = GameState.selectedGame === 'mspacman' ? 'mspacman' : 'pacman';
        this.rows = this.maze.map(row => row.split(''));
        this.pellets = new Set();
        this.powerPellets = new Set();
        this.frightenedTimer = 0;
        this.nextDirection = { x: 0, y: 0 };

        for (let row = 0; row < this.rows.length; row++) {
            for (let col = 0; col < this.rows[row].length; col++) {
                const cell = this.rows[row][col];
                const key = `${col},${row}`;
                if (cell === '.' || cell === 'P') {
                    this.pellets.add(key);
                } else if (cell === 'o') {
                    this.powerPellets.add(key);
                }

                if (cell === 'P') {
                    this.player = this.createActor(col, row, this.variant === 'mspacman' ? '#ff9ad5' : '#ffd21f', 92);
                    this.rows[row][col] = '.';
                }
            }
        }

        this.ghosts = [
            this.createActor(9, 8, '#ff3333', 76, 'blinky'),
            this.createActor(8, 10, '#ff9ad5', 70, 'pinky'),
            this.createActor(9, 10, '#33e6ff', 68, 'inky'),
            this.createActor(10, 10, '#ff9a33', 66, 'clyde')
        ];

        this.ghosts[0].dir = { x: 1, y: 0 };
        this.ghosts[1].dir = { x: -1, y: 0 };
        this.ghosts[2].dir = { x: 0, y: -1 };
        this.ghosts[3].dir = { x: 0, y: 1 };
    },

    createActor(col, row, color, speed, name = 'player') {
        return {
            name,
            x: this.offsetX + col * this.tileSize + this.tileSize / 2,
            y: this.offsetY + row * this.tileSize + this.tileSize / 2,
            spawnX: this.offsetX + col * this.tileSize + this.tileSize / 2,
            spawnY: this.offsetY + row * this.tileSize + this.tileSize / 2,
            dir: { x: 0, y: 0 },
            color,
            speed
        };
    },

    update(dt) {
        if (!this.player) this.reset();

        this.readInput();
        this.frightenedTimer = Math.max(0, this.frightenedTimer - dt);
        this.updatePlayer(dt);
        this.updateGhosts(dt);
        this.checkGhostCollisions();

        if (this.pellets.size === 0 && this.powerPellets.size === 0) {
            GameState.level++;
            GameState.score += 1000;
            this.reset();
        }
    },

    readInput() {
        if (InputManager.isLeft()) {
            this.nextDirection = { x: -1, y: 0 };
        } else if (InputManager.isRight()) {
            this.nextDirection = { x: 1, y: 0 };
        } else if (InputManager.isUp()) {
            this.nextDirection = { x: 0, y: -1 };
        } else if (InputManager.isDown()) {
            this.nextDirection = { x: 0, y: 1 };
        }
    },

    updatePlayer(dt) {
        if (this.canMove(this.player, this.nextDirection, dt)) {
            this.player.dir = { ...this.nextDirection };
            this.snapActorToLane(this.player, this.player.dir);
        }
        this.moveActor(this.player, this.player.dir, dt);
        this.eatPellet();
    },

    updateGhosts(dt) {
        for (const ghost of this.ghosts) {
            const atCenter = this.isNearTileCenter(ghost);
            if (this.isGhostHouseCell(ghost.x, ghost.y) && atCenter) {
                ghost.dir = this.getGhostHouseExitDirection(ghost);
                this.snapActorToLane(ghost, ghost.dir);
            } else if (atCenter || !this.canMove(ghost, ghost.dir, dt)) {
                ghost.dir = this.chooseGhostDirection(ghost);
                this.snapActorToLane(ghost, ghost.dir);
            }
            this.moveActor(ghost, ghost.dir, dt * (this.frightenedTimer > 0 ? 0.72 : 1));
        }
    },

    chooseGhostDirection(ghost) {
        const inHouse = this.isGhostHouseCell(ghost.x, ghost.y);
        const options = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ].filter(dir => this.canMove(ghost, dir, 0.12) && (inHouse || !(dir.x === -ghost.dir.x && dir.y === -ghost.dir.y)));

        const legal = options.length ? options : [{ x: -ghost.dir.x, y: -ghost.dir.y }];
        const target = inHouse ?
            { x: this.offsetX + 9 * this.tileSize + this.tileSize / 2, y: this.offsetY + 8 * this.tileSize + this.tileSize / 2 } :
            this.frightenedTimer > 0 ?
            { x: this.offsetX + 9 * this.tileSize, y: this.offsetY + 10 * this.tileSize } :
            this.getGhostTarget(ghost);

        legal.sort((a, b) => {
            const distA = this.distanceAfterMove(ghost, a, target);
            const distB = this.distanceAfterMove(ghost, b, target);
            return this.frightenedTimer > 0 ? distB - distA : distA - distB;
        });

        return legal[0];
    },

    getGhostTarget(ghost) {
        if (ghost.name === 'pinky') {
            return {
                x: this.player.x + this.player.dir.x * this.tileSize * 4,
                y: this.player.y + this.player.dir.y * this.tileSize * 4
            };
        }
        if (ghost.name === 'clyde' && this.distance(ghost, this.player) < 110) {
            return { x: this.offsetX + this.tileSize, y: this.offsetY + 20 * this.tileSize };
        }
        return this.player;
    },

    getGhostHouseExitDirection(ghost) {
        const { col, row } = this.getActorTile(ghost);
        if (row > 8) {
            if (col < 9) return { x: 1, y: 0 };
            if (col > 9) return { x: -1, y: 0 };
            return { x: 0, y: -1 };
        }
        if (ghost.dir.x) return { ...ghost.dir };
        return this.player.x < ghost.x ? { x: -1, y: 0 } : { x: 1, y: 0 };
    },

    moveActor(actor, dir, dt) {
        if (!dir.x && !dir.y) return;

        this.snapActorToLane(actor, dir);

        const distance = actor.speed * dt;
        const steps = Math.max(1, Math.ceil(distance / 4));
        const stepDistance = distance / steps;

        for (let i = 0; i < steps; i++) {
            const nextX = actor.x + dir.x * stepDistance;
            const nextY = actor.y + dir.y * stepDistance;

            if (!this.canOccupy(nextX, nextY, actor)) {
                actor.dir = { x: 0, y: 0 };
                this.snapActorToLane(actor, dir);
                return;
            }

            actor.x = nextX;
            actor.y = nextY;
        }

        const minX = this.offsetX - this.tileSize / 2;
        const maxX = this.offsetX + this.rows[0].length * this.tileSize + this.tileSize / 2;
        if (actor.x < minX) actor.x = maxX;
        if (actor.x > maxX) actor.x = minX;
    },

    canMove(actor, dir, dt = 0.08) {
        if (!dir || (!dir.x && !dir.y)) return true;
        const laneX = dir.y ? this.getTileCenterX(actor.x) : actor.x;
        const laneY = dir.x ? this.getTileCenterY(actor.y) : actor.y;
        const lookAhead = Math.max(this.tileSize * 0.45, actor.speed * dt + this.actorRadius);
        return this.canOccupy(laneX + dir.x * lookAhead, laneY + dir.y * lookAhead, actor);
    },

    canOccupy(x, y, actor = this.player) {
        const radius = this.actorRadius;
        const points = [
            { x: x - radius, y: y - radius },
            { x: x + radius, y: y - radius },
            { x: x - radius, y: y + radius },
            { x: x + radius, y: y + radius }
        ];

        return points.every(point => !this.isBlockedAtPixel(point.x, point.y, actor));
    },

    isBlockedAtPixel(x, y, actor) {
        const col = Math.floor((x - this.offsetX) / this.tileSize);
        const row = Math.floor((y - this.offsetY) / this.tileSize);
        return this.isBlocked(col, row, actor);
    },

    isWallAtPixel(x, y) {
        const col = Math.floor((x - this.offsetX) / this.tileSize);
        const row = Math.floor((y - this.offsetY) / this.tileSize);
        return this.isWall(col, row);
    },

    isWall(col, row) {
        if (row < 0 || row >= this.rows.length) return true;
        if (col < 0 || col >= this.rows[row].length) return false;
        return this.rows[row][col] === '#';
    },

    isBlocked(col, row, actor = this.player) {
        if (this.isWall(col, row)) return true;
        if (actor?.name === 'player' && this.rows[row]?.[col] === 'G') return true;
        return false;
    },

    isGhostHouseCell(x, y) {
        const col = Math.floor((x - this.offsetX) / this.tileSize);
        const row = Math.floor((y - this.offsetY) / this.tileSize);
        return this.rows[row]?.[col] === 'G';
    },

    snapActorToLane(actor, dir) {
        if (dir.x) actor.y = this.approach(actor.y, this.getTileCenterY(actor.y), 3);
        if (dir.y) actor.x = this.approach(actor.x, this.getTileCenterX(actor.x), 3);
    },

    getTileCenterX(x) {
        return this.offsetX + Math.floor((x - this.offsetX) / this.tileSize) * this.tileSize + this.tileSize / 2;
    },

    getTileCenterY(y) {
        return this.offsetY + Math.floor((y - this.offsetY) / this.tileSize) * this.tileSize + this.tileSize / 2;
    },

    approach(value, target, maxDelta) {
        if (Math.abs(target - value) <= maxDelta) return target;
        return value + Math.sign(target - value) * maxDelta;
    },

    isNearTileCenter(actor) {
        const colCenter = this.offsetX + Math.floor((actor.x - this.offsetX) / this.tileSize) * this.tileSize + this.tileSize / 2;
        const rowCenter = this.offsetY + Math.floor((actor.y - this.offsetY) / this.tileSize) * this.tileSize + this.tileSize / 2;
        return Math.abs(actor.x - colCenter) < 2 && Math.abs(actor.y - rowCenter) < 2;
    },

    getActorTile(actor) {
        return {
            col: Math.round((actor.x - this.offsetX - this.tileSize / 2) / this.tileSize),
            row: Math.round((actor.y - this.offsetY - this.tileSize / 2) / this.tileSize)
        };
    },

    eatPellet() {
        const col = Math.floor((this.player.x - this.offsetX) / this.tileSize);
        const row = Math.floor((this.player.y - this.offsetY) / this.tileSize);
        const key = `${col},${row}`;
        if (this.pellets.delete(key)) {
            GameState.score += 10;
            GameState.stats.pelletsEaten++;
        }
        if (this.powerPellets.delete(key)) {
            GameState.score += 50;
            GameState.stats.pelletsEaten++;
            GameState.stats.powerupsCollected++;
            this.frightenedTimer = 7;
        }
    },

    checkGhostCollisions() {
        for (const ghost of this.ghosts) {
            if (this.distance(ghost, this.player) > 16) continue;

            if (this.frightenedTimer > 0) {
                GameState.score += 200;
                GameState.stats.ghostsEaten++;
                ghost.x = ghost.spawnX;
                ghost.y = ghost.spawnY;
                ghost.dir = { x: 0, y: -1 };
            } else {
                GameState.lives--;
                if (GameState.lives <= 0) {
                    if (typeof GalagaGame !== 'undefined') {
                        GalagaGame.handleGameOver();
                    } else {
                        GameState.setState(GameConfig.STATE.GAME_OVER);
                    }
                } else {
                    this.player.x = this.player.spawnX;
                    this.player.y = this.player.spawnY;
                    this.player.dir = { x: 0, y: 0 };
                    this.nextDirection = { x: 0, y: 0 };
                    for (const resetGhost of this.ghosts) {
                        resetGhost.x = resetGhost.spawnX;
                        resetGhost.y = resetGhost.spawnY;
                    }
                }
                return;
            }
        }
    },

    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceAfterMove(actor, dir, target) {
        const x = actor.x + dir.x * this.tileSize;
        const y = actor.y + dir.y * this.tileSize;
        const dx = x - target.x;
        const dy = y - target.y;
        return dx * dx + dy * dy;
    },

    draw(ctx, time) {
        this.drawBackdrop(ctx);
        this.drawMaze(ctx, time);
        this.drawPellets(ctx, time);
        this.drawActors(ctx, time);
        this.drawHUD(ctx);
    },

    drawBackdrop(ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
    },

    drawMaze(ctx) {
        ctx.save();
        ctx.strokeStyle = '#183cff';
        ctx.shadowColor = '#234cff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;

        for (let row = 0; row < this.rows.length; row++) {
            for (let col = 0; col < this.rows[row].length; col++) {
                if (this.rows[row][col] !== '#') continue;
                const x = this.offsetX + col * this.tileSize;
                const y = this.offsetY + row * this.tileSize;
                ctx.fillStyle = '#050b55';
                ctx.fillRect(x, y, this.tileSize, this.tileSize);
                ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
            }
        }
        ctx.restore();
    },

    drawPellets(ctx, time) {
        ctx.save();
        ctx.fillStyle = '#ffe6aa';
        for (const key of this.pellets) {
            const [col, row] = key.split(',').map(Number);
            const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + row * this.tileSize + this.tileSize / 2;
            ctx.fillRect(x - 2, y - 2, 4, 4);
        }

        const pulse = 3 + Math.sin(time * 8) * 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        for (const key of this.powerPellets) {
            const [col, row] = key.split(',').map(Number);
            const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
            const y = this.offsetY + row * this.tileSize + this.tileSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, pulse, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    drawActors(ctx, time) {
        this.drawPac(ctx, this.player, time);
        for (const ghost of this.ghosts) {
            this.drawGhost(ctx, ghost, time);
        }
    },

    drawPac(ctx, player, time) {
        const mouth = Math.abs(Math.sin(time * 12)) * 0.45 + 0.08;
        const angle = Math.atan2(player.dir.y, player.dir.x || 0.001);

        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(angle);
        ctx.shadowColor = '#ffd21f';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd21f';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 10, mouth, Math.PI * 2 - mouth);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    drawGhost(ctx, ghost, time) {
        const frightened = this.frightenedTimer > 0;
        const color = frightened ? (Math.floor(time * 8) % 2 ? '#2233ff' : '#ffffff') : ghost.color;

        ctx.save();
        ctx.translate(ghost.x, ghost.y);
        ctx.shadowColor = color;
        ctx.shadowBlur = frightened ? 12 : 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -2, 10, Math.PI, 0);
        ctx.lineTo(10, 10);
        for (let i = 0; i < 4; i++) {
            ctx.lineTo(5 - i * 6, 6 + (i % 2) * 4);
        }
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#001144';
        ctx.beginPath();
        ctx.arc(-3 + ghost.dir.x, -2 + ghost.dir.y, 1.5, 0, Math.PI * 2);
        ctx.arc(5 + ghost.dir.x, -2 + ghost.dir.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawHUD(ctx) {
        const arcadeFont = "'Press Start 2P', monospace";
        Renderer.drawText(this.variant === 'mspacman' ? 'MS. PAC-MAN' : 'PAC-MAN', 12, 12, {
            font: `10px ${arcadeFont}`,
            color: this.variant === 'mspacman' ? '#ff9ad5' : '#ffd21f'
        });
        Renderer.drawText(`${GameState.score.toLocaleString()}`, 12, 30, {
            font: `10px ${arcadeFont}`,
            color: '#ffffff'
        });
        Renderer.drawText(`ROUND ${GameState.level}`, GameConfig.CANVAS_WIDTH / 2, 22, {
            font: `9px ${arcadeFont}`,
            color: '#00ffff',
            align: 'center'
        });
        Renderer.drawText(`LIVES ${GameState.lives}`, GameConfig.CANVAS_WIDTH - 12, 30, {
            font: `9px ${arcadeFont}`,
            color: '#ff9ad5',
            align: 'right'
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PacManGame;
}
