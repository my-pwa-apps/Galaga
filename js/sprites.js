// ============================================
// ALIEN SPRITES SYSTEM
// All enemy alien drawing functions
// ============================================

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
    },
    
    // Draw dragonfly enemy (fast, zigzag movement)
    drawDragonfly(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingBeat = Math.sin(time * 15) * 0.2;
        
        // Elongated body
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Segments
        ctx.strokeStyle = '#00aa66';
        ctx.lineWidth = 1;
        for (let i = -10; i < 10; i += 4) {
            ctx.beginPath();
            ctx.moveTo(-4, i);
            ctx.lineTo(4, i);
            ctx.stroke();
        }
        
        // Four wings (dragonfly has 4 wings)
        ctx.fillStyle = 'rgba(100, 255, 255, 0.4)';
        // Upper wings
        ctx.beginPath();
        ctx.ellipse(-6, -4, 12, 4, -0.2 + wingBeat, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -4, 12, 4, 0.2 - wingBeat, 0, Math.PI * 2);
        ctx.fill();
        // Lower wings
        ctx.beginPath();
        ctx.ellipse(-6, 2, 10, 3, -0.1 - wingBeat, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, 2, 10, 3, 0.1 + wingBeat, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Compound eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-2, -12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(2, -12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw wasp enemy (aggressive, shoots often)
    drawWasp(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingFlap = Math.sin(time * 14) * 0.35;
        const abdomenPulse = attacking ? Math.sin(time * 20) * 0.15 : 0;
        
        // Head
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Thorax
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Abdomen (striped)
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.ellipse(0, 9 + abdomenPulse, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Black stripes on abdomen
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, 5, 8, 2);
        ctx.fillRect(-4, 10, 8, 2);
        ctx.fillRect(-4, 15, 8, 2);
        
        // Wings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-7, -2, 8, 10, -0.3 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(7, -2, 8, 10, 0.3 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        
        // Stinger (glows when attacking)
        ctx.fillStyle = attacking ? '#ff0000' : '#333333';
        ctx.beginPath();
        ctx.moveTo(0, 19);
        ctx.lineTo(-2, 23);
        ctx.lineTo(2, 23);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -9, 1, 2);
        ctx.fillRect(1, -9, 1, 2);
        
        ctx.restore();
    },
    
    // Draw beetle enemy (armored, high HP)
    drawBeetle(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const legMove = Math.sin(time * 8) * 0.3;
        const shieldPulse = 0.9 + Math.sin(time * 3) * 0.1;
        
        // Shell/carapace with metallic look
        const gradient = ctx.createRadialGradient(0, -2, 0, 0, 0, 12);
        gradient.addColorStop(0, '#6633cc');
        gradient.addColorStop(0.5, '#4411aa');
        gradient.addColorStop(1, '#220077');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * shieldPulse, 12 * shieldPulse, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shell detail line
        ctx.strokeStyle = '#8855ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.stroke();
        
        // Legs (6 legs like real beetles)
        ctx.strokeStyle = '#220077';
        ctx.lineWidth = 2;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(side * 8, -4 + i * 4);
                ctx.lineTo(side * (12 + legMove), -2 + i * 4);
                ctx.stroke();
            }
        }
        
        // Mandibles
        ctx.strokeStyle = '#aa66ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, -12);
        ctx.lineTo(-6, -16);
        ctx.moveTo(3, -12);
        ctx.lineTo(6, -16);
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-4, -8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw enemy by type
    draw(ctx, type, x, y, time, scale = 1, attacking = false) {
        switch (type) {
            case 'bee':
                this.drawBee(ctx, x, y, time, scale, attacking);
                break;
            case 'butterfly':
                this.drawButterfly(ctx, x, y, time, scale, attacking);
                break;
            case 'boss':
                this.drawBoss(ctx, x, y, time, scale, attacking);
                break;
            case 'scorpion':
                this.drawScorpion(ctx, x, y, time, scale, attacking);
                break;
            case 'moth':
                this.drawMoth(ctx, x, y, time, scale, attacking);
                break;
            case 'dragonfly':
                this.drawDragonfly(ctx, x, y, time, scale, attacking);
                break;
            case 'wasp':
                this.drawWasp(ctx, x, y, time, scale, attacking);
                break;
            case 'beetle':
                this.drawBeetle(ctx, x, y, time, scale, attacking);
                break;
            default:
                // Fallback: simple circle
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fill();
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlienSprites;
}
