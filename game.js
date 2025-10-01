// Galaga-inspired Arcade Game
// All assets generated from code

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- AUDIO ENGINE (Web Audio API) ---
const AudioEngine = {
    context: null,
    masterVolume: 0.3,
    enabled: true,
    
    // Initialize audio context
    init() {
        try {
            // Create audio context (handles browser prefixes)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Resume on user interaction (required by browsers)
            document.addEventListener('click', () => this.resume(), { once: true });
            document.addEventListener('keydown', () => this.resume(), { once: true });
            document.addEventListener('touchstart', () => this.resume(), { once: true });
            
            console.log('Audio Engine initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    },
    
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },
    
    // Master volume control
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    },
    
    // Play player shoot sound
    playerShoot() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Create oscillator for "pew" sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Sharp, high-pitched laser
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        
        // Quick attack, fast decay
        gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    },
    
    // Enemy shoot sound (lower pitch)
    enemyShoot() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Lower, more menacing
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    },
    
    // Explosion sound (enemy destroyed)
    explosion() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // White noise explosion
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate noise with decay
        for (let i = 0; i < bufferSize; i++) {
            const decay = 1 - (i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * decay;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.3);
    },
    
    // Hit sound (bullet hits enemy but doesn't destroy)
    hit() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    },
    
    // Bullet collision (shooting enemy bullet)
    bulletHit() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        osc.start(now);
        osc.stop(now + 0.03);
    },
    
    // Power-up collected
    powerup() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (octave)
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            
            gain.gain.setValueAtTime(this.masterVolume * 0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    },
    
    // Player death
    playerDeath() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Descending sweep
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.8);
        
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(25, now + 0.8);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
    },
    
    // Level complete
    levelComplete() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Victory fanfare
        const melody = [
            { freq: 523.25, time: 0 },    // C
            { freq: 659.25, time: 0.15 },  // E
            { freq: 783.99, time: 0.3 },   // G
            { freq: 1046.50, time: 0.45 }  // C (octave)
        ];
        
        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now + note.time);
            
            gain.gain.setValueAtTime(this.masterVolume * 0.3, now + note.time);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.2);
            
            osc.start(now + note.time);
            osc.stop(now + note.time + 0.2);
        });
    },
    
    // Menu selection
    menuSelect() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    },
    
    // Background music (simple looping pattern)
    startBackgroundMusic() {
        if (!this.enabled || !this.context) return;
        
        // Simple ambient drone for atmosphere
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now); // Low A
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.05, now); // Very quiet
        
        osc.start(now);
        
        // Store reference to stop later if needed
        this.bgMusic = { osc, gain };
    },
    
    stopBackgroundMusic() {
        if (this.bgMusic) {
            const now = this.context.currentTime;
            this.bgMusic.gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            this.bgMusic.osc.stop(now + 0.5);
            this.bgMusic = null;
        }
    }
};

const GAME_STATE = {
    SPLASH: 'splash',
    PLAYING: 'playing',
    PAUSED: 'paused', // New state for pausing
    GAME_OVER: 'gameover',
    ENTER_HIGH_SCORE: 'enterhighscore', // New state for entering high score
};

// Game constants - consolidate frequently used values to avoid recalculations
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const PLAYER_START_X = CANVAS_WIDTH / 2;
const PLAYER_START_Y = CANVAS_HEIGHT - 60;

let state = GAME_STATE.SPLASH;
let splashTimer = 0;
let keys = {};
let previousStateBeforePause = null; // To store state before pausing
let lastTime = 0; // For delta time calculation
let dt = 0; // Store delta time for consistent usage

// Object pools for frequently created/destroyed objects
const POOL = {
    bullets: [],
    enemyBullets: [],
    particles: [],
    MAX_BULLETS: 50,
    MAX_ENEMY_BULLETS: 50,
    MAX_PARTICLES: 150
};

// --- Graphics Optimization System ---
const GraphicsOptimizer = {
    // Quality levels and settings
    qualityLevel: 'high', // 'low', 'medium', 'high'
    adaptiveQuality: true,
    targetFPS: 60,
    
    // Performance monitoring
    frameCount: 0,
    frameTime: 0,
    lastFrameTime: performance.now(),
    avgFrameTime: 16.67, // Target 60fps = 16.67ms per frame
    performanceHistory: [],
    lastQualityAdjustment: 0,
    renderTime: 0,
    updateTime: 0,
    culledObjects: 0,
    renderedObjects: 0,
    lastPerformanceLog: 0,
    renderStartTime: 0,
    updateStartTime: 0,
    
    // Caching systems
    pathCache: new Map(),
    gradientCache: new Map(),
    textCache: new Map(),
    imageCache: new Map(),
    cacheTimestamps: new Map(),
    maxCacheAge: 30000, // 30 seconds
    
    // Viewport culling
    viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        padding: 50 // Extra padding for smooth transitions
    },
    
    // LOD (Level of Detail) system
    lodDistances: {
        high: 150,    // Full detail within 150px
        medium: 300,  // Medium detail 150-300px
        low: 500      // Low detail 300-500px, cull beyond 500px
    },
    
    // Dirty rectangle system
    dirtyRects: [],
    fullRedraw: true,
    
    // Enhanced batching system
    batchedDraw: {
        bullets: [],
        particles: [],
        enemies: [],
        effects: [],
        stars: [],
        
        // Batch size limits to prevent memory issues
        maxBatchSize: 1000,
        
        add(type, x, y, data) {
            if (!this[type]) this[type] = [];
            
            // Prevent batch overflow
            if (this[type].length >= this.maxBatchSize) {
                this.flushType(type);
            }
            
            this[type].push({ x, y, ...data });
        },
        
        flush() {
            this.flushBullets();
            this.flushParticles();
            this.flushEnemies();
            this.flushEffects();
            this.flushStars();
            this.clear();
        },
        
        flushType(type) {
            switch(type) {
                case 'bullets': this.flushBullets(); break;
                case 'particles': this.flushParticles(); break;
                case 'enemies': this.flushEnemies(); break;
                case 'effects': this.flushEffects(); break;
                case 'stars': this.flushStars(); break;
            }
            this[type].length = 0;
        },
        
        flushBullets() {
            if (this.bullets.length === 0) return;
            
            const renderStart = performance.now();
            ctx.save();
            
            // Group bullets by color for fewer state changes
            const bulletsByColor = new Map();
            this.bullets.forEach(bullet => {
                const color = bullet.color || '#ff0';
                if (!bulletsByColor.has(color)) {
                    bulletsByColor.set(color, []);
                }
                bulletsByColor.get(color).push(bullet);
            });
            
            // Render each color group
            bulletsByColor.forEach((bullets, color) => {
                ctx.fillStyle = color;
                bullets.forEach(bullet => {
                    ctx.fillRect(bullet.x - 1, bullet.y - 6, 2, 12);
                });
            });
            
            ctx.restore();
            GraphicsOptimizer.renderTime += performance.now() - renderStart;
        },
        
        flushParticles() {
            if (this.particles.length === 0) return;
            
            const renderStart = performance.now();
            ctx.save();
            
            // Sort particles by alpha and color for optimal batching
            this.particles.sort((a, b) => {
                const alphaCompare = (a.alpha || 1) - (b.alpha || 1);
                if (alphaCompare !== 0) return alphaCompare;
                return (a.color || '#fff').localeCompare(b.color || '#fff');
            });
            
            let currentAlpha = -1;
            let currentColor = '';
            
            this.particles.forEach(particle => {
                const alpha = particle.alpha || 1;
                const color = particle.color || '#fff';
                
                if (alpha !== currentAlpha) {
                    ctx.globalAlpha = alpha;
                    currentAlpha = alpha;
                }
                
                if (color !== currentColor) {
                    ctx.fillStyle = color;
                    currentColor = color;
                }
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
            GraphicsOptimizer.renderTime += performance.now() - renderStart;
        },
        
        flushEnemies() {
            if (this.enemies.length === 0) return;
            
            const renderStart = performance.now();
            ctx.save();
            
            // Group enemies by color and render together
            const enemiesByColor = new Map();
            this.enemies.forEach(enemy => {
                const color = enemy.color || '#fff';
                if (!enemiesByColor.has(color)) {
                    enemiesByColor.set(color, []);
                }
                enemiesByColor.get(color).push(enemy);
            });
            
            enemiesByColor.forEach((enemies, color) => {
                ctx.fillStyle = color;
                enemies.forEach(enemy => {
                    ctx.fillRect(enemy.x - 8, enemy.y - 8, 16, 16);
                });
            });
            
            ctx.restore();
            GraphicsOptimizer.renderTime += performance.now() - renderStart;
        },
        
        flushEffects() {
            if (this.effects.length === 0) return;
            
            const renderStart = performance.now();
            ctx.save();
            
            this.effects.forEach(effect => {
                ctx.globalAlpha = effect.alpha || 1;
                ctx.fillStyle = effect.color || '#fff';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size || 5, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
            GraphicsOptimizer.renderTime += performance.now() - renderStart;
        },
        
        flushStars() {
            if (this.stars.length === 0) return;
            
            const renderStart = performance.now();
            ctx.save();
            
            // Batch render stars by brightness/size
            const starsByBrightness = new Map();
            this.stars.forEach(star => {
                const brightness = star.brightness || 1;
                if (!starsByBrightness.has(brightness)) {
                    starsByBrightness.set(brightness, []);
                }
                starsByBrightness.get(brightness).push(star);
            });
            
            starsByBrightness.forEach((stars, brightness) => {
                ctx.globalAlpha = brightness;
                ctx.fillStyle = '#fff';
                stars.forEach(star => {
                    ctx.fillRect(star.x, star.y, star.size || 1, star.size || 1);
                });
            });
            
            ctx.restore();
            GraphicsOptimizer.renderTime += performance.now() - renderStart;
        },
        
        clear() {
            this.bullets.length = 0;
            this.particles.length = 0;
            this.enemies.length = 0;
            this.effects.length = 0;
            this.stars.length = 0;
        }
    },
    
    // Memory management
    memoryUsage: {
        textures: 0,
        paths: 0,
        gradients: 0,
        total: 0,
        peakUsage: 0,
        lastCleanup: 0
    },
    
    // Optimization flags
    useOffscreenCanvas: false,
    useBatching: true,
    usePathCaching: true,
    useGradientCaching: true,
    useTextCaching: true,
    useDirtyRects: false, // Disabled by default for this simple game
    
    // Viewport culling functions
    isInViewport(x, y, width = 32, height = 32) {
        return x + width >= this.viewport.x - this.viewport.padding &&
               x <= this.viewport.x + this.viewport.width + this.viewport.padding &&
               y + height >= this.viewport.y - this.viewport.padding &&
               y <= this.viewport.y + this.viewport.height + this.viewport.padding;
    },
    
    getLODLevel(x, y, centerX, centerY) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distance <= this.lodDistances.high) return 'high';
        if (distance <= this.lodDistances.medium) return 'medium';
        if (distance <= this.lodDistances.low) return 'low';
        return 'cull'; // Don't render
    },
    
    shouldCull(x, y, width = 32, height = 32) {
        // Skip viewport check if disabled
        if (!this.useDirtyRects) return false;
        
        return !this.isInViewport(x, y, width, height);
    },
    
    // Optimization flags
    useOffscreenCanvas: false,
    useBatching: true,
    usePathCaching: true,
    useGradientCaching: true,
    useTextCaching: true,
    useDirtyRects: false, // Disabled by default for this simple game
    
    init() {
        this.detectCapabilities();
        this.initializePathCache();
        this.adjustQualityBasedOnDevice();
        this.startPerformanceMonitoring();
        console.log(`Graphics Optimizer initialized - Quality: ${this.qualityLevel}`);
    },
    
    detectCapabilities() {
        // Detect if we should use offscreen canvas
        this.useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
        
        // Detect GPU capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('GPU Renderer:', renderer);
                
                // Adjust quality based on GPU
                if (renderer.includes('Intel') && renderer.includes('HD')) {
                    this.qualityLevel = 'medium';
                } else if (renderer.includes('Software') || renderer.includes('llvmpipe')) {
                    this.qualityLevel = 'low';
                }
            }
        }
    },
    
    adjustQualityBasedOnDevice() {
        // Check if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : this.qualityLevel;
        }
        
        // Check CPU cores (rough performance indicator)
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            this.qualityLevel = 'low';
        }
        
        // Check available memory
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : 'low';
        }
    },
    
    startPerformanceMonitoring() {
        if (!this.adaptiveQuality) return;
        
        setInterval(() => {
            this.analyzePerformance();
        }, 2000); // Check every 2 seconds
    },
      frameRendered() {
        const now = performance.now();
        this.frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.frameCount++;
        
        // Update rolling average
        this.performanceHistory.push(this.frameTime);
        if (this.performanceHistory.length > 60) { // Keep last 60 frames
            this.performanceHistory.shift();
        }
        
        this.avgFrameTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
        
        // Reset per-frame counters
        this.culledObjects = 0;
        this.renderedObjects = 0;
        this.renderTime = 0;
        this.updateTime = 0;
        
        // Log performance periodically
        if (now - this.lastPerformanceLog > 5000) { // Every 5 seconds
            this.logPerformanceMetrics();
            this.lastPerformanceLog = now;
        }
    },
    
    logPerformanceMetrics() {
        const fps = Math.round(1000 / this.avgFrameTime);
        const renderPercent = Math.round((this.renderTime / this.frameTime) * 100);
        const updatePercent = Math.round((this.updateTime / this.frameTime) * 100);
        
        console.log(`Performance: ${fps}fps | Render: ${renderPercent}% | Update: ${updatePercent}% | Culled: ${this.culledObjects} | Rendered: ${this.renderedObjects}`);
    },
    
    analyzePerformance() {
        if (!this.adaptiveQuality || this.performanceHistory.length < 30) return;
        
        const targetFrameTime = 1000 / this.targetFPS; // 16.67ms for 60fps
        const currentFPS = 1000 / this.avgFrameTime;
        const now = performance.now();
        
        // Don't adjust too frequently
        if (now - this.lastQualityAdjustment < 5000) return;
        
        if (currentFPS < this.targetFPS * 0.8) { // Performance is poor
            if (this.qualityLevel === 'high') {
                this.setQualityLevel('medium');
                this.lastQualityAdjustment = now;
                console.log('Performance degraded, reducing quality to medium');
            } else if (this.qualityLevel === 'medium') {
                this.setQualityLevel('low');
                this.lastQualityAdjustment = now;
                console.log('Performance degraded, reducing quality to low');
            }
        } else if (currentFPS > this.targetFPS * 1.1) { // Performance is good
            if (this.qualityLevel === 'low' && this.avgFrameTime < targetFrameTime * 0.7) {
                this.setQualityLevel('medium');
                this.lastQualityAdjustment = now;
                console.log('Performance improved, increasing quality to medium');
            } else if (this.qualityLevel === 'medium' && this.avgFrameTime < targetFrameTime * 0.5) {
                this.setQualityLevel('high');
                this.lastQualityAdjustment = now;
                console.log('Performance improved, increasing quality to high');
            }
        }
    },
    
    setQualityLevel(level) {
        this.qualityLevel = level;
        this.adjustSettings();
        this.clearCaches(); // Clear caches when quality changes
    },
    
    adjustSettings() {
        switch (this.qualityLevel) {
            case 'low':
                this.useBatching = true;
                this.usePathCaching = false;
                this.useGradientCaching = false;
                this.useTextCaching = true;
                break;
            case 'medium':
                this.useBatching = true;
                this.usePathCaching = true;
                this.useGradientCaching = true;
                this.useTextCaching = true;
                break;
            case 'high':
                this.useBatching = false;
                this.usePathCaching = true;
                this.useGradientCaching = true;
                this.useTextCaching = true;
                break;
        }
    },
    
    shouldRenderHighQuality() {
        return this.qualityLevel === 'high';
    },
    
    shouldRenderMediumQuality() {
        return this.qualityLevel === 'medium' || this.qualityLevel === 'high';
    },
    
    // Enhanced caching systems
    initializePathCache() {
        if (!this.usePathCaching) return;
        
        // Pre-cache common paths
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Player body path
        const playerBodyPath = new Path2D();
        playerBodyPath.moveTo(0, -12);
        playerBodyPath.lineTo(-12, 8);
        playerBodyPath.lineTo(-8, 6);
        playerBodyPath.lineTo(8, 6);
        playerBodyPath.lineTo(12, 8);
        playerBodyPath.closePath();
        this.pathCache.set('player_body', playerBodyPath);
        
        // Player cockpit path
        const cockpitPath = new Path2D();
        cockpitPath.moveTo(0, -8);
        cockpitPath.lineTo(-4, 0);
        cockpitPath.lineTo(4, 0);
        cockpitPath.closePath();
        this.pathCache.set('player_cockpit', cockpitPath);
        
        // Basic bullet path
        const bulletPath = new Path2D();
        bulletPath.rect(-1.5, -12, 3, 10);
        bulletPath.moveTo(0, -14);
        bulletPath.lineTo(2, -10);
        bulletPath.lineTo(-2, -10);
        bulletPath.closePath();
        this.pathCache.set('basic_bullet', bulletPath);
        
        console.log('Path cache initialized with pre-cached shapes');
    },
      getGradient(key, createFn) {
        if (!this.useGradientCaching) return createFn();
        
        if (this.gradientCache.has(key)) {
            // Update timestamp for cache management
            this.cacheTimestamps.set(key, performance.now());
            return this.gradientCache.get(key);
        }
        
        const gradient = createFn();
        this.gradientCache.set(key, gradient);
        this.cacheTimestamps.set(key, performance.now());
        this.updateMemoryUsage();
        return gradient;
    },
    
    getText(key, createFn) {
        if (!this.useTextCaching) return createFn();
        
        if (this.textCache.has(key)) {
            this.cacheTimestamps.set(key, performance.now());
            return this.textCache.get(key);
        }
        
        const text = createFn();
        this.textCache.set(key, text);
        this.cacheTimestamps.set(key, performance.now());
        return text;
    },
    
    getPath(key, createFn) {
        if (!this.usePathCaching) return createFn();
        
        if (this.pathCache.has(key)) {
            this.cacheTimestamps.set(key, performance.now());
            return this.pathCache.get(key);
        }
        
        const path = createFn();
        this.pathCache.set(key, path);
        this.cacheTimestamps.set(key, performance.now());
        this.updateMemoryUsage();
        return path;
    },
    
    // Dirty rectangle system (for advanced optimization)
    addDirtyRect(x, y, width, height) {
        if (!this.useDirtyRects) return;
        
        this.dirtyRects.push({
            x: Math.floor(x - 5), // Add small padding
            y: Math.floor(y - 5),
            width: Math.ceil(width + 10),
            height: Math.ceil(height + 10)
        });
    },
    
    clearDirtyRects() {
        this.dirtyRects.length = 0;
        this.fullRedraw = false;
    },
    
    shouldRedrawRegion(x, y, width, height) {
        if (this.fullRedraw || !this.useDirtyRects) return true;
        
        return this.dirtyRects.some(rect => 
            x < rect.x + rect.width &&
            x + width > rect.x &&
            y < rect.y + rect.height &&
            y + height > rect.y
        );
    },
      // Enhanced memory management
    updateMemoryUsage() {
        const now = performance.now();
        this.memoryUsage.paths = this.pathCache.size;
        this.memoryUsage.gradients = this.gradientCache.size;
        this.memoryUsage.total = this.memoryUsage.paths + this.memoryUsage.gradients + this.textCache.size;
        
        // Track peak usage
        if (this.memoryUsage.total > this.memoryUsage.peakUsage) {
            this.memoryUsage.peakUsage = this.memoryUsage.total;
        }
        
        // Automatic cache cleanup every 10 seconds
        if (now - this.memoryUsage.lastCleanup > 10000) {
            this.cleanupExpiredCache();
            this.memoryUsage.lastCleanup = now;
        }
        
        // Clear caches if they get too large
        if (this.memoryUsage.total > 200) {
            this.clearOldCacheEntries();
        }
    },
    
    cleanupExpiredCache() {
        const now = performance.now();
        const expiredKeys = [];
        
        // Find expired cache entries
        this.cacheTimestamps.forEach((timestamp, key) => {
            if (now - timestamp > this.maxCacheAge) {
                expiredKeys.push(key);
            }
        });
        
        // Remove expired entries
        expiredKeys.forEach(key => {
            this.pathCache.delete(key);
            this.gradientCache.delete(key);
            this.textCache.delete(key);
            this.cacheTimestamps.delete(key);
        });
        
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
        }
    },
    
    clearOldCacheEntries() {
        // Keep only the most essential cached items
        const essentialPaths = ['player_body', 'player_cockpit', 'basic_bullet'];
        const newPathCache = new Map();
        
        essentialPaths.forEach(key => {
            if (this.pathCache.has(key)) {
                newPathCache.set(key, this.pathCache.get(key));
                this.cacheTimestamps.set(key, performance.now());
            }
        });
        
        this.pathCache = newPathCache;
        this.gradientCache.clear();
        this.textCache.clear();
        
        // Clean up timestamps
        const keysToKeep = new Set(essentialPaths);
        this.cacheTimestamps.forEach((value, key) => {
            if (!keysToKeep.has(key)) {
                this.cacheTimestamps.delete(key);
            }
        });
        
        console.log('Cache cleared to free memory - kept essential paths');
    },
    
    clearCaches() {
        this.pathCache.clear();
        this.gradientCache.clear();
        this.textCache.clear();
        this.initializePathCache();
    },
      // Enhanced performance metrics
    getPerformanceInfo() {
        return {
            qualityLevel: this.qualityLevel,
            avgFPS: Math.round(1000 / this.avgFrameTime),
            frameTime: Math.round(this.avgFrameTime * 100) / 100,
            renderTime: Math.round(this.renderTime * 100) / 100,
            updateTime: Math.round(this.updateTime * 100) / 100,
            cacheSize: this.memoryUsage.total,
            peakCacheSize: this.memoryUsage.peakUsage,
            frameCount: this.frameCount,
            culledObjects: this.culledObjects,
            renderedObjects: this.renderedObjects,
            memoryEfficiency: Math.round((this.renderedObjects / Math.max(this.memoryUsage.total, 1)) * 100) / 100
        };
    },
    
    // Quality presets
    setLowQualityPreset() {
        this.qualityLevel = 'low';
        this.useBatching = true;
        this.usePathCaching = false;
        this.useGradientCaching = false;
        this.useTextCaching = true;
        this.useDirtyRects = false;
        console.log('Set to low quality preset');
    },
    
    setMediumQualityPreset() {
        this.qualityLevel = 'medium';
        this.useBatching = true;
        this.usePathCaching = true;
        this.useGradientCaching = true;
        this.useTextCaching = true;
        this.useDirtyRects = false;
        console.log('Set to medium quality preset');
    },
      setHighQualityPreset() {
        this.qualityLevel = 'high';
        this.useBatching = false;
        this.usePathCaching = true;
        this.useGradientCaching = true;
        this.useTextCaching = true;
        this.useDirtyRects = false;
        console.log('Set to high quality preset');
    },
    
    // Adaptive rendering functions
    startRenderTimer() {
        this.renderStartTime = performance.now();
    },
    
    endRenderTimer() {
        if (this.renderStartTime) {
            this.renderTime = performance.now() - this.renderStartTime;
        }
    },
    
    startUpdateTimer() {
        this.updateStartTime = performance.now();
    },
    
    endUpdateTimer() {
        if (this.updateStartTime) {
            this.updateTime = performance.now() - this.updateStartTime;
        }
    },
    
    // Object counting for performance metrics
    incrementRendered() {
        this.renderedObjects++;
    },
    
    incrementCulled() {
        this.culledObjects++;
    },
    
    // Dynamic viewport adjustment
    updateViewport(width, height) {
        this.viewport.width = width;
        this.viewport.height = height;
        
        // Adjust LOD distances based on viewport size
        const scale = Math.min(width, height) / 600; // Normalize to base 600px
        this.lodDistances.high = 150 * scale;
        this.lodDistances.medium = 300 * scale;
        this.lodDistances.low = 500 * scale;
    },
    
    // Render quality assessment
    shouldSkipSecondaryEffects() {
        return this.qualityLevel === 'low' || (this.qualityLevel === 'medium' && this.avgFrameTime > 20);
    },
    
    shouldReduceParticles() {
        return this.qualityLevel === 'low' || this.renderTime > this.frameTime * 0.7;
    },
    
    getParticleReductionFactor() {
        if (this.qualityLevel === 'low') return 0.3;
        if (this.qualityLevel === 'medium') return 0.7;
        return 1.0;
    }
};
// End of GraphicsOptimizer object

// Wave configuration for enemy behavior (will scale with level)
let waveConfig = {
    baseAttackChance: 0.0008, // Start easier - fewer attacks in early levels
    maxAttackers: 2, // Start with max 2 simultaneous attackers
    groupAttackChance: 0.05, // Start with low group attack probability
    divingSpeed: 150, // Start with slower diving speed
    bulletSpeed: 120, // Start with slower bullets for more reaction time
    returnToFormationChance: 0.7,
    attackCurveIntensity: 1,
    formationShootChance: 0.005, // Start with less formation shooting
    attackingShootChance: 0.015 // Start with less aggressive shooting while attacking
};

// Function to scale difficulty based on level
function updateDifficultyForLevel(currentLevel) {
    // Gradually increase difficulty every 2 levels
    const difficultyTier = Math.floor((currentLevel - 1) / 2);
    
    // Base attack chance: 0.0008 → 0.003 (caps at level 11)
    waveConfig.baseAttackChance = Math.min(0.0008 + difficultyTier * 0.0004, 0.003);
    
    // Max attackers: 2 → 5 (caps at level 13)
    waveConfig.maxAttackers = Math.min(2 + Math.floor(difficultyTier / 2), 5);
    
    // Group attack chance: 0.05 → 0.20 (caps at level 13)
    waveConfig.groupAttackChance = Math.min(0.05 + difficultyTier * 0.025, 0.20);
    
    // Diving speed: 150 → 200 (caps at level 11)
    waveConfig.divingSpeed = Math.min(150 + difficultyTier * 10, 200);
    
    // Bullet speed: 120 → 220 (caps at level 11)
    waveConfig.bulletSpeed = Math.min(120 + difficultyTier * 20, 220);
    
    // Formation shoot chance: 0.005 → 0.015 (caps at level 11)
    waveConfig.formationShootChance = Math.min(0.005 + difficultyTier * 0.002, 0.015);
    
    // Attacking shoot chance: 0.015 → 0.035 (caps at level 11)
    waveConfig.attackingShootChance = Math.min(0.015 + difficultyTier * 0.004, 0.035);
    
    console.log(`Level ${currentLevel} difficulty:`, {
        attackChance: waveConfig.baseAttackChance,
        maxAttackers: waveConfig.maxAttackers,
        groupAttackChance: waveConfig.groupAttackChance,
        divingSpeed: waveConfig.divingSpeed,
        bulletSpeed: waveConfig.bulletSpeed
    });
}

// Initialize object pools
function initObjectPools() {
    // Pre-allocate bullets
    for (let i = 0; i < POOL.MAX_BULLETS; i++) {
        POOL.bullets.push({
            active: false, x: 0, y: 0, w: 3, h: 12, 
            speed: 600, type: 'normal', from: 'player'
        });
    }
    
    // Pre-allocate enemy bullets
    for (let i = 0; i < POOL.MAX_ENEMY_BULLETS; i++) {
        POOL.enemyBullets.push({
            active: false, x: 0, y: 0, w: 4, h: 12,
            speed: 150, damage: 1, type: 'straight', from: 'enemy',
            color: '#fff', age: 0, angle: 0, wobble: 0
        });
    }
    
    // Pre-allocate particles
    for (let i = 0; i < POOL.MAX_PARTICLES; i++) {
        POOL.particles.push({
            active: false, x: 0, y: 0, vx: 0, vy: 0,
            size: 2, color: '#fff', life: 0, initialLife: 0
        });
    }
}

// Function to get an object from the pool
function getPoolObject(poolName) {
    const pool = POOL[poolName];
    for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
            pool[i].active = true;
            return pool[i];
        }
    }
    
    // If we can't find an inactive object, return the oldest one
    // This ensures we don't create new objects unnecessarily
    console.warn(`${poolName} pool exhausted, reusing oldest object`);
    return pool[0]; // Just reuse the first one as fallback
}

// Function to check if an entity is off-screen
function isOffScreen(entity) {
    return entity.x < -entity.w || entity.x > CANVAS_WIDTH + entity.w ||
           entity.y < -entity.h || entity.y > CANVAS_HEIGHT + entity.h;
}

// Arcade splash colors
const arcadeColors = ['#0ff', '#f0f', '#ff0', '#fff', '#0f0', '#f00', '#00f'];

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 32,
    h: 24,
    speed: 250, // Pixels per second
    cooldown: 0, // Seconds
    alive: true,
    power: 'normal', // 'normal', 'double', 'shield', 'speed'
    powerTimer: 0, // Seconds
    shield: false,
};

// Active game objects (using object pools for others)
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let score = 0;
let lives = 3;
let level = 1;
let levelTransition = 0; // Seconds for transition message

// Galaga-style enemy states
const ENEMY_STATE = {
    ENTRANCE: 'entrance',
    FORMATION: 'formation',
    ATTACK: 'attack',
};
let formationSpots = [];
let attackQueue = [];

// Add particle array - will reference active pooled objects
let particles = [];

// Add boss Galaga and captured ship mechanics
let bossGalaga = null;
let capturedShip = false;
let dualShip = false;
let highScore = 0;
let challengeStage = false;
let screenShake = 0; // Initialize screen shake variable

let playerInitials = ["_", "_", "_", "_", "_"]; // Increased to 5 initials
let currentInitialIndex = 0;
let autoShootActive = false; // For touch auto-shoot

// Touch Controls
let isTouchDevice = false;
let hasKeyboard = true; // Track if keyboard was used
const touchControls = {
    buttons: {
        left: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowLeft', label: '<' },
        right: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowRight', label: '>' },
        autoShoot: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: null, label: 'AUTO' }, // Key is null as it's a toggle
        fire: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'Space', label: 'O' }
    }
};

// --- Firebase Setup ---
const firebaseConfig = {
    apiKey: "AIzaSyB6VUKC89covzLlhUO7UMeILVCJVy1SPdc", // Replace with your actual API key if this is a placeholder
    authDomain: "galaga-e7527.firebaseapp.com",
    databaseURL: "https://galaga-e7527-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "galaga-e7527",
    storageBucket: "galaga-e7527.appspot.com", 
    messagingSenderId: "983420615265",
    appId: "1:983420615265:web:77861c68c1b93f92dd4820",
    measurementId: "G-R9Z2YFQ30C"
};

// Initialize Firebase
let database; // Declare globally
try {
    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        firebase.initializeApp(firebaseConfig);
        if (typeof firebase.database === 'function') {
            database = firebase.database();
        } else {
            console.error("Firebase database service is not available.");
            database = null;
        }
    } else {
        console.error("Firebase core SDK is not loaded.");
        database = null;
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
    database = null; // Ensure database is null on error
}

let firebaseHighScores = [];
const MAX_HIGH_SCORES = 10; // Max number of scores to store/display

// Graphics performance monitoring functions
window.showGraphicsPerformance = function() {
    const info = `
Graphics Performance Info:
- Quality Level: ${GraphicsOptimizer.qualityLevel}
- Average Frame Time: ${GraphicsOptimizer.avgFrameTime.toFixed(2)}ms
- Current FPS: ${(1000 / GraphicsOptimizer.avgFrameTime).toFixed(1)}
- Frame Count: ${GraphicsOptimizer.frameCount}
- Path Cache Size: ${GraphicsOptimizer.pathCache.size}
- Gradient Cache Size: ${GraphicsOptimizer.gradientCache.size}
- Text Cache Size: ${GraphicsOptimizer.textCache.size}
- Batching Enabled: ${GraphicsOptimizer.useBatching}
- Path Caching: ${GraphicsOptimizer.usePathCaching}
- Gradient Caching: ${GraphicsOptimizer.useGradientCaching}
    `;
    console.log(info);
    alert(info);
};

// Stars for background starfield
const stars = [];
let starsBackground = [];
const NUM_STARS = 100;

// Initialize stars for background animation
function initStars() {
    stars.length = 0;
    starsBackground = [];
    
    // Create 3 layers of stars with different speeds
    for (let layer = 0; layer < 3; layer++) {
        const layerStars = [];
        const count = layer === 0 ? NUM_STARS / 2 : NUM_STARS / 4;
        const speedFactor = layer === 0 ? 1 : (layer === 1 ? 1.5 : 2.5);
        
        for (let i = 0; i < count; i++) {
            layerStars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: layer === 0 ? Math.random() * 1 + 0.5 : 
                      layer === 1 ? Math.random() * 1.3 + 0.8 :
                      Math.random() * 1.8 + 1,
                speed: (Math.random() * 15 + 15) * speedFactor,
                brightness: layer === 0 ? Math.random() * 0.3 + 0.2 :
                           layer === 1 ? Math.random() * 0.6 + 0.3 :
                           Math.random() * 0.8 + 0.6
            });
        }
        
        starsBackground.push(layerStars);
    }
}

// Draw enhanced starfield with parallax scrolling effect
function drawStarfield(dt) {
    GraphicsOptimizer.startRenderTimer();
    
    const qualityMultiplier = GraphicsOptimizer.qualityLevel === 'low' ? 0.5 : 
                             GraphicsOptimizer.qualityLevel === 'medium' ? 0.75 : 1.0;
    
    // Use batching for improved performance
    if (GraphicsOptimizer.useBatching) {
        // Update and batch stars for rendering
        starsBackground.forEach((layerStars, layer) => {
            layerStars.forEach(star => {
                star.y += star.speed * dt;
                if (star.y > CANVAS_HEIGHT) {
                    star.y = -5;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
                
                GraphicsOptimizer.batchedDraw.add('stars', star.x, star.y, {
                    size: star.size * qualityMultiplier,
                    brightness: star.brightness
                });
            });
        });
        
        GraphicsOptimizer.batchedDraw.flushStars();
    } else {
        // Direct rendering for high quality
        ctx.save();
        starsBackground.forEach((layerStars, layer) => {
            layerStars.forEach(star => {
                star.y += star.speed * dt;
                if (star.y > CANVAS_HEIGHT) {
                    star.y = -5;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
                
                ctx.globalAlpha = star.brightness;
                ctx.fillStyle = '#fff';
                ctx.fillRect(star.x, star.y, star.size * qualityMultiplier, star.size * qualityMultiplier);
            });
        });
        ctx.restore();
    }
    
    GraphicsOptimizer.endRenderTimer();
}

// Optimized game loop with better timing
function gameLoop() {
    const currentTime = performance.now();
    // Delta time in seconds, capped to prevent spiral of death
    dt = Math.min(0.1, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    // Start performance monitoring
    GraphicsOptimizer.startUpdateTimer();

    // Clear canvas with a dark color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake if active
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 2;
        const shakeY = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(shakeX, shakeY);
        screenShake = Math.max(0, screenShake - dt * 60); // Decay screen shake
    }

    // Game state machine
    switch (state) {
        case GAME_STATE.SPLASH:
            updateSplash();
            drawArcadeSplash();
            break;
        case GAME_STATE.PLAYING:
            updateGameplay();
            drawGameplay();
            break;
        case GAME_STATE.PAUSED:
            drawGameplay();
            drawPauseScreen();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOver();
            break;
        case GAME_STATE.ENTER_HIGH_SCORE:
            drawEnterHighScoreScreen();
            break;
    }

    // Reset translation if screen shake was applied
    if (screenShake > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    GraphicsOptimizer.endUpdateTimer();
    GraphicsOptimizer.frameRendered();
    requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
    console.log('Initializing Galaga game...');
    
    // Initialize audio engine
    AudioEngine.init();
    
    // Initialize object pools
    initObjectPools();
    
    // Initialize stars for background
    initStars();
    
    // Setup formation for enemies
    setupFormation();
    
    // Initialize touch controls if on touch device
    initTouchControls();
    
    // Fetch high scores from Firebase
    fetchHighScores();
    
    // Set up keyboard event listeners
    document.addEventListener('keydown', (e) => {
        // Prevent default behavior for game keys
        if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyP', 'Enter'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Mark that keyboard was used (hide touch controls)
        if (!hasKeyboard) {
            hasKeyboard = true;
            console.log('Keyboard detected - hiding touch controls');
        }
        
        keys[e.code] = true;
        
        // Handle game state specific keys
        switch (state) {
            case GAME_STATE.SPLASH:
                if (e.code === 'Space' || e.code === 'Enter') {
                    AudioEngine.menuSelect();
                    state = GAME_STATE.PLAYING;
                    resetGame();
                }
                break;
                
            case GAME_STATE.GAME_OVER:
                if (e.code === 'Space' || e.code === 'Enter') {
                    AudioEngine.menuSelect();
                    state = GAME_STATE.SPLASH;
                    fetchHighScores();
                }
                break;
                
            case GAME_STATE.PLAYING:
                if (e.code === 'KeyP') {
                    handlePause();
                }
                break;
                
            case GAME_STATE.PAUSED:
                if (e.code === 'KeyP') {
                    handleResume();
                }
                break;
                
            case GAME_STATE.ENTER_HIGH_SCORE:
                handleHighScoreInput(e);
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    console.log('Game initialized successfully!');
    
    // Start the game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Setup enemy formation spots (Galaga-style grid formation)
function setupFormation() {
    formationSpots = [];
    const rows = 4;
    const cols = 8;
    const spacingX = 40;
    const spacingY = 30;
    const startX = (CANVAS_WIDTH - (cols - 1) * spacingX) / 2;
    const startY = 60;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            formationSpots.push({
                x: startX + c * spacingX,
                y: startY + r * spacingY,
                taken: false,
                row: r,
                col: c
            });
        }
    }
    
    console.log(`Formation setup complete with ${formationSpots.length} spots`);
}

// Get an empty spot in the formation for enemy placement
function getEmptyFormationSpot() {
    const availableSpots = formationSpots.filter(s => !s.taken);
    if (availableSpots.length > 0) {
        const spot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
        spot.taken = true;
        return spot;
    }
    return null; // No spot available
}

// Pause handling functions
function handlePause() {
    if (state === GAME_STATE.PLAYING) {
        previousStateBeforePause = state;
        state = GAME_STATE.PAUSED;
    }
}

function handleResume() {
    if (state === GAME_STATE.PAUSED && previousStateBeforePause) {
        state = previousStateBeforePause;
        previousStateBeforePause = null;
        lastTime = performance.now(); // Reset timing to prevent large dt
    }
}

// Initialize touch controls for mobile devices
function initTouchControls() {
    // Detect if device supports touch
    isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    
    // Assume devices with touch may not have keyboard initially
    // Will be updated if keyboard is detected
    hasKeyboard = !isTouchDevice;
    
    if (!isTouchDevice) {
        console.log('Touch controls not needed - desktop device detected');
        return;
    }
    
    console.log('Touch device detected - initializing touch controls');
    
    // Set up touch control button positions
    const buttonSize = 60;
    const margin = 20;
    const bottomMargin = 40;
    
    // Left movement button
    touchControls.buttons.left.x = margin;
    touchControls.buttons.left.y = CANVAS_HEIGHT - buttonSize - bottomMargin;
    touchControls.buttons.left.w = buttonSize;
    touchControls.buttons.left.h = buttonSize;
    
    // Right movement button
    touchControls.buttons.right.x = margin + buttonSize + 10;
    touchControls.buttons.right.y = CANVAS_HEIGHT - buttonSize - bottomMargin;
    touchControls.buttons.right.w = buttonSize;
    touchControls.buttons.right.h = buttonSize;
    
    // Auto-shoot toggle button
    touchControls.buttons.autoShoot.x = CANVAS_WIDTH - buttonSize * 2 - margin - 10;
    touchControls.buttons.autoShoot.y = CANVAS_HEIGHT - buttonSize - bottomMargin;
    touchControls.buttons.autoShoot.w = buttonSize;
    touchControls.buttons.autoShoot.h = buttonSize;
    
    // Fire button
    touchControls.buttons.fire.x = CANVAS_WIDTH - buttonSize - margin;
    touchControls.buttons.fire.y = CANVAS_HEIGHT - buttonSize - bottomMargin;
    touchControls.buttons.fire.w = buttonSize;
    touchControls.buttons.fire.h = buttonSize;
    
    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log('Touch controls initialized');
}

// Handle touch start events
function handleTouchStart(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Check which button was touched
        for (const [buttonName, button] of Object.entries(touchControls.buttons)) {
            if (x >= button.x && x <= button.x + button.w &&
                y >= button.y && y <= button.y + button.h) {
                
                button.pressed = true;
                button.touchId = touch.identifier;
                
                // Handle special cases
                if (buttonName === 'autoShoot') {
                    autoShootActive = !autoShootActive;
                } else if (button.key) {
                    keys[button.key] = true;
                }
                
                break;
            }
        }
    }
}

// Handle touch move events
function handleTouchMove(e) {
    e.preventDefault();
    // Could add drag handling here if needed
}

// Handle touch end events
function handleTouchEnd(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        
        // Find and release the button associated with this touch
        for (const [buttonName, button] of Object.entries(touchControls.buttons)) {
            if (button.touchId === touch.identifier) {
                button.pressed = false;
                button.touchId = null;
                
                // Release the corresponding key (except for autoShoot which is a toggle)
                if (button.key && buttonName !== 'autoShoot') {
                    keys[button.key] = false;
                }
                
                break;
            }
        }
    }
}

// --- ALIEN SPRITES SYSTEM ---
const AlienSprites = {
    // Draw animated bee enemy (small, fast)
    drawBee(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingFlap = Math.sin(time * 10) * 0.3;
        
        // Body
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stripes
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -3);
        ctx.lineTo(8, -3);
        ctx.moveTo(-8, 3);
        ctx.lineTo(8, 3);
        ctx.stroke();
        
        // Wings
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-8, -5 + wingFlap, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -5 + wingFlap, 6, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-3, -2, 2, 2);
        ctx.fillRect(1, -2, 2, 2);
        
        ctx.restore();
    },
    
    // Draw butterfly enemy (medium)
    drawButterfly(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingFlap = Math.sin(time * 8) * 0.4;
        
        // Body
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings - left
        ctx.fillStyle = '#ff00aa';
        ctx.beginPath();
        ctx.ellipse(-10, 0, 8, 10, -0.5 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings - right
        ctx.beginPath();
        ctx.ellipse(10, 0, 8, 10, 0.5 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing patterns
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Antennae
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -12);
        ctx.lineTo(-4, -16);
        ctx.moveTo(2, -12);
        ctx.lineTo(4, -16);
        ctx.stroke();
        
        ctx.restore();
    },
    
    // Draw boss enemy (large, powerful)
    drawBoss(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const pulse = Math.sin(time * 4) * 0.1 + 1;
        
        // Main body
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark center
        ctx.fillStyle = '#0088aa';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pincers
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-18, -8);
        ctx.lineTo(-16, -6);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(18, -8);
        ctx.lineTo(16, -6);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.fillRect(-5, -3, 2, 2);
        ctx.fillRect(3, -3, 2, 2);
        
        ctx.restore();
    },
    
    // Draw scorpion enemy (aggressive)
    drawScorpion(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const tailWave = Math.sin(time * 6) * 0.3;
        
        // Body segments
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, i * 4, 6 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Claws
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-10, -8);
        ctx.moveTo(6, -4);
        ctx.lineTo(10, -8);
        ctx.stroke();
        
        // Tail
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(tailWave * 5, 16);
        ctx.lineTo(tailWave * 8, 20);
        ctx.stroke();
        
        // Stinger
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(tailWave * 8, 20);
        ctx.lineTo(tailWave * 8 - 2, 24);
        ctx.lineTo(tailWave * 8 + 2, 24);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-3, -2, 2, 2);
        ctx.fillRect(1, -2, 2, 2);
        
        ctx.restore();
    },
    
    // Draw moth enemy (erratic movement)
    drawMoth(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const flutter = Math.sin(time * 12) * 0.5;
        
        // Fuzzy body
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
        ctx.beginPath();
        ctx.ellipse(-9, 0, 10, 12, -0.3 + flutter, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(9, 0, 10, 12, 0.3 - flutter, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-9, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Antennae
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(-3, -15);
        ctx.moveTo(0, -11);
        ctx.lineTo(3, -15);
        ctx.stroke();
        
        ctx.restore();
    }
};

// --- ENEMY MANAGEMENT SYSTEM ---
const EnemyManager = {
    types: ['bee', 'butterfly', 'boss', 'scorpion', 'moth'],
    spawnTimer: 0,
    spawnInterval: 2,
    maxEnemies: 32,
    waveNumber: 0,
    
    // Progressive difficulty - enemy type unlocks
    getAvailableTypes(level) {
        const types = ['bee'];
        if (level >= 2) types.push('butterfly');
        if (level >= 3) types.push('scorpion');
        if (level >= 5) types.push('moth');
        if (level >= 7) types.push('boss');
        return types;
    },
    
    // Get enemy properties based on type and level
    getEnemyProperties(type, level) {
        const baseProps = {
            bee: { hp: 1, speed: 100, score: 100, shootChance: 0.01, w: 20, h: 20, color: '#ffff00' },
            butterfly: { hp: 1, speed: 80, score: 200, shootChance: 0.012, w: 24, h: 24, color: '#ff00ff' }, // Start with 1 HP
            scorpion: { hp: 2, speed: 120, score: 250, shootChance: 0.015, w: 22, h: 22, color: '#ff6600' },
            moth: { hp: 1, speed: 150, score: 150, shootChance: 0.01, w: 22, h: 22, color: '#808080' },
            boss: { hp: 3, speed: 60, score: 500, shootChance: 0.02, w: 32, h: 32, color: '#00ffff' } // Start with 3 HP instead of 5
        };
        
        const props = { ...baseProps[type] };
        
        // Scale with level (much slower progression for early levels)
        // Level 1-3: minimal scaling, Level 4+: more noticeable
        const levelMultiplier = 1 + Math.max(0, (level - 1) * 0.08);
        props.hp = Math.floor(props.hp * levelMultiplier);
        props.speed = Math.floor(props.speed * Math.min(levelMultiplier, 1.4));
        props.shootChance = Math.min(props.shootChance * (1 + Math.max(0, (level - 1) * 0.03)), 0.06); // Lower max
        props.score = Math.floor(props.score * levelMultiplier);
        
        return props;
    },
    
    // Spawn new wave of enemies
    spawnWave(level) {
        this.waveNumber++;
        console.log(`Spawning wave ${this.waveNumber} for level ${level}`);
        
        const availableTypes = this.getAvailableTypes(level);
        // Start with 6 enemies, gradually increase (6→8→10→12... caps at 20)
        const enemyCount = Math.min(6 + level * 2, 20);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy(level, availableTypes);
            }, i * 300); // Stagger spawns
        }
    },
    
    // Spawn a single enemy
    spawnEnemy(level, availableTypes = null) {
        if (enemies.length >= this.maxEnemies) return;
        
        if (!availableTypes) {
            availableTypes = this.getAvailableTypes(level);
        }
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const props = this.getEnemyProperties(type, level);
        
        // Get formation spot
        const formationSpot = getEmptyFormationSpot();
        if (!formationSpot) return;
        
        // Random entrance position
        const entranceX = Math.random() * CANVAS_WIDTH;
        const entranceY = -30;
        
        const enemy = {
            type,
            x: entranceX,
            y: entranceY,
            targetX: formationSpot.x,
            targetY: formationSpot.y,
            formationSpot,
            state: ENEMY_STATE.ENTRANCE,
            entranceProgress: 0,
            formationTime: 0,
            attackTime: 0,
            shootTimer: 0,
            ...props,
            maxHP: props.hp,
            entrancePath: this.createEntrancePath(entranceX, entranceY, formationSpot.x, formationSpot.y)
        };
        
        enemies.push(enemy);
    },
    
    // Create smooth entrance path (bezier curve)
    createEntrancePath(startX, startY, endX, endY) {
        const controlX1 = startX + (Math.random() - 0.5) * 100;
        const controlY1 = startY + 100;
        const controlX2 = endX + (Math.random() - 0.5) * 100;
        const controlY2 = endY - 50;
        
        return { startX, startY, controlX1, controlY1, controlX2, controlY2, endX, endY };
    },
    
    // Update enemy AI
    update(dt) {
        // Spawn new wave if all enemies defeated
        if (enemies.length === 0 && state === GAME_STATE.PLAYING) {
            this.spawnWave(level);
        }
        
        enemies.forEach(enemy => {
            switch (enemy.state) {
                case ENEMY_STATE.ENTRANCE:
                    this.updateEntrance(enemy, dt);
                    break;
                case ENEMY_STATE.FORMATION:
                    this.updateFormation(enemy, dt);
                    break;
                case ENEMY_STATE.ATTACK:
                    this.updateAttack(enemy, dt);
                    break;
            }
            
            // Improved shooting logic - different rates based on state
            enemy.shootTimer += dt;
            const shootCooldown = 1.5; // Minimum 1.5 seconds between shots
            
            if (enemy.shootTimer > shootCooldown && state === GAME_STATE.PLAYING) {
                let shootProbability = enemy.shootChance;
                
                // Increase shoot chance when attacking
                if (enemy.state === ENEMY_STATE.ATTACK) {
                    shootProbability = waveConfig.attackingShootChance;
                } else if (enemy.state === ENEMY_STATE.FORMATION) {
                    shootProbability = waveConfig.formationShootChance;
                }
                
                // Roll for shooting
                if (Math.random() < shootProbability) {
                    this.enemyShoot(enemy);
                    enemy.shootTimer = 0;
                }
            }
        });
    },
    
    // Update enemy entrance animation
    updateEntrance(enemy, dt) {
        enemy.entranceProgress += dt * 0.5; // 2 second entrance
        
        if (enemy.entranceProgress >= 1) {
            enemy.state = ENEMY_STATE.FORMATION;
            enemy.x = enemy.targetX;
            enemy.y = enemy.targetY;
            return;
        }
        
        // Bezier curve interpolation
        const t = enemy.entranceProgress;
        const path = enemy.entrancePath;
        const t1 = 1 - t;
        
        enemy.x = t1 * t1 * t1 * path.startX +
                  3 * t1 * t1 * t * path.controlX1 +
                  3 * t1 * t * t * path.controlX2 +
                  t * t * t * path.endX;
                  
        enemy.y = t1 * t1 * t1 * path.startY +
                  3 * t1 * t1 * t * path.controlY1 +
                  3 * t1 * t * t * path.controlY2 +
                  t * t * t * path.endY;
    },
    
    // Update enemy in formation
    updateFormation(enemy, dt) {
        enemy.formationTime += dt;
        
        // Gentle formation movement (swaying)
        const sway = Math.sin(enemy.formationTime * 2 + enemy.formationSpot.col) * 5;
        const bob = Math.sin(enemy.formationTime * 3 + enemy.formationSpot.row) * 3;
        enemy.x = enemy.targetX + sway;
        enemy.y = enemy.targetY + bob;
        
        // Increased chance to attack with better conditions
        const attackRoll = Math.random();
        if (attackRoll < waveConfig.baseAttackChance && attackQueue.length < waveConfig.maxAttackers) {
            enemy.state = ENEMY_STATE.ATTACK;
            enemy.attackTime = 0;
            enemy.attackPath = this.createAttackPath(enemy);
            attackQueue.push(enemy);
        }
        // Group attack chance - nearby enemies attack together
        else if (attackRoll < waveConfig.groupAttackChance && attackQueue.length < waveConfig.maxAttackers - 1) {
            // Find nearby enemies in formation to attack together
            const nearbyEnemies = enemies.filter(e => 
                e.state === ENEMY_STATE.FORMATION && 
                e !== enemy &&
                Math.abs(e.formationSpot.row - enemy.formationSpot.row) <= 1 &&
                Math.abs(e.formationSpot.col - enemy.formationSpot.col) <= 1
            );
            
            if (nearbyEnemies.length > 0 && Math.random() < 0.5) {
                // Start group attack
                enemy.state = ENEMY_STATE.ATTACK;
                enemy.attackTime = 0;
                enemy.attackPath = this.createAttackPath(enemy);
                attackQueue.push(enemy);
                
                // Make one nearby enemy attack too
                const buddy = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                buddy.state = ENEMY_STATE.ATTACK;
                buddy.attackTime = Math.random() * 0.3; // Slight delay for variety
                buddy.attackPath = this.createAttackPath(buddy);
                attackQueue.push(buddy);
            }
        }
    },
    
    // Update attacking enemy with improved patterns
    updateAttack(enemy, dt) {
        enemy.attackTime += dt;
        
        const duration = 3.5; // 3.5 second attack run (slightly longer)
        if (enemy.attackTime >= duration) {
            // Return to formation or remove if off-screen
            if (enemy.y < CANVAS_HEIGHT + 50 && enemy.x > -50 && enemy.x < CANVAS_WIDTH + 50) {
                enemy.state = ENEMY_STATE.ENTRANCE;
                enemy.entranceProgress = 0;
                enemy.entrancePath = this.createEntrancePath(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
            } else {
                // Remove from game and free formation spot
                enemy.formationSpot.taken = false;
                const index = enemies.indexOf(enemy);
                if (index > -1) enemies.splice(index, 1);
            }
            
            const queueIndex = attackQueue.indexOf(enemy);
            if (queueIndex > -1) attackQueue.splice(queueIndex, 1);
            return;
        }
        
        // Follow attack path with pattern-specific movement
        const t = enemy.attackTime / duration;
        const path = enemy.attackPath;
        
        // Different movement based on pattern type
        switch(path.pattern) {
            case 'dive':
                // Sinusoidal dive pattern
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.sin(t * Math.PI * 4) * path.wobble;
                enemy.y = path.startY + (path.endY - path.startY) * t * t; // Accelerating dive
                break;
                
            case 'swoop':
                // Swooping arc
                const swoopCurve = Math.sin(t * Math.PI);
                enemy.x = path.startX + (path.endX - path.startX) * t;
                enemy.y = path.startY + (path.endY - path.startY) * swoopCurve + Math.sin(t * Math.PI * 2) * path.wobble * 0.5;
                break;
                
            case 'loop':
                // Looping pattern
                const loopAngle = t * Math.PI * 2;
                const radius = path.wobble;
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.cos(loopAngle) * radius;
                enemy.y = path.startY + (path.endY - path.startY) * t + Math.sin(loopAngle) * radius;
                break;
                
            default:
                // Fallback to simple movement
                enemy.x = path.startX + (path.endX - path.startX) * t + Math.sin(t * Math.PI * 4) * path.wobble;
                enemy.y = path.startY + (path.endY - path.startY) * t;
        }
    },
    
    // Create attack path with more variety
    createAttackPath(enemy) {
        const startX = enemy.x;
        const startY = enemy.y;
        
        // Multiple attack patterns
        const patternType = Math.random();
        let endX, endY, wobble, pattern;
        
        if (patternType < 0.4) {
            // Direct dive at player
            endX = player.x + (Math.random() - 0.5) * 80;
            endY = CANVAS_HEIGHT + 50;
            wobble = 20 + Math.random() * 30;
            pattern = 'dive';
        } else if (patternType < 0.7) {
            // Swooping arc attack
            endX = startX < CANVAS_WIDTH / 2 ? CANVAS_WIDTH + 50 : -50;
            endY = player.y + (Math.random() - 0.5) * 100;
            wobble = 60 + Math.random() * 50;
            pattern = 'swoop';
        } else {
            // Loop pattern
            endX = CANVAS_WIDTH - startX;
            endY = CANVAS_HEIGHT + 50;
            wobble = 80 + Math.random() * 60;
            pattern = 'loop';
        }
        
        return { startX, startY, endX, endY, wobble, pattern };
    },
    
    // Enemy shooting
    enemyShoot(enemy) {
        if (state !== GAME_STATE.PLAYING) return;
        
        // Play enemy shooting sound
        AudioEngine.enemyShoot();
        
        const bullet = getPoolObject('enemyBullets');
        if (bullet) {
            bullet.x = enemy.x;
            bullet.y = enemy.y + enemy.h / 2;
            bullet.speed = waveConfig.bulletSpeed; // Use scaled bullet speed
            bullet.from = 'enemy';
            bullet.color = enemy.color;
            
            enemyBullets.push(bullet);
        }
    },
    
    // Draw all enemies
    draw(time) {
        enemies.forEach(enemy => {
            const attacking = enemy.state === ENEMY_STATE.ATTACK;
            
            switch (enemy.type) {
                case 'bee':
                    AlienSprites.drawBee(ctx, enemy.x, enemy.y, time, 1, attacking);
                    break;
                case 'butterfly':
                    AlienSprites.drawButterfly(ctx, enemy.x, enemy.y, time, 1, attacking);
                    break;
                case 'boss':
                    AlienSprites.drawBoss(ctx, enemy.x, enemy.y, time, 1, attacking);
                    break;
                case 'scorpion':
                    AlienSprites.drawScorpion(ctx, enemy.x, enemy.y, time, 1, attacking);
                    break;
                case 'moth':
                    AlienSprites.drawMoth(ctx, enemy.x, enemy.y, time, 1, attacking);
                    break;
            }
            
            // Draw health bar for tougher enemies
            if (enemy.maxHP > 1) {
                const healthPercent = enemy.hp / enemy.maxHP;
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
                ctx.fillRect(enemy.x - 10, enemy.y - 18, 20 * healthPercent, 2);
            }
        });
    }
};

// --- POWERUP SYSTEM ---
const PowerupManager = {
    types: ['double', 'speed', 'shield', 'health'],
    spawnTimer: 0,
    spawnInterval: 15, // Spawn every 15 seconds
    
    update(dt) {
        this.spawnTimer += dt;
        
        if (this.spawnTimer >= this.spawnInterval && state === GAME_STATE.PLAYING) {
            this.spawnRandom();
            this.spawnTimer = 0;
        }
    },
    
    spawnRandom() {
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        
        powerups.push({
            type,
            x: Math.random() * (CANVAS_WIDTH - 40) + 20,
            y: -20,
            w: 16,
            h: 16,
            rotation: 0
        });
    },
    
    draw(time) {
        powerups.forEach(powerup => {
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
                    ctx.fillText('x2', 0, 3);
                    break;
                case 'speed':
                    ctx.fillStyle = '#ffff00';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('>>',0, 3);
                    break;
                case 'shield':
                    ctx.fillStyle = '#00ffff';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('S', 0, 3);
                    break;
                case 'health':
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(-8, -8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('+', 0, 3);
                    break;
            }
            
            ctx.restore();
        });
    }
};

// Start the game when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Missing game functions implementation

// Fetch high scores from Firebase
function fetchHighScores() {
    if (!database) {
        console.log('Database not available, using local high scores');
        return;
    }
    
    try {
        database.ref('highScores').orderByChild('score').limitToLast(MAX_HIGH_SCORES).once('value')
            .then((snapshot) => {
                firebaseHighScores = [];
                snapshot.forEach((childSnapshot) => {
                    firebaseHighScores.push(childSnapshot.val());
                });
                firebaseHighScores.reverse(); // Show highest scores first
                console.log('High scores fetched:', firebaseHighScores);
            })
            .catch((error) => {
                console.error('Error fetching high scores:', error);
            });
    } catch (error) {
        console.error('Firebase fetch error:', error);
    }
}

// Reset game to initial state
function resetGame() {
    // Reset player
    player.x = PLAYER_START_X;
    player.y = PLAYER_START_Y;
    player.alive = true;
    player.cooldown = 0;
    player.power = 'normal';
    player.powerTimer = 0;
    player.shield = false;
    
    // Start background music
    AudioEngine.startBackgroundMusic();
    
    // Reset game state
    score = 0;
    lives = 3;
    level = 1;
    levelTransition = 0;
    screenShake = 0;
    
    // Reset difficulty to level 1
    updateDifficultyForLevel(1);
    
    // Clear all active objects
    bullets.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
    powerups.length = 0;
    particles.length = 0;
    
    // Reset object pools
    POOL.bullets.forEach(bullet => bullet.active = false);
    POOL.enemyBullets.forEach(bullet => bullet.active = false);
    POOL.particles.forEach(particle => particle.active = false);
    
    // Reset formation spots
    formationSpots.forEach(spot => spot.taken = false);
    attackQueue.length = 0;
    
    // Reset boss mechanics
    bossGalaga = null;
    capturedShip = false;
    dualShip = false;
    challengeStage = false;
    
    console.log('Game reset complete');
}

// Update splash screen
function updateSplash() {
    splashTimer += dt;
    
    // Animate background starfield even on splash
    drawStarfield(dt);
}

// Update gameplay
function updateGameplay() {
    if (!player.alive) return;
    
    // Update player movement
    updatePlayer();
    
    // Update bullets
    updateBullets();
    
    // Update enemies with AI
    EnemyManager.update(dt);
    
    // Update enemy bullets
    updateEnemyBullets();
    
    // Update powerups
    updatePowerups();
    PowerupManager.update(dt);
    
    // Update particles
    updateParticles();
    
    // Check collisions
    checkCollisions();
    
    // Auto-shoot for touch devices
    if (autoShootActive && player.cooldown <= 0) {
        shoot();
    }
    
    // Handle shooting
    if ((keys['Space'] || touchControls.buttons.fire.pressed) && player.cooldown <= 0) {
        shoot();
    }
    
    // Check for level progression
    if (enemies.length === 0 && levelTransition <= 0) {
        levelTransition = 3; // 3 second transition
        // Play level complete sound
        AudioEngine.levelComplete();
        // Don't increment level yet - wait for transition to complete
    }
    
    if (levelTransition > 0) {
        levelTransition -= dt;
        
        // Spawn next wave after transition completes
        if (levelTransition <= 0) {
            level++; // NOW increment level
            updateDifficultyForLevel(level); // Scale difficulty for new level
            // Wave will spawn automatically by EnemyManager.update
        }
    }
}

// Draw arcade-style splash screen
function drawArcadeSplash() {
    // Draw animated starfield background
    drawStarfield(dt);
    
    ctx.save();
    
    // Title with retro glow effect
    const time = splashTimer;
    const glowIntensity = Math.sin(time * 3) * 0.3 + 0.7;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px monospace';
    
    // Glow effect
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('GALAGA', CANVAS_WIDTH / 2, 120);
    
    // Remove shadow for subtitle
    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARCADE EDITION', CANVAS_WIDTH / 2, 150);
    
    // Animated enemy showcase
    drawEnemyShowcase(time);
    
    // Instructions with blinking effect
    const blinkSpeed = Math.sin(time * 4) > 0 ? 1 : 0.3;
    ctx.globalAlpha = blinkSpeed;
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
    
    // Controls info
    ctx.globalAlpha = 0.8;
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('← → MOVE    SPACE FIRE    P PAUSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    
    // High score display
    if (firebaseHighScores.length > 0) {
        ctx.globalAlpha = 0.6;
        ctx.font = '14px monospace';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`HIGH SCORE: ${firebaseHighScores[0].score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 120);
    }
    
    ctx.restore();
}

// Draw enemy showcase on splash screen
function drawEnemyShowcase(time) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 250;
    const radius = 60;
    
    // Show different enemy types in a circle
    const enemyTypes = ['bee', 'butterfly', 'boss', 'scorpion'];
    
    enemyTypes.forEach((type, index) => {
        const angle = (time * 0.5) + (index * Math.PI * 2 / enemyTypes.length);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Draw enemy with scaling animation
        const scale = 1 + Math.sin(time * 3 + index) * 0.2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // Use AlienSprites if available, otherwise draw simple shapes
        if (typeof AlienSprites !== 'undefined') {
            switch (type) {
                case 'bee':
                    AlienSprites.drawBee(ctx, 0, 0, time, 1, false);
                    break;
                case 'butterfly':
                    AlienSprites.drawButterfly(ctx, 0, 0, time, 1, false);
                    break;
                case 'boss':
                    AlienSprites.drawBoss(ctx, 0, 0, time, 1, false);
                    break;
                case 'scorpion':
                    AlienSprites.drawScorpion(ctx, 0, 0, time, 1, false);
                    break;
            }
        } else {
            // Fallback simple enemy drawing
            ctx.fillStyle = arcadeColors[index];
            ctx.fillRect(-8, -8, 16, 16);
        }
        
        ctx.restore();
    });
}

// Draw main gameplay
function drawGameplay() {
    // Draw animated starfield background
    drawStarfield(dt);
    
    // Draw game objects
    const time = performance.now() / 1000; // Convert to seconds for animations
    drawPlayer();
    drawBullets();
    EnemyManager.draw(time);
    drawEnemyBullets();
    PowerupManager.draw(time);
    drawParticles();
    
    // Draw level transition message
    if (levelTransition > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(levelTransition, 1);
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`LEVEL ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.restore();
    }
    
    // Draw UI
    drawUI();
    
    // Draw touch controls if on mobile and no keyboard detected
    if (isTouchDevice && !hasKeyboard) {
        drawTouchControls();
    }
}

// Draw pause screen
function drawPauseScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.font = '16px monospace';
    ctx.fillText('Press P to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

// Draw game over screen
function drawGameOver() {
    // Draw dark background with starfield
    drawStarfield(dt);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText(`LEVEL: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('PRESS SPACE TO RETURN TO MENU', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Draw high score entry screen
function drawEnterHighScoreScreen() {
    drawStarfield(dt);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    ctx.fillText('ENTER YOUR INITIALS:', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Draw initials input
    const initialsStr = playerInitials.join(' ');
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(initialsStr, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    // Draw cursor
    const cursorX = CANVAS_WIDTH / 2 - 40 + currentInitialIndex * 20;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(cursorX - 2, CANVAS_HEIGHT / 2 + 50, 20, 3);
}

// Handle high score name entry
function handleHighScoreInput(e) {
    if (e.code === 'Enter') {
        // Submit high score
        submitHighScore();
        state = GAME_STATE.SPLASH;
        playerInitials = ["_", "_", "_", "_", "_"];
        currentInitialIndex = 0;
        return;
    }
    
    if (e.code === 'Backspace') {
        playerInitials[currentInitialIndex] = "_";
        currentInitialIndex = Math.max(0, currentInitialIndex - 1);
        return;
    }
    
    if (e.code === 'ArrowLeft') {
        currentInitialIndex = Math.max(0, currentInitialIndex - 1);
        return;
    }
    
    if (e.code === 'ArrowRight') {
        currentInitialIndex = Math.min(4, currentInitialIndex + 1);
        return;
    }
    
    // Check if it's a letter key
    if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
        playerInitials[currentInitialIndex] = e.key.toUpperCase();
        currentInitialIndex = Math.min(4, currentInitialIndex + 1);
    }
}

// Submit high score to Firebase
function submitHighScore() {
    const name = playerInitials.join('').trim().replace(/_/g, '') || 'AAA';
    
    if (!database) {
        console.log('Database not available, high score not saved');
        return;
    }
    
    try {
        const newScoreRef = database.ref('highScores').push();
        newScoreRef.set({
            name: name,
            score: score,
            level: level,
            timestamp: Date.now()
        }).then(() => {
            console.log('High score saved successfully!');
            fetchHighScores();
        }).catch((error) => {
            console.error('Error saving high score:', error);
        });
    } catch (error) {
        console.error('Firebase submission error:', error);
    }
}

// Basic update functions (simplified for now)
function updatePlayer() {
    if (!player.alive) return;
    
    // Handle movement
    if (keys['ArrowLeft'] || touchControls.buttons.left.pressed) {
        player.x = Math.max(player.w / 2, player.x - player.speed * dt);
    }
    if (keys['ArrowRight'] || touchControls.buttons.right.pressed) {
        player.x = Math.min(CANVAS_WIDTH - player.w / 2, player.x + player.speed * dt);
    }
    
    // Update cooldown
    if (player.cooldown > 0) {
        player.cooldown -= dt;
    }
    
    // Update power timer
    if (player.powerTimer > 0) {
        player.powerTimer -= dt;
        if (player.powerTimer <= 0) {
            player.power = 'normal';
            player.shield = false;
        }
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed * dt;
        return bullet.y > -bullet.h;
    });
}

function updateEnemies() {
    // Enemy updates are now handled by EnemyManager.update()
    // This function is kept for compatibility
    // Remove off-screen enemies
    enemies = enemies.filter(enemy => {
        if (enemy.y > CANVAS_HEIGHT + 100) {
            if (enemy.formationSpot) {
                enemy.formationSpot.taken = false;
            }
            return false;
        }
        return true;
    });
}

function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed * dt;
        return bullet.y < CANVAS_HEIGHT + bullet.h;
    });
}

function updatePowerups() {
    powerups = powerups.filter(powerup => {
        powerup.y += 100 * dt; // Fall down
        return powerup.y < CANVAS_HEIGHT + powerup.h;
    });
}

function updateParticles() {
    // Update pooled particles
    POOL.particles.forEach(particle => {
        if (!particle.active) return;
        
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        
        if (particle.life <= 0) {
            particle.active = false;
        }
    });
}

// Shooting function
function shoot() {
    if (player.cooldown > 0 || !player.alive) return;
    
    // Play shooting sound
    AudioEngine.playerShoot();
    
    // Create bullet
    bullets.push({
        x: player.x,
        y: player.y - player.h / 2,
        w: 3,
        h: 12,
        speed: 600,
        type: player.power,
        from: 'player'
    });
    
    // Set cooldown
    player.cooldown = player.power === 'speed' ? 0.1 : 0.15;
    
    // Double shot for power
    if (player.power === 'double') {
        bullets.push({
            x: player.x - 8,
            y: player.y - player.h / 2,
            w: 3,
            h: 12,
            speed: 600,
            type: 'normal',
            from: 'player'
        });
        bullets.push({
            x: player.x + 8,
            y: player.y - player.h / 2,
            w: 3,
            h: 12,
            speed: 600,
            type: 'normal',
            from: 'player'
        });
    }
}

// Enhanced collision detection
function checkCollisions() {
    // Player bullets vs enemy bullets (shoot down incoming fire!)
    for (let playerBulletIndex = bullets.length - 1; playerBulletIndex >= 0; playerBulletIndex--) {
        const playerBullet = bullets[playerBulletIndex];
        if (playerBullet.from !== 'player') continue;
        
        for (let enemyBulletIndex = enemyBullets.length - 1; enemyBulletIndex >= 0; enemyBulletIndex--) {
            const enemyBullet = enemyBullets[enemyBulletIndex];
            if (enemyBullet.from !== 'enemy') continue;
            
            // Check collision between bullets
            const distance = Math.sqrt(
                (playerBullet.x - enemyBullet.x) ** 2 + 
                (playerBullet.y - enemyBullet.y) ** 2
            );
            
            if (distance < 8) { // 8 pixel collision radius
                // Bullets collide!
                bullets.splice(playerBulletIndex, 1);
                enemyBullets.splice(enemyBulletIndex, 1);
                
                // Play bullet hit sound
                AudioEngine.bulletHit();
                
                // Create small spark effect
                createHitEffect(enemyBullet.x, enemyBullet.y);
                score += 10; // Small bonus for shooting down bullets
                
                break; // Move to next player bullet
            }
        }
    }
    
    // Player bullets vs enemies
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        if (bullet.from !== 'player') continue;
        
        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex];
            const hitRadius = (enemy.w + enemy.h) / 4;
            const distance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
            
            if (distance < hitRadius) {
                // Hit!
                bullets.splice(bulletIndex, 1);
                enemy.hp--;
                
                // Play hit sound
                AudioEngine.hit();
                
                // Create small hit effect
                createHitEffect(enemy.x, enemy.y);
                
                if (enemy.hp <= 0) {
                    // Enemy destroyed
                    score += enemy.score;
                    
                    // Play explosion sound
                    AudioEngine.explosion();
                    
                    // Free formation spot
                    if (enemy.formationSpot) {
                        enemy.formationSpot.taken = false;
                    }
                    
                    // Remove from attack queue
                    const queueIndex = attackQueue.indexOf(enemy);
                    if (queueIndex > -1) attackQueue.splice(queueIndex, 1);
                    
                    enemies.splice(enemyIndex, 1);
                    createExplosion(enemy.x, enemy.y);
                    screenShake = 5;
                    
                    // Chance to drop powerup
                    if (Math.random() < 0.1) {
                        powerups.push({
                            type: PowerupManager.types[Math.floor(Math.random() * PowerupManager.types.length)],
                            x: enemy.x,
                            y: enemy.y,
                            w: 16,
                            h: 16
                        });
                    }
                }
                
                break;
            }
        }
    }
    
    // Enemy bullets vs player
    for (let bulletIndex = enemyBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = enemyBullets[bulletIndex];
        if (bullet.from !== 'enemy') continue;
        
        const distance = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
        
        if (distance < player.w / 2 && player.alive) {
            if (player.shield) {
                // Shield absorbs hit
                enemyBullets.splice(bulletIndex, 1);
                createHitEffect(bullet.x, bullet.y);
            } else {
                // Player hit!
                enemyBullets.splice(bulletIndex, 1);
                lives--;
                
                if (lives <= 0) {
                    player.alive = false;
                    state = GAME_STATE.GAME_OVER;
                    
                    // Play player death sound
                    AudioEngine.playerDeath();
                    
                    // Check if high score
                    if (firebaseHighScores.length === 0 || score > firebaseHighScores[firebaseHighScores.length - 1].score || firebaseHighScores.length < MAX_HIGH_SCORES) {
                        state = GAME_STATE.ENTER_HIGH_SCORE;
                    }
                }
                
                createExplosion(player.x, player.y);
                screenShake = 10;
            }
        }
    }
    
    // Enemies vs player (collision damage)
    enemies.forEach(enemy => {
        const distance = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
        
        if (distance < (enemy.w + player.w) / 3 && player.alive && !player.shield) {
            lives--;
            
            if (lives <= 0) {
                player.alive = false;
                state = GAME_STATE.GAME_OVER;
                
                // Play player death sound
                AudioEngine.playerDeath();
                
                // Check if high score
                if (firebaseHighScores.length === 0 || score > firebaseHighScores[firebaseHighScores.length - 1].score || firebaseHighScores.length < MAX_HIGH_SCORES) {
                    state = GAME_STATE.ENTER_HIGH_SCORE;
                }
            }
            
            createExplosion(player.x, player.y);
            screenShake = 10;
        }
    });
    
    // Powerups vs player
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const distance = Math.sqrt((powerup.x - player.x) ** 2 + (powerup.y - player.y) ** 2);
        
        if (distance < 20) {
            // Collect powerup
            applyPowerup(powerup.type);
            powerups.splice(i, 1);
            score += 50;
            
            // Play powerup sound
            AudioEngine.powerup();
        }
    }
}

// Create smaller hit effect
function createHitEffect(x, y) {
    for (let i = 0; i < 3; i++) {
        const particle = getPoolObject('particles');
        if (particle) {
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 100;
            particle.vy = (Math.random() - 0.5) * 100;
            particle.size = Math.random() * 2 + 1;
            particle.color = '#ffff00';
            particle.life = 0.2;
            particle.initialLife = 0.2;
        }
    }
}

// Apply powerup to player
function applyPowerup(type) {
    switch (type) {
        case 'double':
            player.power = 'double';
            player.powerTimer = 10;
            break;
        case 'speed':
            player.power = 'speed';
            player.powerTimer = 10;
            break;
        case 'shield':
            player.shield = true;
            player.powerTimer = 15;
            break;
        case 'health':
            lives = Math.min(lives + 1, 5);
            break;
    }
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
        const particle = getPoolObject('particles');
        if (particle) {
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 200;
            particle.vy = (Math.random() - 0.5) * 200;
            particle.size = Math.random() * 3 + 1;
            particle.color = '#ff' + Math.floor(Math.random() * 255).toString(16).padStart(2, '0') + '00';
            particle.life = Math.random() * 0.5 + 0.5;
            particle.initialLife = particle.life;
        }
    }
}

// Basic drawing functions
function drawPlayer() {
    if (!player.alive) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Draw shield effect
    if (player.shield) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, player.w / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Draw enhanced spaceship
    // Main body - sleek triangle
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12); // Nose
    ctx.lineTo(-10, 8); // Left wing tip
    ctx.lineTo(-6, 10); // Left wing inner
    ctx.lineTo(0, 8); // Center back
    ctx.lineTo(6, 10); // Right wing inner
    ctx.lineTo(10, 8); // Right wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cockpit canopy - glossy blue
    const cockpitGradient = ctx.createLinearGradient(0, -8, 0, 2);
    cockpitGradient.addColorStop(0, '#88ffff');
    cockpitGradient.addColorStop(1, '#0088ff');
    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-4, 2);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, -4, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow effect (pulses based on time)
    const engineGlow = Math.sin(performance.now() / 100) * 0.3 + 0.7;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff6600';
    ctx.fillStyle = `rgba(255, 150, 0, ${engineGlow})`;
    
    // Left engine
    ctx.beginPath();
    ctx.ellipse(-6, 9, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Right engine
    ctx.beginPath();
    ctx.ellipse(6, 9, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Wing accents - darker green lines
    ctx.strokeStyle = '#005500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.lineTo(-6, 9);
    ctx.moveTo(8, 6);
    ctx.lineTo(6, 9);
    ctx.stroke();
    
    // Nose detail - sharp point highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -10);
    ctx.lineTo(0, -12);
    ctx.lineTo(1, -10);
    ctx.stroke();
    
    // Power indicator (when powered up)
    if (player.power !== 'normal' && player.powerTimer > 0) {
        const powerColor = player.power === 'double' ? '#00ff00' : 
                          player.power === 'speed' ? '#ffff00' : '#00ffff';
        ctx.fillStyle = powerColor;
        ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - bullet.w / 2, bullet.y - bullet.h / 2, bullet.w, bullet.h);
    });
}

function drawEnemies() {
    // Enemy drawing is now handled by EnemyManager.draw()
    // This function is kept for compatibility
    const time = performance.now() / 1000;
    EnemyManager.draw(time);
}

function drawEnemyBullets() {
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x - bullet.w / 2, bullet.y - bullet.h / 2, bullet.w, bullet.h);
    });
}

function drawPowerups() {
    // Powerup drawing is now handled by PowerupManager.draw()
    const time = performance.now() / 1000;
    PowerupManager.draw(time);
}

function drawParticles() {
    POOL.particles.forEach(particle => {
        if (!particle.active) return;
        
        ctx.save();
        ctx.globalAlpha = particle.life / particle.initialLife;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawUI() {
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillText(`SCORE: ${score}`, 10, 25);
    
    // Lives
    ctx.fillText(`LIVES: ${lives}`, 10, 50);
    
    // Level
    ctx.fillText(`LEVEL: ${level}`, 10, 75);
    
    // Power indicator
    if (player.power !== 'normal') {
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`POWER: ${player.power.toUpperCase()}`, 10, 100);
    }
}

function drawTouchControls() {
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    // Draw touch control buttons
    Object.entries(touchControls.buttons).forEach(([name, button]) => {
        ctx.fillStyle = button.pressed ? '#ffffff' : '#444444';
        ctx.fillRect(button.x, button.y, button.w, button.h);
        
        ctx.fillStyle = button.pressed ? '#000000' : '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(button.label, 
                    button.x + button.w / 2, 
                    button.y + button.h / 2 + 6);
    });
    
    // Auto-shoot indicator
    if (autoShootActive) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(touchControls.buttons.autoShoot.x - 2, 
                    touchControls.buttons.autoShoot.y - 2, 
                    touchControls.buttons.autoShoot.w + 4, 
                    touchControls.buttons.autoShoot.h + 4);
    }
    
    ctx.restore();
}