// ============================================
// OBJECT POOL SYSTEM
// Pre-allocated objects for better performance
// ============================================

const ObjectPool = {
    // Bullet pool
    bulletPool: [],
    bulletPoolSize: 50,
    nextBulletIndex: 0,
    
    // Enemy bullet pool
    enemyBulletPool: [],
    enemyBulletPoolSize: 100,
    nextEnemyBulletIndex: 0,
    
    // Particle pool
    particlePool: [],
    particlePoolSize: 250,
    nextParticleIndex: 0,
    
    // Initialize all pools
    init() {
        this.initBulletPool();
        this.initEnemyBulletPool();
        this.initParticlePool();
        
        console.log(`✅ Object pools initialized (bullets: ${this.bulletPoolSize}, enemy bullets: ${this.enemyBulletPoolSize}, particles: ${this.particlePoolSize})`);
        return this;
    },
    
    // Initialize bullet pool
    initBulletPool() {
        this.bulletPool = [];
        for (let i = 0; i < this.bulletPoolSize; i++) {
            this.bulletPool.push({
                x: 0,
                y: 0,
                w: 3,
                h: 8,
                speed: 400,
                from: 'player',
                active: false
            });
        }
    },
    
    // Initialize enemy bullet pool
    initEnemyBulletPool() {
        this.enemyBulletPool = [];
        for (let i = 0; i < this.enemyBulletPoolSize; i++) {
            this.enemyBulletPool.push({
                x: 0,
                y: 0,
                w: 4,
                h: 6,
                speed: 200,
                from: 'enemy',
                active: false,
                vx: 0,
                vy: 0
            });
        }
    },
    
    // Initialize particle pool
    initParticlePool() {
        this.particlePool = [];
        for (let i = 0; i < this.particlePoolSize; i++) {
            this.particlePool.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                life: 0,
                maxLife: 1,
                color: '#fff',
                size: 2,
                active: false
            });
        }
    },
    
    // Get bullet from pool - optimized with round-robin allocation
    getBullet(x, y, speed = 400, from = 'player') {
        // Try round-robin first for better distribution
        for (let i = 0; i < this.bulletPoolSize; i++) {
            const index = (this.nextBulletIndex + i) % this.bulletPoolSize;
            const bullet = this.bulletPool[index];
            if (!bullet.active) {
                bullet.x = x;
                bullet.y = y;
                bullet.speed = speed;
                bullet.from = from;
                bullet.active = true;
                this.nextBulletIndex = (index + 1) % this.bulletPoolSize;
                return bullet;
            }
        }
        return null; // Pool exhausted
    },
    
    // Get enemy bullet from pool - optimized with round-robin allocation
    getEnemyBullet(x, y, vx, vy, speed = 200) {
        for (let i = 0; i < this.enemyBulletPoolSize; i++) {
            const index = (this.nextEnemyBulletIndex + i) % this.enemyBulletPoolSize;
            const bullet = this.enemyBulletPool[index];
            if (!bullet.active) {
                bullet.x = x;
                bullet.y = y;
                bullet.vx = vx;
                bullet.vy = vy;
                bullet.speed = speed;
                bullet.from = 'enemy';
                bullet.active = true;
                this.nextEnemyBulletIndex = (index + 1) % this.enemyBulletPoolSize;
                return bullet;
            }
        }
        return null; // Pool exhausted
    },
    
    // Get particle from pool - optimized with round-robin allocation
    getParticle(x, y, vx, vy, color, size = 2, life = 1) {
        for (let i = 0; i < this.particlePoolSize; i++) {
            const index = (this.nextParticleIndex + i) % this.particlePoolSize;
            const particle = this.particlePool[index];
            if (!particle.active) {
                particle.x = x;
                particle.y = y;
                particle.vx = vx;
                particle.vy = vy;
                particle.color = color;
                particle.size = size;
                particle.life = life;
                particle.maxLife = life;
                particle.active = true;
                this.nextParticleIndex = (index + 1) % this.particlePoolSize;
                return particle;
            }
        }
        return null; // Pool exhausted
    },
    
    // Return bullet to pool
    returnBullet(bullet) {
        bullet.active = false;
    },
    
    // Return enemy bullet to pool
    returnEnemyBullet(bullet) {
        bullet.active = false;
    },
    
    // Return particle to pool
    returnParticle(particle) {
        particle.active = false;
    },
    
    // Get all active bullets
    getActiveBullets() {
        return this.bulletPool.filter(b => b.active);
    },
    
    // Get all active enemy bullets
    getActiveEnemyBullets() {
        return this.enemyBulletPool.filter(b => b.active);
    },
    
    // Get all active particles
    getActiveParticles() {
        return this.particlePool.filter(p => p.active);
    },
    
    // Reset all pools
    reset() {
        this.bulletPool.forEach(b => b.active = false);
        this.enemyBulletPool.forEach(b => b.active = false);
        this.particlePool.forEach(p => p.active = false);
        // Reset indices
        this.nextBulletIndex = 0;
        this.nextEnemyBulletIndex = 0;
        this.nextParticleIndex = 0;
    },
    
    // Get pool statistics
    getStats() {
        return {
            bullets: {
                total: this.bulletPoolSize,
                active: this.bulletPool.filter(b => b.active).length,
                available: this.bulletPool.filter(b => !b.active).length
            },
            enemyBullets: {
                total: this.enemyBulletPoolSize,
                active: this.enemyBulletPool.filter(b => b.active).length,
                available: this.enemyBulletPool.filter(b => !b.active).length
            },
            particles: {
                total: this.particlePoolSize,
                active: this.particlePool.filter(p => p.active).length,
                available: this.particlePool.filter(p => !p.active).length
            }
        };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectPool;
}
