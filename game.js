// Galaga-inspired Arcade Game
// All assets generated from code

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    drawCallCount: 0,
    
    // Advanced performance metrics
    renderTime: 0,
    updateTime: 0,
    culledObjects: 0,
    renderedObjects: 0,
    lastPerformanceLog: 0,
      // Caching systems
    pathCache: new Map(),
    gradientCache: new Map(),
    textCache: new Map(),
    imageCache: new Map(),
    
    // Enhanced caching with timestamps for cleanup
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
    
    // Enhanced memory management
    memoryUsage: {
        textures: 0,
        paths: 0,
        gradients: 0,
        total: 0,
        peakUsage: 0,
        lastCleanup: 0
    },
    
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

    // Adaptive quality adjustment (moved back inside object)
    analyzePerformance() {
        if (!this.adaptiveQuality || this.performanceHistory.length < 30) return;
        const targetFrameTime = 1000 / this.targetFPS; // 16.67ms for 60fps
        const currentFPS = 1000 / this.avgFrameTime;
        const now = performance.now();
        // Don't adjust too frequently
        if (now - this.lastQualityAdjustment < 5000) return;
        // Calculate performance metrics
        const fpsRatio = currentFPS / this.targetFPS;
        const renderLoad = this.renderTime / this.frameTime;
        const memoryPressure = this.memoryUsage.total / 200; // Normalize to 0-1 scale
        // Multi-factor performance score
        const performanceScore = (fpsRatio * 0.6) + ((1 - renderLoad) * 0.3) + ((1 - memoryPressure) * 0.1);
        if (performanceScore < 0.7) { // Performance is poor
            if (this.qualityLevel === 'high') {
                this.setQualityLevel('medium');
                this.lastQualityAdjustment = now;
                console.log(`Performance degraded (score: ${performanceScore.toFixed(2)}), reducing quality to medium`);
            } else if (this.qualityLevel === 'medium') {
                this.setQualityLevel('low');
                this.lastQualityAdjustment = now;
                console.log(`Performance degraded (score: ${performanceScore.toFixed(2)}), reducing quality to low`);
            }
        } else if (performanceScore > 0.9) { // Performance is excellent
            if (this.qualityLevel === 'low' && this.avgFrameTime < targetFrameTime * 0.7) {
                this.setQualityLevel('medium');
                this.lastQualityAdjustment = now;
                console.log(`Performance improved (score: ${performanceScore.toFixed(2)}), increasing quality to medium`);
            } else if (this.qualityLevel === 'medium' && this.avgFrameTime < targetFrameTime * 0.5) {
                this.setQualityLevel('high');
                this.lastQualityAdjustment = now;
                console.log(`Performance improved (score: ${performanceScore.toFixed(2)}), increasing quality to high`);
            }
        }
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

// Optimized game loop with better timing
function gameLoop() {
    console.log("gameLoop called, state:", state); // LOGGING
    const currentTime = performance.now();
    // Delta time in seconds, capped to prevent spiral of death
    dt = Math.min(0.1, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    // Clear canvas with a dark color
    ctx.fillStyle = '#000'; // Base background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake if active
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 2;
        const shakeY = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(shakeX, shakeY);
    }

    // Game state machine
    switch (state) {
        case GAME_STATE.SPLASH:
            drawArcadeSplash();
            break;
        case GAME_STATE.PLAYING:
            updateGameplay();
            drawGameplay();
            break;
        case GAME_STATE.PAUSED:
            // Draw the underlying game state (e.g., gameplay) then the pause overlay
            drawGameplay(); // Draw the game as it was
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
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to default transform
    }

    requestAnimationFrame(gameLoop);
}

// Function to fetch high scores from Firebase
function fetchHighScores(callback) {
    if (!database) { // Check if database was initialized or available
        console.warn("Firebase database not available. Skipping high score fetch.");
        firebaseHighScores = []; // Ensure it's an empty array
        highScore = 0;
        if (callback) {
            // Call callback asynchronously to maintain consistent behavior
            setTimeout(() => callback(), 0);
        }
        return;
    }

    database.ref('highscores').orderByChild('score').limitToLast(MAX_HIGH_SCORES).once('value', (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push({
                key: childSnapshot.key,
                name: childSnapshot.val().name,
                score: childSnapshot.val().score
            });
        });
        firebaseHighScores = scores.sort((a, b) => b.score - a.score);
        if (firebaseHighScores.length > 0) {
            highScore = firebaseHighScores[0].score;
        } else {
            highScore = 0;
        }
        if (callback) callback();
    }, (error) => { // Error callback for .once()
        console.error("Error fetching high scores from Firebase:", error);
        firebaseHighScores = []; // Reset or handle as appropriate
        highScore = 0;
        if (callback) callback(); // IMPORTANT: Still call the main callback to allow game to proceed
    });
}

// Function to save a high score to Firebase
function saveHighScore(name, score) {
    if (!database) {
        console.warn("Firebase database not available. Cannot save high score.");
        // Optionally, save to localStorage as a fallback or inform the user.
        // For now, just log and don't save.
        fetchHighScores(); // Still call fetch to update local list (which will be empty or from previous successful fetches)
        return;
    }

    const newScoreRef = database.ref('highscores').push();
    newScoreRef.set({
        name: name,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Optional: for ordering or info
    }).then(() => {
        console.log("High score saved!");
        fetchHighScores(); // Re-fetch to update the list
    }).catch((error) => {
        console.error("Error saving high score: ", error);
    });

    // Optional: Prune older/lower scores if list exceeds MAX_HIGH_SCORES
    // This is more complex and might be better handled with Firebase rules or cloud functions
    // For simplicity, we'll rely on limitToLast for fetching.
}

// Draw authentic Galaga logo
function drawGalagaLogo(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Logo outline glow effect
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 20;
    
    // Create rainbow gradient for logo
    const logoGradient = ctx.createLinearGradient(0, -30, 0, 30);
    logoGradient.addColorStop(0, '#f00');    // Red top
    logoGradient.addColorStop(0.5, '#ff0');  // Yellow middle
    logoGradient.addColorStop(1, '#f00');    // Red bottom
    
    ctx.fillStyle = logoGradient;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Draw "GALAGA" with proper spacing and styling
    ctx.font = 'bold 48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GALAGA', 0, 0);
    ctx.strokeText('GALAGA', 0, 0);
    
    // Add the characteristic dots in the G and A letters
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-75, 0, 3, 0, Math.PI * 2); // Dot in G
    ctx.arc(40, 0, 3, 0, Math.PI * 2);  // Dot in A
    ctx.fill();
    
    ctx.restore();
}

function drawArcadeSplash() {
    // Clear to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw animated starfield background
    drawStarfield(dt);
    
    // Classic arcade border - more subtle than current version
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    
    // Draw authentic Galaga logo
    drawGalagaLogo(CANVAS_WIDTH / 2, 120, 1.2);
    
    // Draw "ARCADE TRIBUTE" subtitle
    ctx.font = '18px monospace';
    ctx.fillStyle = '#0ff';
    ctx.textAlign = 'center';
    ctx.fillText('ARCADE TRIBUTE', CANVAS_WIDTH / 2, 170);
    
    // High Scores in more authentic arcade style
    const centerX = CANVAS_WIDTH / 2;
    
    // Blinking text effect for "HIGH SCORES"
    const blinkRate = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = blinkRate ? '#ff0' : '#f80';
    ctx.fillText('HIGH SCORES', centerX, 210);
    
    // Display top scores
    ctx.font = '16px monospace';
    if (firebaseHighScores.length > 0) {
        const scoreCount = Math.min(firebaseHighScores.length, 5);
        
        for (let i = 0; i < scoreCount; i++) {
            const entry = firebaseHighScores[i];
            const rankText = `${i + 1}.`;
            const nameText = entry.name.substring(0, 5).padEnd(5, ' ');
            const scoreText = entry.score.toString().padStart(6, ' ');
            
            // Draw rank number
            ctx.fillStyle = '#f00';
            ctx.textAlign = 'right';
            ctx.fillText(rankText, centerX - 70, 240 + i * 25);
            
            // Draw name
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(nameText, centerX - 60, 240 + i * 25);
            
            // Draw score
            ctx.fillStyle = '#ff0';
            ctx.fillText(scoreText, centerX + 70, 240 + i * 25);
        }
    } else {
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('NO RECORDS YET', centerX, 240);
    }
    
    // Draw enemy showcase on the right side
    drawEnemyShowcase(CANVAS_WIDTH - 140, 240);
    
    // Insert coin/start text - with classic arcade blinking
    const startBlinking = Math.floor(Date.now() / 400) % 2 === 0;
    if (startBlinking) {
        ctx.font = '18px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START', centerX, CANVAS_HEIGHT - 60);
    }
    
    // Copyright notice - for authenticity
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('© 1981 NAMCO - WEB TRIBUTE', centerX, CANVAS_HEIGHT - 30);
}

// Draw enemy showcase with point values
function drawEnemyShowcase(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // Title
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('CHARACTER ⨯ POINT', 0, 0);
    
    const spacing = 50;
    
    // Draw each enemy type with point value (simplified versions)
    // Boss Galaga
    ctx.translate(0, spacing);
    ctx.fillStyle = '#f0f';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('= 150 PTS', 25, 5);
    
    // Butterfly/Fast enemy
    ctx.translate(0, spacing);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('= 80 PTS', 25, 5);
    
    // Bee/Basic enemy
    ctx.translate(0, spacing);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(0, -15);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('= 50 PTS', 25, 5);
    
    ctx.restore();
}

// Add stars array for background starfield
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
        starsBackground.forEach((layer, layerIndex) => {
            // Skip some layers in low quality mode
            if (GraphicsOptimizer.qualityLevel === 'low' && layerIndex > 1) {
                GraphicsOptimizer.incrementCulled();
                return;
            }
            
            layer.forEach(star => {
                // Move star downward at layer speed
                star.y += star.speed * dt * qualityMultiplier;
                
                // Wrap around screen
                if (star.y > CANVAS_HEIGHT) {
                    star.y = 0;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
                
                // Viewport culling
                if (GraphicsOptimizer.shouldCull(star.x, star.y, star.size * 2, star.size * 2)) {
                    GraphicsOptimizer.incrementCulled();
                    return;
                }
                
                // Twinkle effect - simplified for performance
                let twinkle = 1.0;
                if (GraphicsOptimizer.shouldRenderHighQuality() && layerIndex === 2) {
                    twinkle = 0.7 + 0.3 * Math.sin(Date.now() / (800 + star.speed * 10));
                }
                
                // Add to batch instead of drawing immediately
                GraphicsOptimizer.batchedDraw.add('stars', star.x, star.y, {
                    size: star.size * qualityMultiplier,
                    brightness: star.brightness * twinkle * qualityMultiplier
                });
                
                GraphicsOptimizer.incrementRendered();
            });
        });
        
        // Flush stars batch
        GraphicsOptimizer.batchedDraw.flushStars();
    } else {
        // Original rendering for high quality mode
        starsBackground.forEach((layer, layerIndex) => {
            // Skip some layers in low quality mode
            if (GraphicsOptimizer.qualityLevel === 'low' && layerIndex > 1) return;
            
            layer.forEach(star => {
                // Move star downward at layer speed
                star.y += star.speed * dt * qualityMultiplier;
                
                // Wrap around screen
                if (star.y > CANVAS_HEIGHT) {
                    star.y = 0;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
                
                // Twinkle effect
                let twinkle = 1.0;
                if (GraphicsOptimizer.shouldRenderHighQuality() && layerIndex === 2) {
                    twinkle = 0.7 + 0.3 * Math.sin(Date.now() / (800 + star.speed * 10));
                }
                
                // Draw star with size and brightness variations
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle * qualityMultiplier})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * qualityMultiplier, 0, Math.PI * 2);
                ctx.fill();
                
                GraphicsOptimizer.incrementRendered();
            });
        });
    }
    
    GraphicsOptimizer.endRenderTimer();
}

// Define formationMovement for controlling enemy formation movement
let formationMovement = {
    speed: 15, // Initial speed
    amplitude: 20 // Initial amplitude
};

// Setup wave patterns for more authentic Galaga behavior
function setupWavePatterns() {
    const baseAttackChance = 0.0005 + (Math.min(level, 10) * 0.0001);
    
    // Every 3rd level is a challenge stage
    challengeStageActive = level % 3 === 0;
    
    waveConfig = {
        baseAttackChance: baseAttackChance,
        maxAttackers: Math.min(2 + Math.floor(level/2), 6), // Cap at 6 simultaneous attackers
        groupAttackChance: level > 2 ? 0.01 : 0, // Chance for synchronized group attacks in higher levels
        divingSpeed: 180 + (level * 10), // Base diving speed increases with level
        returnToFormationChance: 0.7 - (Math.min(level, 10) * 0.04), // Higher levels reduce return likelihood
        attackCurveIntensity: 1 + (level * 0.2), // Controls how curved the attack paths are
    };
    
    // In challenge stages, enemies don't shoot but move faster
    if (challengeStageActive) {
        waveConfig.baseAttackChance *= 2;
        waveConfig.divingSpeed *= 1.5;
        waveConfig.maxAttackers += 2;
    }
    
    // Formation movement adjusts with level
    formationMovement.speed = 15 + (level * 2);
    formationMovement.amplitude = 20 + (level * 3);
}

// Setup enemy formation spots
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
                taken: false
            });
        }
    }
}

// Get an empty spot in the formation
function getEmptyFormationSpot() {
    const availableSpots = formationSpots.filter(s => !s.taken);
    if (availableSpots.length > 0) {
        return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }
    return null; // No spot available
}

// Enhanced enemy spawning for more authentic waves
function spawnEnemies() {
    setupFormation();
    enemies = [];
    setupWavePatterns();
    
    // Base number of enemies
    let numEnemies = 16 + Math.min(32, level * 2); 
    // Challenge stages have a special formation
    if (challengeStageActive) {
        numEnemies = 40; // More enemies in challenge stages
    }
    
    const enemyTypes = [
        ENEMY_TYPE.BASIC,
        ENEMY_TYPE.FAST,
        ENEMY_TYPE.TANK,
        ENEMY_TYPE.ZIGZAG,
        ENEMY_TYPE.SNIPER
    ];
    
    // Place enemies in formation with appropriate types per row
    // First two rows are typically basic
    // Third row typically has faster enemies
    // Bottom row typically has the tougher enemies
    for (let i = 0; i < numEnemies; i++) {
        const spot = getEmptyFormationSpot();
        if (!spot) break;
        spot.taken = true;
        
        // Determine enemy type by position (row) - more authentic to Galaga
        // In Galaga, different rows have different enemy types
        const row = Math.floor((spot.y - 60) / 30); // Calculate row based on y position
        
        let enemyType;
        if (row === 0) {
            // Top row - mostly basic enemies
            enemyType = Math.random() < 0.8 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 1) {
            // Second row - mix of basic and fast
            enemyType = Math.random() < 0.6 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 2) {
            // Third row - mostly fast with some zigzag
            enemyType = Math.random() < 0.7 ? ENEMY_TYPE.FAST : ENEMY_TYPE.ZIGZAG;
        } else {
            // Bottom row - tougher enemies
            const r = Math.random();
            if (r < 0.4) enemyType = ENEMY_TYPE.TANK;
            else if (r < 0.7) enemyType = ENEMY_TYPE.SNIPER;
            else enemyType = ENEMY_TYPE.ZIGZAG;
        }
        
        let enemyColor = '#0f0';
        switch (enemyType) {
            case ENEMY_TYPE.FAST: enemyColor = '#0ff'; break;
            case ENEMY_TYPE.TANK: enemyColor = '#f00'; break;
            case ENEMY_TYPE.ZIGZAG: enemyColor = '#f0f'; break;
            case ENEMY_TYPE.SNIPER: enemyColor = '#ff0'; break;
        }
        
        // Adjust enemy size based on type
        let enemyW = 24, enemyH = 24;
        if (enemyType === ENEMY_TYPE.TANK) { enemyW = 28; enemyH = 28; }
        if (enemyType === ENEMY_TYPE.FAST) { enemyW = 22; enemyH = 22; }
        
        const startSide = Math.random() > 0.5 ? -50 : CANVAS_WIDTH + 50;
        const startY = -50;
        
        // Enhanced entrance behavior with formation systems
        enemies.push({
            x: startSide,
            y: startY,
            w: enemyW,
            h: enemyH,
            type: enemyType,
            color: enemyColor,
            state: ENEMY_STATE.ENTRANCE,
            startX: startSide,
            startY: startY,
            targetX: spot.x,
            targetY: spot.y,
            controlX: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
            controlY: CANVAS_HEIGHT / 3,
            pathTime: 0,
            index: i,
            formationOffset: {
                x: Math.random() * 4 - 2,
                y: Math.random() * 4 - 2
            },
            attackPath: [], // Will store attack path points
            attackIndex: 0,
            attackTime: 0,
            canFire: !challengeStageActive, // No firing in challenge stages
            points: enemyType === ENEMY_TYPE.BASIC ? 50 :
                   enemyType === ENEMY_TYPE.FAST ? 80 :
                   enemyType === ENEMY_TYPE.TANK ? 150 :
                   enemyType === ENEMY_TYPE.ZIGZAG ? 100 :
                   enemyType === ENEMY_TYPE.SNIPER ? 120 : 50
        });
    }
    
    // Boss Galaga every 5 levels or special encounters
    if (level % 5 === 0 || (level > 10 && Math.random() < 0.3)) {
        bossGalaga = {
            x: CANVAS_WIDTH / 2,
            y: 40,
            w: 60,
            h: 50,
            color: '#f0f',
            health: 10 + Math.floor(level / 5),
            timer: 2,
            state: 'idle',
            hasCaptured: false,
            tractorBeamActive: false,
            points: 150 + (level * 10)
        };
    }
    
    // Reset attack queue
    attackQueue = [];
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.active) { // Remove inactive bullets from active list
            bullets.splice(i, 1);
            continue;
        }
        b.y -= b.speed * dt;
        if (b.y < 0) {
            b.active = false; // Deactivate when off-screen
            bullets.splice(i, 1);
        }
    }
}

// Update enemy bullets
function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        if (!eb.active) { // Remove inactive bullets from active list
            enemyBullets.splice(i, 1);
            continue;
        }

        eb.age += dt;

        // Movement patterns
        switch (eb.type) {
            case 'zigzag':
                eb.x += Math.sin(eb.age * 10 + eb.wobble) * 100 * dt; // eb.wobble for variation
                eb.y += eb.speed * dt;
                break;
            case 'homing': // Simple homing
                if (player.alive) {
                    const dx = player.x - eb.x;
                    const dy = player.y - eb.y;
                    const angle = Math.atan2(dy, dx);
                    eb.x += Math.cos(angle) * eb.speed * dt;
                    eb.y += Math.sin(angle) * eb.speed * dt;
                } else {
                    eb.y += eb.speed * dt; // Fall straight if player is dead
                }
                break;
            case 'split':
                eb.y += eb.speed * dt;
                // Split condition (e.g., after some time or at certain y)
                if (eb.age > 0.5 && !eb.hasSplit) {
                    eb.hasSplit = true;
                    eb.active = false; // Original bullet deactivates
                    for (let j = -1; j <= 1; j += 2) { // Create two new bullets
                        const splitBullet = getPoolObject('enemyBullets');
                        if (splitBullet) {
                            splitBullet.x = eb.x;
                            splitBullet.y = eb.y;
                            splitBullet.speed = eb.speed * 1.2;
                            splitBullet.type = 'fast'; // Or another type
                            splitBullet.color = '#f80'; // Orange
                            splitBullet.angle = Math.atan2(player.y - eb.y, player.x - eb.x) + j * 0.3; // Spread angle
                            splitBullet.from = 'enemy';
                            splitBullet.active = true;
                            enemyBullets.push(splitBullet);
                        }
                    }
                }
                break;
            case 'fast':
                eb.x += Math.cos(eb.angle) * eb.speed * dt;
                eb.y += Math.sin(eb.angle) * eb.speed * dt;
                break;
            default: // Straight
                eb.y += eb.speed * dt;
        }

        if (eb.y > CANVAS_HEIGHT || eb.x < -eb.w || eb.x > CANVAS_WIDTH + eb.w) {
            eb.active = false;
            enemyBullets.splice(i, 1);
        }
    }
}

// Function to make an enemy fire a bullet
function fireEnemyBullet(enemy) {
    if (challengeStageActive) return; // Enemies don't fire in challenge stages

    const bullet = getPoolObject('enemyBullets');
    if (bullet) {
        bullet.x = enemy.x;
        bullet.y = enemy.y + enemy.h / 2;
        bullet.w = 4;
        bullet.h = 12;
        bullet.speed = 150 + (level * 5); // Bullet speed increases with level
        bullet.damage = 1;
        bullet.from = 'enemy';
        bullet.active = true;
        bullet.age = 0;
        bullet.angle = Math.PI / 2; // Straight down by default

        // Basic bullet types for now, can be expanded
        const bulletTypeRoll = Math.random();
        if (enemy.type === ENEMY_TYPE.SNIPER && bulletTypeRoll < 0.7) {
            bullet.type = 'fast';
            bullet.color = '#ff0'; // Yellow for sniper
            bullet.speed *= 1.5;
            // Aim at player
            if (player.alive) {
                bullet.angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
            }
        } else if (enemy.type === ENEMY_TYPE.ZIGZAG && bulletTypeRoll < 0.5) {
            bullet.type = 'zigzag';
            bullet.color = '#f0f'; // Magenta for zigzag
            bullet.wobble = Math.random() * Math.PI; // For zigzag pattern
        } else if (bossGalaga && enemy === bossGalaga && bulletTypeRoll < 0.4) {
            bullet.type = 'split';
            bullet.color = '#f80'; // Orange for split
            bullet.hasSplit = false;
        }
        else {
            bullet.type = 'straight';
            bullet.color = '#f44'; // Default red
        }
        enemyBullets.push(bullet);
    }
}

// Generate realistic attack path for enemy diving
function generateAttackPath(enemy) {
    const pathPoints = [];
    const steps = 20; // Number of points in the path
    
    // Starting position
    pathPoints.push({x: enemy.x, y: enemy.y});
    
    // Target position (player's current position or slightly off for a miss)
    let targetX = player.x;
    if (!player.alive || Math.random() < 0.3) {
        // Target random spot if player is dead or sometimes deliberately miss
        targetX = CANVAS_WIDTH * (0.2 + Math.random() * 0.6);
    }
    
    // Control points for bezier curve
    const cp1 = {
        x: enemy.x + (targetX - enemy.x) * 0.3 + (Math.random() * 200 - 100),
        y: enemy.y + 80
    };
    
    const cp2 = {
        x: targetX + (Math.random() * 200 - 100),
        y: player.y - 80
    };
    
    // Final point below screen
    const finalY = CANVAS_HEIGHT + 50;
    
    // Generate cubic bezier path points
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        
        // Cubic bezier formula
        const x = Math.pow(1-t, 3) * enemy.x + 
                 3 * Math.pow(1-t, 2) * t * cp1.x + 
                 3 * (1-t) * Math.pow(t, 2) * cp2.x + 
                 Math.pow(t, 3) * targetX;
        
        const y = Math.pow(1-t, 3) * enemy.y + 
                 3 * Math.pow(1-t, 2) * t * cp1.y + 
                 3 * (1-t) * Math.pow(t, 2) * cp2.y + 
                 Math.pow(t, 3) * finalY;
        
        pathPoints.push({x, y});
    }
    
    enemy.attackPath = pathPoints;
    enemy.attackTime = 0;
}

// Launch coordinated group attack like original Galaga
function launchGroupAttack() {
    // Find eligible enemies in formation that aren't already attacking
    const eligibleEnemies = enemies.filter(e => 
        e.state === ENEMY_STATE.FORMATION && 
        !attackQueue.includes(e)
    );
    
    if (eligibleEnemies.length < 3) return; // Need enough enemies
    
    // Select enemies in same row for authentic group dive
    const referenceY = eligibleEnemies[0].targetY;
    const sameRowEnemies = eligibleEnemies.filter(e => 
        Math.abs(e.targetY - referenceY) < 5
    );
    
    // Take 2-4 enemies from the row
    const groupSize = Math.min(Math.floor(Math.random() * 3) + 2, sameRowEnemies.length);
    const attackGroup = [];
    
    // Pick random enemies from the row
    while (attackGroup.length < groupSize && sameRowEnemies.length > 0) {
        const index = Math.floor(Math.random() * sameRowEnemies.length);
        attackGroup.push(sameRowEnemies.splice(index, 1)[0]);
    }
    
    // Set them all to attack mode with slight delays
    attackGroup.forEach((enemy, index) => {
        setTimeout(() => {
            if (enemy.state === ENEMY_STATE.FORMATION) {
                enemy.state = ENEMY_STATE.ATTACK;
                generateAttackPath(enemy);
                attackQueue.push(enemy);
            }
        }, index * 200);
    });
}

// Enhanced draw boss function with tractor beam effect
function drawBossGalaga(boss) {
    if (!boss) return;
    
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(Math.sin(Date.now() / 1000) * 0.05);
    
    // Create patterns and gradients for the boss
    const bodyGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    bodyGradient.addColorStop(0, '#f0f');
    bodyGradient.addColorStop(0.6, '#b0b');
    bodyGradient.addColorStop(1, '#808');
    
    // Draw glowing aura
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw the boss body and details
    ctx.save();
    ctx.fillStyle = bodyGradient;
    // Central body section
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-22, 4);
    ctx.lineTo(-14, 12);
    ctx.lineTo(14, 12);
    ctx.lineTo(22, 4);
    ctx.lineTo(18, -12);
    ctx.closePath();
    ctx.fill();
    
    // Top head section
    ctx.fillStyle = '#d0d';
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, -2);
    ctx.lineTo(16, -2);
    ctx.lineTo(12, -12);
    ctx.closePath();
    ctx.fill();
    
    // Detail lines
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(-14, 6);
    ctx.lineTo(14, 6);
    ctx.stroke();
    ctx.restore();
    
    // Detailed wings with proper Galaga shape
    ctx.fillStyle = '#ff0'; 
    // Left wing
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-28, -2);
    ctx.lineTo(-30, 10);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.fill();
    
    // Right wing
    ctx.beginPath();
    ctx.moveTo(18, -8);
    ctx.lineTo(28, -2);
    ctx.lineTo(30, 10);
    ctx.lineTo(18, 6);
    ctx.closePath();
    ctx.fill();
    
    // Wing details
    ctx.fillStyle = '#f0f';
    ctx.beginPath();
    ctx.rect(-26, 0, 4, 4);
    ctx.rect(22, 0, 4, 4);
    ctx.fill();
    
    // Crown - more detailed with accurate Galaga boss antenna
    ctx.fillStyle = '#0ff';
    // Center spike
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.lineTo(0, -28);
    ctx.lineTo(2, -18);
    ctx.closePath();
    ctx.fill();
    
    // Side antennas
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, -20);
    ctx.lineTo(-10, -16);
    ctx.closePath();
    ctx.moveTo(12, -12);
    ctx.lineTo(16, -20);
    ctx.lineTo(10, -16);
    ctx.closePath();
    ctx.fill();
    
    // Glowing eyes with animation
    const eyeGlow = ctx.createRadialGradient(0, -6, 1, 0, -6, 6);
    eyeGlow.addColorStop(0, '#fff');
    eyeGlow.addColorStop(0.6, '#ff0');
    eyeGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');

    ctx.fillStyle = eyeGlow;
    ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(-8, -6, 4, 0, Math.PI * 2);
    ctx.arc(8, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner eyes
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-8, -6, 2, 0, Math.PI * 2);
    ctx.arc(8, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Captured ship (if present)
    if (boss.hasCaptured) {
        ctx.save();
        ctx.translate(0, 22);
        
        // Enhanced tractor beam
        const tractorGradient = ctx.createLinearGradient(0, -20, 0, 10);
        tractorGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        tractorGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
        tractorGradient.addColorStop(1, 'rgba(255, 255, 0, 0.1)');
        
        // Main beam
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 150);
        ctx.fillStyle = tractorGradient;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(14, -14);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        
        // Animated beam particles
        ctx.fillStyle = '#ff0';
        for (let i = 0; i < 5; i++) {
            const offset = (Date.now() / 300 + i * 0.2) % 1;
            const y = -14 + offset * 24;
            const width = 20 - offset * 10;
            ctx.globalAlpha = 0.7 - offset * 0.5;
            ctx.fillRect(-width/2, y, width, 1.5);
        }
        
        // Captured ship - using the authentic Galaga fighter design
        ctx.scale(0.7, 0.7);
        ctx.translate(0, 4);
        ctx.globalAlpha = 1.0;
        
        // Draw captured ship rotating slowly for dramatic effect
        ctx.save();
        ctx.rotate(Math.sin(Date.now() / 2000) * 0.2);
        
        // Main body with authentic Galaga fighter shape
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        
        // White center section
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -16);  // Top point
        ctx.lineTo(-5, -10); // Upper left corner
        ctx.lineTo(-8, 8);   // Lower left
        ctx.lineTo(8, 8);    // Lower right
       

        ctx.lineTo(5, -10);  // Upper right corner
        ctx.closePath();
        ctx.fill();
        
        // Red side wings
        ctx.fillStyle = '#f00';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-16, 8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(5, -10);
        ctx.lineTo(16, 0);
        ctx.lineTo(16, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Blue cockpit detail
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(3, -6);
        ctx.lineTo(-3, -6);
        ctx.closePath();
        ctx.fill();
        
        // Special pulsating glow effect for captured ship
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() / 200);
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-20, -20, 40, 40);
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
        ctx.restore();
    }
    
    ctx.restore();
}

// Enhanced enemy drawing with enum-based type checks for better performance
const ENEMY_TYPE = {
    BASIC: 'basic',
    FAST: 'fast',
    TANK: 'tank',
    ZIGZAG: 'zigzag',
    SNIPER: 'sniper'
};

// function drawEnemy(e) {
//     // Implement drawing logic here or remove this function if unused
// }

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Update enemy based on state
        switch (enemy.state) {
            case ENEMY_STATE.ENTRANCE:
                // Move to formation using bezier curve
                enemy.pathTime += dt * 2; // Speed of entrance
                if (enemy.pathTime >= 1) {
                    enemy.state = ENEMY_STATE.FORMATION;
                    enemy.x = enemy.targetX;
                    enemy.y = enemy.targetY;
                } else {
                    // Bezier curve for entrance
                    const t = enemy.pathTime;
                    const startX = enemy.startX;
                    const startY = enemy.startY;
                    const controlX = enemy.controlX;
                    const controlY = enemy.controlY;
                    const endX = enemy.targetX;
                    const endY = enemy.targetY;
                    
                    enemy.x = Math.pow(1-t, 2) * startX + 2 * (1-t) * t * controlX + Math.pow(t, 2) * endX;
                    enemy.y = Math.pow(1-t, 2) * startY + 2 * (1-t) * t * controlY + Math.pow(t, 2) * endY;
                }
                break;
                
            case ENEMY_STATE.FORMATION:
                // Formation movement
                const formationTime = Date.now() / 1000;
                enemy.x = enemy.targetX + Math.sin(formationTime * formationMovement.speed / 10) * formationMovement.amplitude + enemy.formationOffset.x;
                enemy.y = enemy.targetY + enemy.formationOffset.y;
                
                // Random attack chance
                if (enemy.canFire && Math.random() < waveConfig.baseAttackChance) {
                    enemy.state = ENEMY_STATE.ATTACK;
                    generateAttackPath(enemy);
                    attackQueue.push(enemy);
                }
                
                // Random firing
                if (enemy.canFire && Math.random() < waveConfig.baseAttackChance * 0.5) {
                    fireEnemyBullet(enemy);
                }
                break;
                
            case ENEMY_STATE.ATTACK:
                // Follow attack path
                enemy.attackTime += dt * waveConfig.divingSpeed / 100;
                if (enemy.attackIndex < enemy.attackPath.length) {
                    const target = enemy.attackPath[enemy.attackIndex];
                    const dx = target.x - enemy.x;
                    const dy = target.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 20) {
                        enemy.attackIndex++;
                    } else {
                        enemy.x += (dx / distance) * waveConfig.divingSpeed * dt;
                        enemy.y += (dy / distance) * waveConfig.divingSpeed * dt;
                    }
                    
                    // Fire occasionally during attack
                    if (enemy.canFire && Math.random() < 0.003) {
                        fireEnemyBullet(enemy);
                    }
                } else {
                    // Return to formation or go off screen
                    if (Math.random() < waveConfig.returnToFormationChance) {
                        enemy.state = ENEMY_STATE.FORMATION;
                        const index = attackQueue.indexOf(enemy);
                        if (index > -1) attackQueue.splice(index, 1);
                    } else {
                        // Enemy escapes off screen
                        enemy.y += waveConfig.divingSpeed * dt;
                        if (enemy.y > CANVAS_HEIGHT + 50) {
                            enemies.splice(i, 1);
                            const index = attackQueue.indexOf(enemy);
                            if (index > -1) attackQueue.splice(index, 1);
                        }
                    }
                }
                break;
        }
    }
    
    // Update boss Galaga if present
    if (bossGalaga) {
        bossGalaga.timer -= dt;
        if (bossGalaga.timer <= 0) {
            bossGalaga.timer = 1 + Math.random();
            if (Math.random() < 0.3) {
                fireEnemyBullet(bossGalaga);
            }
        }
        
        // Simple movement pattern for boss
        const bossTime = Date.now() / 1000;
        bossGalaga.x = CANVAS_WIDTH / 2 + Math.sin(bossTime * 0.5) * 100;
    }
}

// Placeholder for updatePowerups function
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Simple downward movement
        powerup.y += 50 * dt;
        
        // Remove if off screen
        if (powerup.y > CANVAS_HEIGHT + 20) {
            powerups.splice(i, 1);
        }
    }
}

// Main gameplay update function
function updateGameplay() {
    if (levelTransition > 0) {
        levelTransition -= dt;
        return; // Don't update gameplay during level transitions
    }
    
    // Update screen shake
    if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - dt * 20);
    }
    
    // Update all game entities
    updatePlayer();
    updateBullets();
    updateEnemyBullets();
    updateEnemies();
    updatePowerups();
    updateParticles();
    
    // Check collisions
    checkCollisions();
    
    // Check level completion
    if (enemies.length === 0 && !bossGalaga && levelTransition <= 0) {
        level++;
        levelTransition = 2; // 2 seconds for level transition
        spawnEnemies();
    }
}

// Initialize graphics optimization system
GraphicsOptimizer.init();

// Add keyboard shortcuts for graphics debugging
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
            case '1':
                GraphicsOptimizer.setQualityLevel('low');
                console.log('Manually set quality to LOW');
                break;
            case '2':
                GraphicsOptimizer.setQualityLevel('medium');
                console.log('Manually set quality to MEDIUM');
                break;
            case '3':
                GraphicsOptimizer.setQualityLevel('high');
                console.log('Manually set quality to HIGH');
                break;
            case 'P':
                window.showGraphicsPerformance();
                break;
        }
    }
});

console.log('Graphics optimization system fully initialized!');
console.log('Debug shortcuts: Ctrl+Shift+1/2/3 for quality levels, Ctrl+Shift+P for performance info');

// Initialize placeholder for touch controls
function initTouchControls() {
    // TODO: Implement touch controls initialization
}

// Main game initialization
function initGame() {
    console.log('Initializing game...');
    
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
        keys[e.code] = true;
        
        // Handle game state specific keys
        if (state === GAME_STATE.SPLASH && e.code === 'Space') {
            state = GAME_STATE.PLAYING;
            resetGame();
        } else if (state === GAME_STATE.GAME_OVER && e.code === 'Space') {
            state = GAME_STATE.SPLASH;
            fetchHighScores();
        } else if (state === GAME_STATE.PLAYING && e.code === 'KeyP') {
            handlePause();
        } else if (state === GAME_STATE.PAUSED && e.code === 'KeyP') {
            handleResume();
        } else if (state === GAME_STATE.ENTER_HIGH_SCORE) {
            handleHighScoreInput(e);
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

// High score input handling
function handleHighScoreInput(e) {
    if (e.code === 'Backspace' && currentInitialIndex > 0) {
        e.preventDefault();
        currentInitialIndex--;
        playerInitials[currentInitialIndex] = "_";
    } else if (e.code === 'Enter' && currentInitialIndex >= 3) {
        e.preventDefault();
        const playerName = playerInitials.slice(0, 5).join("").replace(/_/g, " ").trim();
        if (playerName.length > 0) {
            saveHighScore(playerName, score);
            player.highScoreSubmitted = true;
            state = GAME_STATE.SPLASH;
            fetchHighScores();
        }
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/) && currentInitialIndex < 5) {
        e.preventDefault();
        playerInitials[currentInitialIndex] = e.key.toUpperCase();
        currentInitialIndex++;
    }
}

// Start the game when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}