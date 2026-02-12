// ============================================
// RENDERING ENGINE
// Handles all drawing operations
// ============================================

const Renderer = {
    canvas: null,
    ctx: null,
    
    // Initialize renderer
    init(canvasId = 'gameCanvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Renderer ready
        return this;
    },
    
    // Clear screen
    clear(color = GameConfig.COLORS.BACKGROUND) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    // Apply screen shake
    applyScreenShake(amount) {
        if (amount > 0) {
            const shakeX = (Math.random() - 0.5) * amount * 2;
            const shakeY = (Math.random() - 0.5) * amount * 2;
            this.ctx.translate(shakeX, shakeY);
            return true;
        }
        return false;
    },
    
    // Reset transforms
    resetTransform() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    
    // Draw text with shadow
    drawText(text, x, y, options = {}) {
        const {
            font = '16px monospace',
            color = GameConfig.COLORS.TEXT,
            align = 'left',
            baseline = 'top',
            shadow = false,
            shadowColor = '#000',
            shadowBlur = 4
        } = options;
        
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        if (shadow) {
            this.ctx.shadowColor = shadowColor;
            this.ctx.shadowBlur = shadowBlur;
        }
        
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    },
    
    // Draw rectangle
    drawRect(x, y, w, h, color, options = {}) {
        const { outline = false, lineWidth = 1 } = options;
        
        this.ctx.save();
        if (outline) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(x, y, w, h);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, w, h);
        }
        this.ctx.restore();
    },
    
    // Draw circle
    drawCircle(x, y, radius, color, options = {}) {
        const { outline = false, lineWidth = 1 } = options;
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (outline) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.restore();
    },
    
    // Draw line
    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    },
    
    // Draw polygon
    drawPolygon(points, color, options = {}) {
        const { outline = false, lineWidth = 1, closed = true } = options;
        
        if (points.length < 2) return;
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        if (closed) {
            this.ctx.closePath();
        }
        
        if (outline) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.restore();
    },
    
    // Draw with alpha
    withAlpha(alpha, drawFunc) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        drawFunc();
        this.ctx.restore();
    },
    
    // Draw with rotation
    withRotation(x, y, angle, drawFunc) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        drawFunc();
        this.ctx.restore();
    },
    
    // Draw with scale
    withScale(x, y, scaleX, scaleY, drawFunc) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scaleX, scaleY);
        drawFunc();
        this.ctx.restore();
    },
    
    // Create gradient
    createLinearGradient(x0, y0, x1, y1, colorStops) {
        const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach(([offset, color]) => {
            gradient.addColorStop(offset, color);
        });
        return gradient;
    },
    
    // Create radial gradient
    createRadialGradient(x0, y0, r0, x1, y1, r1, colorStops) {
        const gradient = this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        colorStops.forEach(([offset, color]) => {
            gradient.addColorStop(offset, color);
        });
        return gradient;
    },
    
    // Measure text width
    measureText(text, font = '16px monospace') {
        this.ctx.save();
        this.ctx.font = font;
        const width = this.ctx.measureText(text).width;
        this.ctx.restore();
        return width;
    },
    
    // Get canvas dimensions
    get width() {
        return this.canvas.width;
    },
    
    get height() {
        return this.canvas.height;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
