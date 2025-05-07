// Renderer class for optimized canvas rendering
class GameRenderer {
    constructor(game) {
        this.game = game;
        this.width = game.width;
        this.height = game.height;
        
        // Main canvas (visible)
        this.mainCanvas = game.canvas;
        this.mainCtx = game.ctx;
        
        // Create offscreen canvases for different layers
        this.createOffscreenCanvas();
        
        // Set rendering flags
        this.needsBackgroundUpdate = true;
        this.needsEnemyUpdate = true;
        this.useRequestAnimationFrame = true;
        
        // Track previous positions for partial rendering
        this.prevPlayerPos = { x: 0, y: 0 };
    }
    
    createOffscreenCanvas() {
        // Background layer (stars)
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.bgCtx = this.bgCanvas.getContext('2d', { alpha: false });
        
        // Enemy layer
        this.enemyCanvas = document.createElement('canvas');
        this.enemyCanvas.width = this.width;
        this.enemyCanvas.height = this.height;
        this.enemyCtx = this.enemyCanvas.getContext('2d', { alpha: true });
        
        // Player layer
        this.playerCanvas = document.createElement('canvas');
        this.playerCanvas.width = this.width;
        this.playerCanvas.height = this.height;
        this.playerCtx = this.playerCanvas.getContext('2d', { alpha: true });
        
        // Effects layer (explosions, powerups)
        this.effectsCanvas = document.createElement('canvas');
        this.effectsCanvas.width = this.width;
        this.effectsCanvas.height = this.height;
        this.effectsCtx = this.effectsCanvas.getContext('2d', { alpha: true });
        
        // UI layer
        this.uiCanvas = document.createElement('canvas');
        this.uiCanvas.width = this.width;
        this.uiCanvas.height = this.height;
        this.uiCtx = this.uiCanvas.getContext('2d', { alpha: true });
    }
    
    // Clear a specific canvas
    clearCanvas(ctx, fillStyle = 'black') {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Render background (starfield)
    renderBackground() {
        if (!this.game.starfield || !this.needsBackgroundUpdate) return;
        
        // Clear background canvas
        this.clearCanvas(this.bgCtx);
        
        // Draw starfield on background canvas
        const originalCtx = this.game.ctx;
        this.game.ctx = this.bgCtx; // Temporarily redirect rendering
        this.game.starfield.draw();
        this.game.ctx = originalCtx; // Restore original context
        
        // Mark as updated
        this.needsBackgroundUpdate = false;
    }
    
    // Render enemies
    renderEnemies() {
        if (!this.game.enemyManager) return;
        
        // Clear enemy canvas
        this.clearCanvas(this.enemyCtx, 'transparent');
        
        // Draw enemies on enemy canvas
        const originalCtx = this.game.ctx;
        this.game.ctx = this.enemyCtx;
        this.game.enemyManager.draw();
        this.game.ctx = originalCtx;
    }
      // Render player
    renderPlayer() {
        if (!this.game.player) return;
        
        // Clear entire player canvas to prevent trails
        this.clearCanvas(this.playerCtx, 'transparent');
        
        // Store current position for next frame
        this.prevPlayerPos = { x: this.game.player.x, y: this.game.player.y };
        
        // Draw player on player canvas
        const originalCtx = this.game.ctx;
        this.game.ctx = this.playerCtx;
        this.game.player.draw();
        this.game.ctx = originalCtx;
    }
    
    // Render projectiles and effects
    renderEffects() {
        // Clear effects canvas
        this.clearCanvas(this.effectsCtx, 'transparent');
        
        const originalCtx = this.game.ctx;
        this.game.ctx = this.effectsCtx;
        
        // Draw projectiles
        if (this.game.projectilePool) {
            this.game.projectilePool.draw();
        }
        
        // Draw explosions
        if (this.game.explosionPool) {
            this.game.explosionPool.draw();
        }
        
        // Draw powerups
        if (this.game.powerUpManager) {
            this.game.powerUpManager.draw();
        }
        
        // Draw point popups
        if (typeof this.game.drawPointsPopups === 'function') {
            this.game.drawPointsPopups();
        }
        
        this.game.ctx = originalCtx;
    }
    
    // Render UI elements
    renderUI() {
        if (this.game.gameState !== 'playing') return;
        
        // Could implement UI rendering here if needed
    }
    
    // Composite all layers to main canvas
    compositeLayers() {
        // Clear main canvas
        this.clearCanvas(this.mainCtx);
        
        // Draw all layers in order
        this.mainCtx.drawImage(this.bgCanvas, 0, 0);
        this.mainCtx.drawImage(this.enemyCanvas, 0, 0);
        this.mainCtx.drawImage(this.playerCanvas, 0, 0);
        this.mainCtx.drawImage(this.effectsCanvas, 0, 0);
        
        // Draw light speed effect directly on main canvas if active
        if (this.game.lightSpeedActive) {
            const originalCtx = this.game.ctx;
            this.game.ctx = this.mainCtx;
            this.game.renderLightSpeedEffect();
            this.game.ctx = originalCtx;
        }
        
        // Draw UI layer last
        this.mainCtx.drawImage(this.uiCanvas, 0, 0);
        
        // If paused, draw pause overlay directly on main canvas
        if (this.game.isPaused) {
            const originalCtx = this.game.ctx;
            this.game.ctx = this.mainCtx;
            this.game.renderPauseOverlay();
            this.game.ctx = originalCtx;
        }
    }
      // Main render method
    render() {
        // Always update background to prevent rendering artifacts
        this.needsBackgroundUpdate = true;
        
        // Clear all layer canvases first to prevent pixel accumulation
        this.clearCanvas(this.bgCtx, 'black');
        this.clearCanvas(this.enemyCtx, 'transparent');
        this.clearCanvas(this.playerCtx, 'transparent');
        this.clearCanvas(this.effectsCtx, 'transparent');
        this.clearCanvas(this.uiCtx, 'transparent');
        
        // Render each layer
        this.renderBackground();
        this.renderEnemies();
        this.renderPlayer();
        this.renderEffects();
        this.renderUI();
        
        // Composite layers to main canvas
        this.compositeLayers();
    }
}
