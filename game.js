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
    // Improved bug body
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = e.color || '#0f0';
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
    // Antennae
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -8); ctx.lineTo(-8, -16);
    ctx.moveTo(4, -8); ctx.lineTo(8, -16);
    ctx.stroke();
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
    let cols = 5 + Math.min(level, 5); // up to 10 columns
    let rows = 2 + Math.floor(level/2); // more rows as level increases
    let colors = ['#0f0', '#f0f', '#ff0', '#0ff', '#f00'];
    for (let i=0; i<cols; i++) {
        for (let j=0; j<rows; j++) {
            enemies.push({
                x: 40 + i*((canvas.width-80)/(cols-1)),
                y: 60 + j*44,
                w: 32,
                h: 24,
                dx: (Math.random()-0.5)*(1+level*0.2),
                dy: 0,
                alive: true,
                fireCooldown: Math.random()*(100-Math.min(level*8,80))+40,
                color: colors[(i+j+level)%colors.length],
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
    // Enemies
    enemies.forEach(e => {
        e.x += e.dx;
        // Sine wave movement for higher levels
        if (level > 2) e.y += Math.sin(Date.now()/400 + e.x/40) * 0.7 * (level-1);
        if (e.x < 30 || e.x > canvas.width-30) e.dx *= -1;
        e.fireCooldown--;
        if (e.fireCooldown < 0 && e.alive) {
            enemyBullets.push({x: e.x, y: e.y+10, vy: 3.5 + level*0.2});
            e.fireCooldown = Math.random()*(100-Math.min(level*8,80))+40;
        }
    });
    // Enemy bullets
    enemyBullets.forEach(b => b.y += b.vy);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height+20);
    // Powerups
    powerups.forEach(p => p.y += 2);
    powerups = powerups.filter(p => p.y < canvas.height+20);
    // Collisions: bullets vs enemies
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (e.alive && Math.abs(b.x-e.x)<18 && Math.abs(b.y-e.y)<16) {
                e.alive = false;
                bullets.splice(bi,1);
                score += 100 + level*10;
                playExplosionSound();
                // Powerup drop chance
                if (Math.random() < 0.12 + 0.01*level) {
                    let types = ['double','shield','speed'];
                    let type = types[Math.floor(Math.random()*types.length)];
                    powerups.push({x: e.x, y: e.y, type});
                }
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

function drawGame() {
    // Animated starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i=0; i<100; i++) {
        ctx.save();
        let color = arcadeColors[i%arcadeColors.length];
        ctx.globalAlpha = 0.7 + 0.3*Math.sin(Date.now()/800 + i);
        ctx.fillStyle = color;
        let sx = (i*53)%canvas.width;
        let sy = ((i*97 + Date.now()/12 + i*13)%canvas.height);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + 1.5*Math.abs(Math.sin(Date.now()/1000 + i)), 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    // Entities
    if (player.alive) drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(drawEnemyBullet);
    powerups.forEach(drawPowerup);
    drawHUD();
    // Level transition
    if (levelTransition > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, canvas.height/2-40, canvas.width, 80);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + (level+1), canvas.width/2, canvas.height/2+10);
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
