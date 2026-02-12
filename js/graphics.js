// ============================================
// GRAPHICS OPTIMIZER
// Performance monitoring and quality adjustment
// ============================================

const GraphicsOptimizer = {
    qualityLevel: 'high',
    adaptiveQuality: true,
    targetFPS: 60,
    
    // Performance monitoring
    frameCount: 0,
    frameTime: 0,
    lastFrameTime: performance.now(),
    avgFrameTime: 16.67,
    performanceHistory: [],
    lastQualityAdjustment: 0,
    
    // Quality presets
    qualityPresets: null, // Will be set from GameConfig
    
    // Initialize graphics optimizer
    init() {
        this.qualityPresets = GameConfig.QUALITY_PRESETS;
        this.detectCapabilities();
        this.adjustQualityBasedOnDevice();
        this.startPerformanceMonitoring();
        // Graphics optimizer ready
        return this;
    },
    
    // Detect device capabilities
    detectCapabilities() {
        this.useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                debugLog('GPU Renderer:', renderer);
                
                if (renderer.includes('Intel') && renderer.includes('HD')) {
                    this.qualityLevel = 'medium';
                } else if (renderer.includes('Software') || renderer.includes('llvmpipe')) {
                    this.qualityLevel = 'low';
                }
            }
        }
    },
    
    // Adjust quality based on device
    adjustQualityBasedOnDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : this.qualityLevel;
        }
        
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            this.qualityLevel = 'low';
        }
        
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : 'low';
        }
    },
    
    // Start performance monitoring
    startPerformanceMonitoring() {
        if (!this.adaptiveQuality) return;
        
        setInterval(() => {
            this.analyzePerformance();
        }, 2000);
    },
    
    // Track frame rendering
    frameRendered() {
        const now = performance.now();
        this.frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.frameCount++;
        
        this.performanceHistory.push(this.frameTime);
        if (this.performanceHistory.length > 60) {
            this.performanceHistory.shift();
        }
    },
    
    // Analyze performance and adjust quality
    analyzePerformance() {
        if (this.performanceHistory.length < 30) return;
        
        const avgFrameTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
        const currentFPS = 1000 / avgFrameTime;
        
        const now = performance.now();
        if (now - this.lastQualityAdjustment < 5000) return;
        
        if (currentFPS < 30 && this.qualityLevel !== 'low') {
            this.qualityLevel = this.qualityLevel === 'high' ? 'medium' : 'low';
            this.lastQualityAdjustment = now;
            debugLog(`FPS low (${currentFPS.toFixed(1)}), reducing quality to ${this.qualityLevel}`);
        } else if (currentFPS > 55 && this.qualityLevel !== 'high') {
            this.qualityLevel = this.qualityLevel === 'low' ? 'medium' : 'high';
            this.lastQualityAdjustment = now;
            debugLog(`FPS good (${currentFPS.toFixed(1)}), increasing quality to ${this.qualityLevel}`);
        }
    },
    
    // Get current quality settings
    getQualitySettings() {
        return this.qualityPresets[this.qualityLevel];
    },
    
    // Check if object should be culled (off-screen)
    shouldCull(x, y, width = 32, height = 32, canvasWidth, canvasHeight) {
        const padding = 50;
        return (
            x + width < -padding ||
            x > canvasWidth + padding ||
            y + height < -padding ||
            y > canvasHeight + padding
        );
    },
    
    // Get FPS
    getFPS() {
        return this.frameTime > 0 ? 1000 / this.frameTime : 0;
    },
    
    // Get average FPS
    getAvgFPS() {
        if (this.performanceHistory.length === 0) return 0;
        const avg = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
        return 1000 / avg;
    },
    
    // Batch render particles by color (major optimization)
    batchRenderParticles(ctx, particles) {
        if (particles.length === 0) return;
        
        // Group particles by color for minimal state changes
        const particlesByColor = new Map();
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            const color = particle.color;
            if (!particlesByColor.has(color)) {
                particlesByColor.set(color, []);
            }
            particlesByColor.get(color).push(particle);
        }
        
        // Render each color group with computed alpha
        ctx.save();
        particlesByColor.forEach((group, color) => {
            ctx.fillStyle = color;
            
            for (let i = 0; i < group.length; i++) {
                const particle = group[i];
                const alpha = particle.maxLife > 0 ? particle.life / particle.maxLife : 0;
                ctx.globalAlpha = alpha;
                
                // Use fillRect for small particles (faster than arc)
                const size = particle.size;
                if (size <= 2) {
                    ctx.fillRect(particle.x - size * 0.5, particle.y - size * 0.5, size, size);
                } else {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        ctx.restore();
    },
    
    // Batch render bullets
    batchRenderBullets(ctx, bullets) {
        if (bullets.length === 0) return;
        
        // Group by color
        const bulletsByColor = new Map();
        bullets.forEach(bullet => {
            const color = bullet.color || '#ffff00';
            if (!bulletsByColor.has(color)) {
                bulletsByColor.set(color, []);
            }
            bulletsByColor.get(color).push(bullet);
        });
        
        ctx.save();
        bulletsByColor.forEach((group, color) => {
            ctx.fillStyle = color;
            group.forEach(bullet => {
                ctx.fillRect(bullet.x - 1, bullet.y - 4, 2, 8);
            });
        });
        ctx.restore();
    },
    
    // Reset optimizer
    reset() {
        this.frameCount = 0;
        this.performanceHistory = [];
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsOptimizer;
}
