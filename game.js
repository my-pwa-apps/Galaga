// Galaga-inspired Arcade Game
// All assets generated from code

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_STATE = {
    SPLASH: 'splash',
    PLAYING: 'playing',
    GAME_OVER: 'gameover',
};

let state = GAME_STATE.SPLASH;
let splashTimer = 0;
let keys = {};

// Arcade splash colors
const arcadeColors = ['#0ff', '#f0f', '#ff0', '#fff', '#0f0', '#f00', '#00f'];

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 32,
    h: 24,
    speed: 5,
    cooldown: 0,
    alive: true,
    power: 'normal', // 'normal', 'double', 'shield', 'speed'
    powerTimer: 0,
    shield: false,
};

// Bullets

let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let score = 0;
let lives = 3;
let level = 1;
let levelTransition = 0;

// Galaga-style enemy states
const ENEMY_STATE = {
    ENTRANCE: 'entrance',
    FORMATION: 'formation',
    ATTACK: 'attack',
};
let formationSpots = [];
let attackQueue = [];

// Add particle array
let particles = [];

function drawArcadeSplash() {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Neon border
    ctx.strokeStyle = arcadeColors[Math.floor(Date.now()/200)%arcadeColors.length];
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
    // Title
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = arcadeColors[Math.floor(Date.now()/400)%arcadeColors.length];
    ctx.textAlign = 'center';
    ctx.fillText('GALAGA', canvas.width/2, 120);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('ARCADE TRIBUTE', canvas.width/2, 160);
    // Insert coin
    ctx.font = '18px monospace';
    ctx.fillStyle = arcadeColors[Math.floor(Date.now()/100)%arcadeColors.length];
    ctx.fillText('PRESS SPACE TO START', canvas.width/2, canvas.height-100);
    ctx.restore();
}


function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    // Improved ship: body
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, 12);
    ctx.lineTo(7, 8);
    ctx.lineTo(-7, 8);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Cockpit
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.ellipse(0, -4, 5, 7, 0, 0, Math.PI*2);
    ctx.fill();
    // Wings
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(-14, 12);
    ctx.lineTo(-18, 18);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.moveTo(14, 12);
    ctx.lineTo(18, 18);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();
    // Shield effect
    if (player.shield) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(b.x, b.y-8);
    ctx.lineTo(b.x+2, b.y+4);
    ctx.lineTo(b.x-2, b.y+4);
    ctx.closePath();
    ctx.fillStyle = b.type === 'double' ? '#0ff' : '#ff0';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.save();
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    // Draw different shapes for each type
    if (e.type === 'basic') {
        // Classic bug
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        // Wings
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-10, 0, 6, 12, Math.PI/6, 0, Math.PI*2);
        ctx.ellipse(10, 0, 6, 12, -Math.PI/6, 0, Math.PI*2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-5, -2, 2, 0, Math.PI*2);
        ctx.arc(5, -2, 2, 0, Math.PI*2);
        ctx.fill();
    } else if (e.type === 'fast') {
        // Arrowhead
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(12, 10);
        ctx.lineTo(0, 4);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Center stripe
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -8, 4, 12);
    } else if (e.type === 'tank') {
        // Rectangle body with armor
        ctx.fillStyle = e.color;
        ctx.fillRect(-14, -10, 28, 20);
        ctx.restore();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-14, -10, 28, 20);
        // Treads
        ctx.fillStyle = '#888';
        ctx.fillRect(-16, -10, 4, 20);
        ctx.fillRect(12, -10, 4, 20);
    } else if (e.type === 'sniper') {
        // Diamond shape
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();
    } else if (e.type === 'zigzag') {
        // Lightning bolt
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(0, 0);
        ctx.lineTo(-6, 8);
        ctx.lineTo(10, 10);
        ctx.stroke();
        ctx.restore();
        // Glow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(0, 0);
        ctx.lineTo(-6, 8);
        ctx.lineTo(10, 10);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
// Powerup drawing
function drawPowerup(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    if (p.type === 'double') {
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fillStyle = '#0ff';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('2X', 0, 4);
    } else if (p.type === 'shield') {
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fillStyle = '#0ef';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('S', 0, 4);
    } else if (p.type === 'speed') {
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('>>', 0, 4);
    }
    ctx.restore();
}

function drawEnemyBullet(b) {
    ctx.save();
    ctx.fillStyle = '#0ff';
    ctx.fillRect(b.x-2, b.y-8, 4, 12);
    ctx.restore();
}

function drawHUD() {
    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: ' + score, 20, 30);
    ctx.fillText('LIVES: ' + lives, canvas.width-120, 30);
    ctx.fillText('LEVEL: ' + level, canvas.width/2, 30);
    if (player.power !== 'normal') {
        ctx.fillStyle = '#0ff';
        ctx.fillText('POWER: ' + player.power.toUpperCase(), canvas.width/2, 50);
    }
    ctx.restore();
}

function spawnEnemies() {
    enemies = [];
    formationSpots = [];
    attackQueue = [];
    // Galaga: fixed formation spots
    let baseCols = 4 + Math.floor(level/2);
    let baseRows = 2 + Math.floor(level/4);
    let cols = Math.min(baseCols, 8);
    let rows = Math.min(baseRows, 5);
    let xSpacing = (canvas.width-80)/(cols-1);
    let yStart = 60;
    // Enemy types unlocked by level
    let types = [
        {name: 'basic', color: '#0f0', fireRate: 0.7, speed: 0.7, hp: 1},
        {name: 'fast', color: '#ff0', fireRate: 0.3, speed: 1.2, hp: 1},
        {name: 'tank', color: '#0ff', fireRate: 0.9, speed: 0.5, hp: 3},
        {name: 'sniper', color: '#f0f', fireRate: 0.15, speed: 0.7, hp: 1},
        {name: 'zigzag', color: '#f00', fireRate: 0.4, speed: 1.0, hp: 1}
    ];
    let maxType = 1;
    if (level >= 3) maxType = 2;
    if (level >= 5) maxType = 3;
    if (level >= 7) maxType = 4;
    // Set up formation spots
    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            let fx = 40 + i*xSpacing;
            let fy = yStart + j*44;
            formationSpots.push({x: fx, y: fy, taken: false});
        }
    }
    // Spawn enemies offscreen, assign them a formation spot
    let spotIdx = 0;
    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            let t = types[Math.min((i+j+level)%Math.min(types.length, maxType+1), maxType)];
            let entrySide = (i%2 === 0) ? 'left' : 'right';
            let ex = (entrySide === 'left') ? -40 : canvas.width+40;
            let ey = 40 + j*30 + Math.random()*30;
            let spot = formationSpots[spotIdx++];
            enemies.push({
                x: ex,
                y: ey,
                w: 32,
                h: 24,
                dx: 0,
                dy: 0,
                alive: true,
                color: t.color,
                type: t.name,
                hp: t.hp,
                zigzagPhase: Math.random()*Math.PI*2,
                state: ENEMY_STATE.ENTRANCE,
                formationX: spot.x,
                formationY: spot.y,
                entranceT: 0,
                fireCooldown: 60+Math.random()*60,
                attackTimer: 0
            });
        }
    }
}

function resetGame() {
    player.x = canvas.width/2;
    player.y = canvas.height-60;
    player.alive = true;
    player.power = 'normal';
    player.powerTimer = 0;
    player.shield = false;
    bullets = [];
    enemyBullets = [];
    powerups = [];
    score = 0;
    lives = 3;
    level = 1;
    levelTransition = 0;
    spawnEnemies();
}

function drawStarfield() {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = arcadeColors[i % arcadeColors.length];
        let sx = (i * 71) % canvas.width;
        let sy = ((i * 113 + Date.now() / 10) % canvas.height);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 500 + i);
        ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
}

function updateGame() {
    // Player movement
    let moveSpeed = player.speed + (player.power === 'speed' ? 2 : 0);
    if (keys['ArrowLeft'] && player.x > 20) player.x -= moveSpeed;
    if (keys['ArrowRight'] && player.x < canvas.width-20) player.x += moveSpeed;
    // Powerup timer
    if (player.power !== 'normal') {
        player.powerTimer--;
        if (player.powerTimer <= 0) {
            player.power = 'normal';
            player.shield = false;
        }
    }
    // Shooting
    if (keys[' '] && player.cooldown <= 0 && player.alive) {
        if (player.power === 'double') {
            bullets.push({x: player.x-7, y: player.y-16, vy: -9, type: 'double'});
            bullets.push({x: player.x+7, y: player.y-16, vy: -9, type: 'double'});
        } else {
            bullets.push({x: player.x, y: player.y-16, vy: -8, type: 'normal'});
        }
        player.cooldown = player.power === 'double' ? 10 : 16;
        playShootSound();
    }
    if (player.cooldown > 0) player.cooldown--;
    // Bullets
    bullets.forEach(b => b.y += b.vy);
    bullets = bullets.filter(b => b.y > -20);

    // --- Galaga-style enemy logic ---
    // 1. ENTRANCE: Enemies fly in a curve to their formation spot
    let allInFormation = true;
    enemies.forEach((e, idx) => {
        if (!e.alive) return;
        if (e.state === ENEMY_STATE.ENTRANCE) {
            e.entranceT += 0.018 + 0.002*level;
            // Swoop: parametric curve from (e.x, e.y) to (formationX, formationY)
            let t = e.entranceT;
            let sx = (idx%2===0) ? -40 : canvas.width+40;
            let sy = e.formationY + Math.sin(idx)*30;
            // Swoop in a loop
            e.x = sx + (e.formationX-sx)*0.5*(1-Math.cos(Math.PI*t));
            e.y = sy + (e.formationY-sy)*0.5*(1-Math.cos(Math.PI*t)) + Math.sin(Math.PI*t*2+idx)*10;
            if (t >= 1) {
                e.x = e.formationX;
                e.y = e.formationY;
                e.state = ENEMY_STATE.FORMATION;
            } else {
                allInFormation = false;
            }
        }
    });
    // 2. FORMATION: Enemies hold position, some break off to attack
    if (allInFormation) {
        // Attack queue: pick a few enemies to attack at a time
        if (attackQueue.length === 0 && Math.random() < 0.03 + 0.01*level) {
            let candidates = enemies.filter(e => e.state === ENEMY_STATE.FORMATION && e.alive);
            if (candidates.length > 0) {
                let nAttackers = Math.min(1+Math.floor(level/2), candidates.length);
                for (let i=0; i<nAttackers; i++) {
                    let pick = candidates[Math.floor(Math.random()*candidates.length)];
                    pick.state = ENEMY_STATE.ATTACK;
                    pick.attackTimer = 0;
                    attackQueue.push(pick);
                }
            }
        }
    }
    // 3. ATTACK: Enemies dive toward the player, then return to formation
    attackQueue = attackQueue.filter(e => e.alive && e.state === ENEMY_STATE.ATTACK);
    attackQueue.forEach(e => {
        if (!e.alive) return;
        e.attackTimer++;
        let t = e.attackTimer / 120;
        let px = player.x;
        let py = player.y;
        if (t < 1) {
            e.x += (px - e.x) * 0.05 + Math.sin(t * 8 + e.zigzagPhase) * 3;
            e.y += (py - e.y) * 0.05 + Math.abs(Math.sin(t * 4 + e.zigzagPhase)) * 3;
            if (e.fireCooldown <= 0 && Math.abs(e.x - px) < 50 && Math.random() < 0.3) {
                let dx = px - e.x;
                let dy = py - e.y;
                let mag = Math.sqrt(dx * dx + dy * dy);
                enemyBullets.push({ x: e.x, y: e.y + 10, vy: 3 + level * 0.1, vx: dx / mag * 2, type: e.type });
                e.fireCooldown = 30 + Math.random() * 20;
            }
        } else {
            e.x += (e.formationX - e.x) * 0.08;
            e.y += (e.formationY - e.y) * 0.08;
            if (Math.abs(e.x - e.formationX) < 2 && Math.abs(e.y - e.formationY) < 2) {
                e.x = e.formationX;
                e.y = e.formationY;
                e.state = ENEMY_STATE.FORMATION;
            }
        }
        e.fireCooldown--;
    });
    // 4. FORMATION: Enemies wiggle in place
    enemies.forEach(e => {
        if (!e.alive) return;
        if (e.state === ENEMY_STATE.FORMATION) {
            e.x = e.formationX + Math.sin(Date.now()/400 + e.formationY/30)*4;
            e.y = e.formationY + Math.sin(Date.now()/300 + e.formationX/40)*2;
        }
    });

    // --- End Galaga logic ---
    // Enemy bullets
    enemyBullets.forEach(b => {
        b.y += b.vy;
        if (b.vx) b.x += b.vx;
    });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height+20 && b.x > -10 && b.x < canvas.width+10);
    // Powerups
    powerups.forEach(p => p.y += 2);
    powerups = powerups.filter(p => p.y < canvas.height+20);
    // Collisions: bullets vs enemies
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (e.alive && Math.abs(b.x - e.x) < 18 && Math.abs(b.y - e.y) < 16) {
                e.hp--;
                if (e.hp <= 0) {
                    e.alive = false;
                    score += 100 + level * 10;
                    playExplosionSound();
                    // Spawn particles on enemy destruction
                    for (let i = 0; i < 12; i++) {
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            size: 2 + Math.random() * 2,
                            alpha: 1,
                            color: e.color,
                            life: 30 + Math.random() * 20
                        });
                    }
                    e.alive = false;
                    score += 100 + level * 10;
                    playExplosionSound();
                    if (Math.random() < 0.2) {
                        powerups.push({ x: e.x, y: e.y, type: ['double', 'shield', 'speed'][Math.floor(Math.random() * 3)] });
                    }
                }
                bullets.splice(bi, 1);
            }
        });
    });
    // Destroy enemy bullets with player bullets
    bullets.forEach((b, bi) => {
        enemyBullets.forEach((eb, ei) => {
            if (Math.abs(b.x-eb.x)<7 && Math.abs(b.y-eb.y)<12) {
                bullets.splice(bi,1);
                enemyBullets.splice(ei,1);
            }
        });
    });
    // Remove dead enemies
    enemies = enemies.filter(e => e.alive);
    // Powerup pickup
    powerups.forEach((p, pi) => {
        if (player.alive && Math.abs(p.x-player.x)<18 && Math.abs(p.y-player.y)<18) {
            if (p.type === 'double') {
                player.power = 'double';
                player.powerTimer = 600 + level*60;
            } else if (p.type === 'shield') {
                player.power = 'shield';
                player.powerTimer = 500 + level*40;
                player.shield = true;
            } else if (p.type === 'speed') {
                player.power = 'speed';
                player.powerTimer = 500 + level*40;
            }
            powerups.splice(pi,1);
        }
    });
    // Enemy bullet hits player
    enemyBullets.forEach((b, bi) => {
        if (player.alive && Math.abs(b.x-player.x)<14 && Math.abs(b.y-player.y)<16) {
            if (player.shield) {
                player.shield = false;
                player.power = 'normal';
                enemyBullets.splice(bi,1);
            } else {
                lives--;
                player.alive = false;
                playExplosionSound();
                setTimeout(()=>{
                    if (lives > 0) {
                        player.x = canvas.width/2;
                        player.y = canvas.height-60;
                        player.alive = true;
                    } else {
                        state = GAME_STATE.GAME_OVER;
                    }
                }, 1000);
            }
        }
    });
    // Win condition: next level
    if (enemies.length === 0 && levelTransition === 0) {
        levelTransition = 60;
    }
    if (levelTransition > 0) {
        levelTransition--;
        if (levelTransition === 0) {
            level++;
            spawnEnemies();
        }
    }
}

// Enhanced particle effects for explosions
function drawParticles() {
    particles.forEach((p, idx) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(idx, 1);
    });
}

function drawGame() {
    // Improved background rendering
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Enhanced starfield
    for (let i = 0; i < 150; i++) {
        ctx.save();
        ctx.fillStyle = arcadeColors[i % arcadeColors.length];
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 500 + i);
        let sx = (i * 89) % canvas.width;
        let sy = ((i * 137 + Date.now() / 8) % canvas.height);
        ctx.fillRect(sx, sy, 2, 2);
        ctx.restore();
    }
    // Entities
    if (player.alive) drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(e => { if (e.alive) drawEnemy(e); });
    enemyBullets.forEach(drawEnemyBullet);
    powerups.forEach(drawPowerup);
    drawParticles();
    drawHUD();
    // Level transition
    if (levelTransition > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + (level + 1), canvas.width / 2, canvas.height / 2 + 10);
        ctx.restore();
    }
}

function drawGameOver() {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2-20);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: ' + score, canvas.width/2, canvas.height/2+20);
    ctx.fillStyle = '#0ff';
    ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height/2+60);
    ctx.restore();
}

// --- Sound Generation ---
let audioCtx = null;
function playShootSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.value = 0.1;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.frequency.linearRampToValueAtTime(440, audioCtx.currentTime+0.08);
    o.stop(audioCtx.currentTime+0.09);
}
function playExplosionSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 220;
    g.gain.value = 0.2;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.frequency.linearRampToValueAtTime(60, audioCtx.currentTime+0.18);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.2);
    o.stop(audioCtx.currentTime+0.21);
}

// --- Main Loop ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame
    if (state === GAME_STATE.SPLASH) {
        drawArcadeSplash();
    } else if (state === GAME_STATE.PLAYING) {
        updateGame();
        drawGame();
    } else if (state === GAME_STATE.GAME_OVER) {
        drawGame();
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (state === GAME_STATE.SPLASH && e.key === ' ') {
        resetGame();
        state = GAME_STATE.PLAYING;
    }
    if (state === GAME_STATE.GAME_OVER && e.key === ' ') {
        resetGame();
        state = GAME_STATE.PLAYING;
    }
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

gameLoop();
