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
};

// Bullets
let bullets = [];

// Enemies
let enemies = [];
let enemyBullets = [];
let score = 0;
let lives = 3;

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
    // Ship body
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(16, 12);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
    // Neon outline
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Red tip
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, 0);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.fillRect(b.x-2, b.y-8, 4, 12);
    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    // Body
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5, -2, 2, 0, Math.PI*2);
    ctx.arc(5, -2, 2, 0, Math.PI*2);
    ctx.fill();
    // Neon outline
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 2;
    ctx.stroke();
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
    ctx.restore();
}

function spawnEnemies() {
    enemies = [];
    for (let i=0; i<6; i++) {
        for (let j=0; j<3; j++) {
            enemies.push({
                x: 60 + i*60,
                y: 60 + j*50,
                w: 28,
                h: 20,
                dx: (Math.random()-0.5)*2,
                dy: 0,
                alive: true,
                fireCooldown: Math.random()*120+60
            });
        }
    }
}

function resetGame() {
    player.x = canvas.width/2;
    player.y = canvas.height-60;
    player.alive = true;
    bullets = [];
    enemyBullets = [];
    score = 0;
    lives = 3;
    spawnEnemies();
}

function updateGame() {
    // Player movement
    if (keys['ArrowLeft'] && player.x > 20) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width-20) player.x += player.speed;
    // Shooting
    if (keys[' '] && player.cooldown <= 0 && player.alive) {
        bullets.push({x: player.x, y: player.y-16, vy: -8});
        player.cooldown = 18;
        playShootSound();
    }
    if (player.cooldown > 0) player.cooldown--;
    // Bullets
    bullets.forEach(b => b.y += b.vy);
    bullets = bullets.filter(b => b.y > -20);
    // Enemies
    enemies.forEach(e => {
        e.x += e.dx;
        if (e.x < 30 || e.x > canvas.width-30) e.dx *= -1;
        e.fireCooldown--;
        if (e.fireCooldown < 0 && e.alive) {
            enemyBullets.push({x: e.x, y: e.y+10, vy: 4});
            e.fireCooldown = Math.random()*120+60;
        }
    });
    // Enemy bullets
    enemyBullets.forEach(b => b.y += b.vy);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height+20);
    // Collisions
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (e.alive && Math.abs(b.x-e.x)<16 && Math.abs(b.y-e.y)<14) {
                e.alive = false;
                bullets.splice(bi,1);
                score += 100;
                playExplosionSound();
            }
        });
    });
    // Remove dead enemies
    enemies = enemies.filter(e => e.alive);
    // Enemy bullet hits player
    enemyBullets.forEach((b, bi) => {
        if (player.alive && Math.abs(b.x-player.x)<14 && Math.abs(b.y-player.y)<16) {
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
    });
    // Win condition
    if (enemies.length === 0) {
        spawnEnemies();
    }
}

function drawGame() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Starfield
    for (let i=0; i<80; i++) {
        ctx.fillStyle = arcadeColors[i%arcadeColors.length];
        let sx = (i*53)%canvas.width;
        let sy = ((i*97 + Date.now()/10)%canvas.height);
        ctx.fillRect(sx, sy, 2, 2);
    }
    // Entities
    if (player.alive) drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(drawEnemyBullet);
    drawHUD();
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
