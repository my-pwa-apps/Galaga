// Enhanced sprite definitions and rendering with more variations

class Sprite {
    constructor(options) {
        this.width = options.width || 30;
        this.height = options.height || 30;
        this.color = options.color || '#FFFFFF';
        this.type = options.type || 'rectangle';
        this.drawFunction = options.drawFunction || null;
    }

    draw(ctx, x, y, variation = 0, hitFlash = 0) {
        if (this.drawFunction) {
            this.drawFunction(ctx, x, y, this.width, this.height, this.color, variation, hitFlash);
            return;
        }
        
        ctx.fillStyle = this.color;
        
        if (this.type === 'rectangle') {
            ctx.fillRect(x - this.width/2, y - this.height/2, this.width, this.height);
        } else if (this.type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(x, y - this.height/2);
            ctx.lineTo(x - this.width/2, y + this.height/2);
            ctx.lineTo(x + this.width/2, y + this.height/2);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(x, y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Advanced drawing functions for sprites
const drawPlayerShip = (ctx, x, y, width, height, color) => {
    // Ship body
    ctx.save();
    
    // Enhanced glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0080FF';
    
    // Main body with gradient for more visual appeal
    const bodyGradient = ctx.createLinearGradient(x, y - height/2, x, y + height/2);
    bodyGradient.addColorStop(0, '#60A0FF'); // Lighter blue at top
    bodyGradient.addColorStop(0.5, '#3090FF'); // Medium blue in middle
    bodyGradient.addColorStop(1, '#0060DD'); // Darker blue at bottom
    
    ctx.fillStyle = bodyGradient;
    
    // Improved ship shape with curves
    ctx.beginPath();
    ctx.moveTo(x, y - height/2); // Top point
    ctx.quadraticCurveTo(x + width/4, y - height/4, x + width/2, y + height/3); // Right wing curve
    ctx.lineTo(x + width/3, y + height/2); // Right bottom corner
    ctx.lineTo(x - width/3, y + height/2); // Left bottom corner
    ctx.lineTo(x - width/2, y + height/3); // Left wing edge
    ctx.quadraticCurveTo(x - width/4, y - height/4, x, y - height/2); // Left wing curve
    ctx.closePath();
    ctx.fill();
    
    // Wing details/highlights
    const detailGradient = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
    detailGradient.addColorStop(0, 'rgba(180, 220, 255, 0.8)');
    detailGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    detailGradient.addColorStop(1, 'rgba(180, 220, 255, 0.8)');
    
    ctx.fillStyle = detailGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - height/4);
    ctx.lineTo(x + width/3, y + height/6);
    ctx.lineTo(x - width/3, y + height/6);
    ctx.closePath();
    ctx.fill();
    
    // Enhanced engine glow
    const engineGlowColor = ctx.createRadialGradient(
        x, y + height/2, 0,
        x, y + height/2, width/2
    );
    engineGlowColor.addColorStop(0, '#FFFFFF');
    engineGlowColor.addColorStop(0.3, '#80C0FF');
    engineGlowColor.addColorStop(0.6, '#0080FF');
    engineGlowColor.addColorStop(1, 'rgba(0,128,255,0)');
    
    ctx.fillStyle = engineGlowColor;
    ctx.beginPath();
    ctx.arc(x, y + height/2.5, width/3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cockpit with gradient
    const cockpitGradient = ctx.createRadialGradient(
        x, y, width/12,
        x, y, width/6
    );
    cockpitGradient.addColorStop(0, '#FFFFFF');
    cockpitGradient.addColorStop(0.7, '#B0E0FF');
    cockpitGradient.addColorStop(1, '#80C0FF');
    
    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.ellipse(x, y, width/6, height/6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing details - enhanced with gradients
    const wingGradient = ctx.createLinearGradient(x - width/4, y, x, y);
    wingGradient.addColorStop(0, '#60A0FF');
    wingGradient.addColorStop(1, '#B0D0FF');
    
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(x + width/4, y);
    ctx.lineTo(x + width/3, y + height/3);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x - width/4, y);
    ctx.lineTo(x - width/3, y + height/3);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    
    // Add some tech details/lines on the wings
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.7)';
    ctx.lineWidth = 1;
    
    // Right wing detail
    ctx.beginPath();
    ctx.moveTo(x + width/6, y);
    ctx.lineTo(x + width/4, y + height/4);
    ctx.stroke();
    
    // Left wing detail
    ctx.beginPath();
    ctx.moveTo(x - width/6, y);
    ctx.lineTo(x - width/4, y + height/4);
    ctx.stroke();
    
    ctx.restore();
};

// Basic Enemy Aliens - With 5 distinct variations
const drawBasicEnemy = (ctx, x, y, width, height, color, variation = 0, hitFlash = 0) => {
    ctx.save();
    
    // Hit flash effect
    if (hitFlash > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, width * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }
    
    // Get variation from 0-4 (5 variations) using modulo in case we get higher numbers
    const actualVariation = variation % 5;
      // Enhanced color schemes with more vibrant colors and glow effect values
    const colorSchemes = [
        { primary: '#FF3000', secondary: '#FF5020', accent: '#FFFF00', glow: '#FF6600' }, // Red/Orange
        { primary: '#30B0FF', secondary: '#5080FF', accent: '#FFFFFF', glow: '#00CCFF' }, // Blue
        { primary: '#60FF30', secondary: '#40C020', accent: '#FFFF00', glow: '#80FF60' }, // Green
        { primary: '#B030FF', secondary: '#8020C0', accent: '#FF80FF', glow: '#D060FF' }, // Purple
        { primary: '#FF8000', secondary: '#FFA030', accent: '#FFFF00', glow: '#FFB040' }  // Orange/Yellow
    ];
    
    const colors = colorSchemes[actualVariation];
    
    // Glow effect matching the primary color
    ctx.shadowBlur = 10;
    ctx.shadowColor = colors.primary;
    
    // Draw different alien shapes based on variation
    switch(actualVariation) {
        case 0: // Crab-like alien
            // Main body - upper dome
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.ellipse(x, y - height/6, width/2, height/3, 0, 0, Math.PI);
            ctx.fill();
            
            // Lower body
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.ellipse(x, y + height/6, width/2, height/3, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x - width/4, y - height/6, width/10, 0, Math.PI * 2);
            ctx.arc(x + width/4, y - height/6, width/10, 0, Math.PI * 2);
            ctx.fill();
            
            // Mandibles
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.moveTo(x - width/3, y);
            ctx.lineTo(x - width/2, y + height/3);
            ctx.lineTo(x - width/4, y + height/6);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x + width/3, y);
            ctx.lineTo(x + width/2, y + height/3);
            ctx.lineTo(x + width/4, y + height/6);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 1: // Octopus-like alien
            // Main body - head
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(x, y - height/6, width/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Lower body/tentacles
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI + Math.PI/12;
                const startX = x + Math.cos(angle) * width/4;
                const startY = y;
                const endX = x + Math.cos(angle) * width/2;
                const endY = y + height/3;
                const controlX = startX + Math.cos(angle) * width/6;
                const controlY = startY + height/5;
                
                ctx.fillStyle = colors.secondary;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                ctx.lineTo(endX - width/12, endY - height/12);
                ctx.quadraticCurveTo(controlX - width/24, controlY - height/24, startX - width/24, startY);
                ctx.closePath();
                ctx.fill();
            }
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - width/6, y - height/5, width/12, 0, Math.PI * 2);
            ctx.arc(x + width/6, y - height/5, width/12, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x - width/6, y - height/5, width/24, 0, Math.PI * 2);
            ctx.arc(x + width/6, y - height/5, width/24, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 2: // Insect-like alien
            // Body segments
            ctx.fillStyle = colors.primary;
            
            // Head
            ctx.beginPath();
            ctx.arc(x, y - height/4, width/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Thorax
            ctx.beginPath();
            ctx.ellipse(x, y, width/3, height/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Abdomen
            ctx.beginPath();
            ctx.ellipse(x, y + height/3, width/4, height/6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Antennae
            ctx.lineWidth = 2;
            ctx.strokeStyle = colors.primary;
            ctx.beginPath();
            ctx.moveTo(x - width/8, y - height/4);
            ctx.lineTo(x - width/3, y - height/2);
            ctx.moveTo(x + width/8, y - height/4);
            ctx.lineTo(x + width/3, y - height/2);
            ctx.stroke();
            
            // Eyes
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x - width/8, y - height/4, width/12, 0, Math.PI * 2);
            ctx.arc(x + width/8, y - height/4, width/12, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings
            ctx.fillStyle = colors.secondary;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(x - width/3, y, width/4, height/3, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + width/3, y, width/4, height/3, -Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
            
        case 3: // Jellyfish-like alien
            // Main dome body
            const domeGradient = ctx.createRadialGradient(
                x, y - height/6, 0,
                x, y - height/6, width/2
            );
            domeGradient.addColorStop(0, colors.accent);
            domeGradient.addColorStop(0.6, colors.primary);
            domeGradient.addColorStop(1, colors.secondary);
            
            ctx.fillStyle = domeGradient;
            ctx.beginPath();
            ctx.arc(x, y - height/6, width/2, 0, Math.PI, true);
            ctx.fill();
            
            // Tentacles
            ctx.fillStyle = colors.secondary;
            for (let i = 0; i < 7; i++) {
                const tentacleX = x - width/2 + i * (width/6);
                const waveOffset = Math.sin(Date.now() / 200 + i) * (width/10);
                
                ctx.beginPath();
                ctx.moveTo(tentacleX, y - height/6);
                ctx.quadraticCurveTo(
                    tentacleX + waveOffset, y + height/6,
                    tentacleX, y + height/2
                );
                ctx.lineTo(tentacleX + width/20, y + height/2);
                ctx.quadraticCurveTo(
                    tentacleX + width/20 + waveOffset, y + height/6,
                    tentacleX + width/20, y - height/6
                );
                ctx.closePath();
                ctx.fill();
            }
            
            // Glowing spots
            ctx.fillStyle = colors.accent;
            for (let i = 0; i < 3; i++) {
                const spotX = x - width/4 + i * (width/4);
                const spotY = y - height/4;
                const spotSize = (i % 2 === 0) ? width/12 : width/10;
                
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
            
        case 4: // Crystal-like alien
            // Main crystalline body
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.moveTo(x, y - height/2);
            ctx.lineTo(x + width/3, y - height/6);
            ctx.lineTo(x + width/2, y + height/4);
            ctx.lineTo(x, y + height/2);
            ctx.lineTo(x - width/2, y + height/4);
            ctx.lineTo(x - width/3, y - height/6);
            ctx.closePath();
            ctx.fill();
            
            // Inner crystal patterns
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - height/2);
            ctx.lineTo(x, y + height/2);
            ctx.moveTo(x - width/3, y - height/6);
            ctx.lineTo(x + width/3, y - height/6);
            ctx.moveTo(x - width/2, y + height/4);
            ctx.lineTo(x + width/2, y + height/4);
            ctx.stroke();
            
            // Glowing core
            const coreGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, width/5
            );
            coreGradient.addColorStop(0, '#FFFFFF');
            coreGradient.addColorStop(0.5, colors.accent);
            coreGradient.addColorStop(1, colors.primary);
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(x, y, width/5, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    
    ctx.restore();
};

// Dive Enemy Aliens - With variations
const drawDiveEnemy = (ctx, x, y, width, height, color, variation = 0, hitFlash = 0) => {
    ctx.save();
    
    // Hit flash effect
    if (hitFlash > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, width * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }
    
    // Get variation from 0-4 (5 variations)
    const actualVariation = variation % 5;
    
    // Different color schemes for dive enemies
    const colorSchemes = [
        { primary: '#00FF80', secondary: '#008040', accent: '#80FFFF' }, // Green/Cyan
        { primary: '#FFC000', secondary: '#FF8000', accent: '#FFFF80' }, // Gold/Yellow
        { primary: '#FF0080', secondary: '#C00060', accent: '#FFC0FF' }, // Pink/Magenta
        { primary: '#00C0FF', secondary: '#0080A0', accent: '#FFFFFF' }, // Sky Blue
        { primary: '#C0FF00', secondary: '#80C000', accent: '#FFFF60' }  // Lime Green
    ];
    
    const colors = colorSchemes[actualVariation];
    
    // Glow effect matching the primary color
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.primary;
    
    // Draw different dive enemy shapes based on variation
    switch(actualVariation) {
        case 0: // Dart-like shape
            // Main body
            const gradient = ctx.createLinearGradient(x, y - height/2, x, y + height/2);
            gradient.addColorStop(0, colors.primary);
            gradient.addColorStop(1, colors.secondary);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x, y - height/2);
            ctx.lineTo(x + width/3, y);
            ctx.lineTo(x, y + height/2);
            ctx.lineTo(x - width/3, y);
            ctx.closePath();
            ctx.fill();
            
            // Energy core
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x, y, width/5, 0, Math.PI * 2);
            ctx.fill();
            
            // Trailing energy
            const trailGradient = ctx.createLinearGradient(
                x, y - height/2,
                x, y + height/1.5
            );
            trailGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.8)`);
            trailGradient.addColorStop(1, `rgba(${hexToRgb(colors.primary)}, 0)`);
            
            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.moveTo(x, y + height/2);
            ctx.lineTo(x + width/6, y + height);
            ctx.lineTo(x - width/6, y + height);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 1: // Spinner shape
            // Create rotational effect
            const rotationAngle = Date.now() / 200; // Rotate over time
            ctx.translate(x, y);
            ctx.rotate(rotationAngle);
            
            // Main body - spinning disc
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.arc(0, 0, width/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Spikes
            ctx.fillStyle = colors.primary;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * width/2, Math.sin(angle) * width/2);
                ctx.lineTo(Math.cos(angle + 0.3) * width/3, Math.sin(angle + 0.3) * width/3);
                ctx.closePath();
                ctx.fill();
            }
            
            // Center core
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(0, 0, width/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset transformation
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            break;
            
        case 2: // Scout ship
            // Main body - elongated saucer
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.ellipse(x, y, width/2, height/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Cockpit dome
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(x, y, width/4, 0, Math.PI, true);
            ctx.fill();
            
            // Engine exhausts
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.ellipse(x - width/3, y, width/10, height/8, 0, 0, Math.PI * 2);
            ctx.ellipse(x + width/3, y, width/10, height/8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Engine glow effects
            const engineGlow = ctx.createRadialGradient(
                x - width/3, y, 0,
                x - width/3, y, width/4
            );
            engineGlow.addColorStop(0, `rgba(${hexToRgb(colors.accent)}, 0.8)`);
            engineGlow.addColorStop(1, `rgba(${hexToRgb(colors.accent)}, 0)`);

            ctx.fillStyle = engineGlow;
            ctx.beginPath();
            ctx.arc(x - width/3, y, width/4, 0, Math.PI * 2);
            ctx.arc(x + width/3, y, width/4, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 3: // Manta ray-like ship
            // Main body
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.moveTo(x, y - height/4);
            ctx.quadraticCurveTo(x + width/2, y - height/8, x + width/2, y + height/8);
            ctx.quadraticCurveTo(x + width/4, y + height/4, x, y + height/6);
            ctx.quadraticCurveTo(x - width/4, y + height/4, x - width/2, y + height/8);
            ctx.quadraticCurveTo(x - width/2, y - height/8, x, y - height/4);
            ctx.closePath();
            ctx.fill();
            
            // Wing patterns
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - height/6);
            ctx.lineTo(x, y + height/6);
            ctx.moveTo(x - width/4, y - height/8);
            ctx.quadraticCurveTo(x - width/6, y + height/8, x - width/3, y + height/6);
            ctx.moveTo(x + width/4, y - height/8);
            ctx.quadraticCurveTo(x + width/6, y + height/8, x + width/3, y + height/6);
            ctx.stroke();
            
            // Cockpit/eye
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x, y - height/8, width/8, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.moveTo(x - width/8, y + height/6);
            ctx.lineTo(x, y + height/2);
            ctx.lineTo(x + width/8, y + height/6);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 4: // Drone ship
            // Hexagonal body
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const xPoint = x + Math.cos(angle) * width/3;
                const yPoint = y + Math.sin(angle) * width/3;
                
                if (i === 0) ctx.moveTo(xPoint, yPoint);
                else ctx.lineTo(xPoint, yPoint);
            }
            ctx.closePath();
            ctx.fill();
            
            // Central ring
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(x, y, width/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x, y, width/8, 0, Math.PI * 2);
            ctx.fill();
            
            // Weapon pods
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const podX = x + Math.cos(angle) * width/2;
                const podY = y + Math.sin(angle) * width/2;
                
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(podX, podY, width/10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Connection beams
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const podX = x + Math.cos(angle) * width/2;
                const podY = y + Math.sin(angle) * width/2;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(podX, podY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            break;
    }
    
    ctx.restore();
};

// Boss Enemy Aliens - With variations
const drawBossEnemy = (ctx, x, y, width, height, color, variation = 0, hitFlash = 0) => {
    ctx.save();
    
    // Hit flash effect
    if (hitFlash > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, width * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }
    
    // Get variation from 0-4 (5 variations)
    const actualVariation = variation % 5;
    
    // Different color schemes for boss enemies
    const colorSchemes = [
        { primary: '#FF00FF', secondary: '#C000C0', accent: '#FF80FF' }, // Magenta
        { primary: '#FF0000', secondary: '#C00000', accent: '#FF8080' }, // Red
        { primary: '#00FFFF', secondary: '#00C0C0', accent: '#C0FFFF' }, // Cyan
        { primary: '#8000FF', secondary: '#6000C0', accent: '#C080FF' }, // Purple
        { primary: '#FF8000', secondary: '#C06000', accent: '#FFC080' }  // Orange
    ];
    
    const colors = colorSchemes[actualVariation];
    
    // Glow effect matching the primary color
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.primary;
    
    // Draw different boss shapes based on variation
    switch(actualVariation) {
        case 0: // Command ship
            // Main body
            const gradient = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
            gradient.addColorStop(0, colors.primary);
            gradient.addColorStop(0.5, colors.accent);
            gradient.addColorStop(1, colors.primary);
            
            ctx.fillStyle = gradient;
            
            // Draw ship body - hexagonal
            ctx.beginPath();
            ctx.moveTo(x - width/2, y);
            ctx.lineTo(x - width/3, y - height/3);
            ctx.lineTo(x + width/3, y - height/3);
            ctx.lineTo(x + width/2, y);
            ctx.lineTo(x + width/3, y + height/3);
            ctx.lineTo(x - width/3, y + height/3);
            ctx.closePath();
            ctx.fill();
            
            // Central core
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, width/5, 0, Math.PI * 2);
            ctx.fill();
            
            // Pulsing inner core
            const pulseTime = Date.now() % 1000 / 1000;
            const pulseSize = width/6 * (0.8 + 0.2 * Math.sin(pulseTime * Math.PI * 2));
            
            const innerGlow = ctx.createRadialGradient(
                x, y, 0,
                x, y, pulseSize
            );
            innerGlow.addColorStop(0, '#FFFFFF');
            innerGlow.addColorStop(0.6, colors.primary);
            innerGlow.addColorStop(1, 'rgba(255,0,255,0)');
            
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Weapon pods
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.rect(x - width/2 - width/10, y - height/8, width/5, height/4);
            ctx.rect(x + width/2 - width/10, y - height/8, width/5, height/4);
            ctx.fill();
            break;
            
        case 1: // Mothership
            // Main body - massive oval
            const bodyGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, width/2
            );
            bodyGradient.addColorStop(0, colors.accent);
            bodyGradient.addColorStop(0.7, colors.primary);
            bodyGradient.addColorStop(1, colors.secondary);
            
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, width/2, height/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Central ring structure
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.arc(x, y, width/3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x, y, width/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Energy beams - pulsing
            const beamPhase = Date.now() / 500;
            const beamOpacity = 0.5 + 0.5 * Math.sin(beamPhase);
            
            ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, ${beamOpacity})`;
            ctx.lineWidth = 3;
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + beamPhase / 5;
                const innerX = x + Math.cos(angle) * width/4;
                const innerY = y + Math.sin(angle) * width/4;
                const outerX = x + Math.cos(angle) * width/2;
                const outerY = y + Math.sin(angle) * height/3;
                
                ctx.beginPath();
                ctx.moveTo(innerX, innerY);
                ctx.lineTo(outerX, outerY);
                ctx.stroke();
            }
            
            // Central eye
            const eyeGlow = ctx.createRadialGradient(
                x, y, 0,
                x, y, width/10
            );
            eyeGlow.addColorStop(0, '#FFFFFF');
            eyeGlow.addColorStop(0.6, colors.primary);
            eyeGlow.addColorStop(1, colors.secondary);
            
            ctx.fillStyle = eyeGlow;
            ctx.beginPath();
            ctx.arc(x, y, width/10, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 2: // Battle Cruiser
            // Elongated battle cruiser shape
            ctx.fillStyle = colors.primary;
            
            // Main hull
            ctx.beginPath();
            ctx.moveTo(x - width/2, y);
            ctx.lineTo(x - width/3, y - height/4);
            ctx.lineTo(x + width/3, y - height/4);
            ctx.lineTo(x + width/2, y);
            ctx.lineTo(x + width/3, y + height/4);
            ctx.lineTo(x - width/3, y + height/4);
            ctx.closePath();
            ctx.fill();
            
            // Forward section
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.moveTo(x + width/3, y - height/6);
            ctx.lineTo(x + width/2 + width/10, y);
            ctx.lineTo(x + width/3, y + height/6);
            ctx.closePath();
            ctx.fill();
            
            // Engine section
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.moveTo(x - width/3, y - height/6);
            ctx.lineTo(x - width/2 - width/10, y);
            ctx.lineTo(x - width/3, y + height/6);
            ctx.closePath();
            ctx.fill();
            
            // Engine glow
            const engineGradient = ctx.createRadialGradient(
                x - width/2, y, 0,
                x - width/2, y, width/5
            );
            engineGradient.addColorStop(0, '#FFFFFF');
            engineGradient.addColorStop(0.3, colors.accent);
            engineGradient.addColorStop(1, `rgba(${hexToRgb(colors.primary)}, 0)`);

            ctx.fillStyle = engineGradient;
            ctx.beginPath();
            ctx.ellipse(x - width/2, y, width/10, height/10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Weapon arrays
            ctx.fillStyle = colors.secondary;
            for (let i = -2; i <= 2; i += 2) {
                const xPos = x + i * width/8;
                ctx.beginPath();
                ctx.rect(xPos - width/20, y - height/3, width/10, height/6);
                ctx.fill();
            }
            
            // Bridge section
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x, y, width/8, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 3: // Hive Queen
            // Complex organic shape
            ctx.fillStyle = colors.secondary;
            
            // Main body - oval with segments
            ctx.beginPath();
            ctx.ellipse(x, y, width/2, height/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Segmented plates
            ctx.fillStyle = colors.primary;
            for (let i = -2; i <= 2; i++) {
                const plateY = y + i * (height/8);
                const plateWidth = width/2 - Math.abs(i) * (width/10);
                
                ctx.beginPath();
                ctx.ellipse(x, plateY, plateWidth, height/12, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Tentacle/arm extensions
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const rootX = x + Math.cos(angle) * width/3;
                const rootY = y + Math.sin(angle) * height/5;
                const tipX = x + Math.cos(angle) * width/1.5;
                const tipY = y + Math.sin(angle) * height/1.5;
                
                // Curved tentacle
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = width/15;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(rootX, rootY);
                const cp1x = rootX + Math.cos(angle + Math.PI/6) * width/4;
                const cp1y = rootY + Math.sin(angle + Math.PI/6) * height/4;
                ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
                ctx.stroke();
                
                // Tip claw/glow
                ctx.fillStyle = colors.accent;
                ctx.beginPath();
                ctx.arc(tipX, tipY, width/15, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Central eye
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x, y, width/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupil
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            const pupilOffset = Math.sin(Date.now() / 500) * width/20;
            ctx.arc(x + pupilOffset, y, width/12, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - width/15, y - height/15, width/25, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 4: // Ancient Dreadnought
            // Imposing angular warship
            ctx.fillStyle = colors.secondary;
            
            // Main hull - triangle
            ctx.beginPath();
            ctx.moveTo(x, y - height/2);
            ctx.lineTo(x + width/2, y + height/3);
            ctx.lineTo(x - width/2, y + height/3);
            ctx.closePath();
            ctx.fill();
            
            // Command tower
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.moveTo(x, y - height/4);
            ctx.lineTo(x + width/6, y);
            ctx.lineTo(x, y + height/6);
            ctx.lineTo(x - width/6, y);
            ctx.closePath();
            ctx.fill();
            
            // Wing structures
            ctx.beginPath();
            ctx.moveTo(x + width/4, y);
            ctx.lineTo(x + width/2 + width/10, y);
            ctx.lineTo(x + width/3, y + height/3);
            ctx.moveTo(x - width/4, y);
            ctx.lineTo(x - width/2 - width/10, y);
            ctx.lineTo(x - width/3, y + height/3);
            ctx.fill();
            
            // Engine arrays
            ctx.fillStyle = colors.accent;
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue; // Skip middle
                const engineX = x + i * (width/6);
                const engineY = y + height/3;
                
                ctx.beginPath();
                ctx.rect(engineX - width/20, engineY - height/20, width/10, height/10);
                ctx.fill();
                
                // Engine glow
                const glowGradient = ctx.createRadialGradient(
                    engineX, engineY + height/10, 0,
                    engineX, engineY + height/10, width/8
                );
                glowGradient.addColorStop(0, colors.accent);
                glowGradient.addColorStop(1, `rgba(${hexToRgb(colors.accent)}, 0)`);

                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(engineX, engineY + height/10, width/8, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Energy weapon charging
            const chargePhase = Date.now() % 2000 / 2000; // Slow pulse
            if (chargePhase > 0.7) {
                const chargeSize = width/6 * ((chargePhase - 0.7) / 0.3);
                const chargeOpacity = (chargePhase - 0.7) / 0.3;
                
                ctx.fillStyle = `rgba(${hexToRgb(colors.primary)}, ${chargeOpacity})`;
                ctx.beginPath();
                ctx.arc(x, y - height/3, chargeSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Insignia/marking
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.moveTo(x, y - height/8);
            ctx.lineTo(x + width/12, y + height/12);
            ctx.lineTo(x - width/12, y + height/12);
            ctx.closePath();
            ctx.fill();
            break;
    }
    
    ctx.restore();
};

// Add the missing drawPlayerBullet and drawEnemyBullet functions
const drawPlayerBullet = (ctx, x, y, width, height, color) => {
    ctx.save();
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFF00';
    
    // Energy pulse effect
    const bulletGlow = ctx.createLinearGradient(x, y - height/2, x, y + height/2);
    bulletGlow.addColorStop(0, '#FFFFFF');
    bulletGlow.addColorStop(0.5, '#FFFF00');
    bulletGlow.addColorStop(1, '#FF8000');
    
    ctx.fillStyle = bulletGlow;
    
    // Draw the bullet shape
    ctx.beginPath();
    ctx.rect(x - width/2, y - height/2, width, height);
    ctx.fill();
    
    // Bright center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(x - width/4, y - height/2, width/2, height);
    ctx.fill();
    
    ctx.restore();
};

const drawEnemyBullet = (ctx, x, y, width, height, color, variation = 0, special = false) => {
    ctx.save();
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = special ? '#FF00FF' : '#FF0000';
    
    // Energy pulse effect
    const bulletColor = special ? '#FF00FF' : '#FF0000';
    const bulletGlow = ctx.createLinearGradient(x, y - height/2, x, y + height/2);
    bulletGlow.addColorStop(0, '#FFFFFF');
    bulletGlow.addColorStop(0.5, bulletColor);
    bulletGlow.addColorStop(1, '#800000');
    
    ctx.fillStyle = bulletGlow;
    
    // Draw the bullet shape
    ctx.beginPath();
    ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bright center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x, y, width/4, height/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
};

const drawExplosion = (ctx, x, y, radius, color, opacity) => {
    ctx.save();
    
    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFA000';
    ctx.globalAlpha = opacity;
    
    // Outer ring
    const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.2, '#FFFF00');
    gradient.addColorStop(0.4, '#FFA000');
    gradient.addColorStop(0.8, '#FF4000');
    gradient.addColorStop(1, 'rgba(255,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner bright spot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
};

// Helper function to convert hex to RGB for gradient alpha support
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Define sprites AFTER all drawing functions are defined
const sprites = {
    player: new Sprite({ 
        width: 30, 
        height: 30, 
        color: '#1E90FF', 
        drawFunction: drawPlayerShip 
    }),
    basicEnemy: new Sprite({ 
        width: 25, 
        height: 25, 
        color: '#FF0000', 
        drawFunction: drawBasicEnemy
    }),
    diveEnemy: new Sprite({ 
        width: 30, 
        height: 30, 
        color: '#00FF80', 
        drawFunction: drawDiveEnemy
    }),
    bossEnemy: new Sprite({ 
        width: 40, 
        height: 40, 
        color: '#FF00FF', 
        drawFunction: drawBossEnemy
    }),
    playerBullet: new Sprite({ 
        width: 5, 
        height: 15, 
        color: '#FFFF00', 
        drawFunction: drawPlayerBullet
    }),
    enemyBullet: new Sprite({ 
        width: 5, 
        height: 15, 
        color: '#FF6347', 
        drawFunction: drawEnemyBullet
    }),
    explosion: new Sprite({ 
        width: 30, 
        height: 30, 
        color: '#FFA500', 
        type: 'circle' 
    }),
};

// Add a global export of sprites to ensure it's available in other files
window.sprites = sprites;
