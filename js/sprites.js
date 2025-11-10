// ============================================
// ALIEN SPRITES SYSTEM
// All enemy alien drawing functions
// ============================================

const AlienSprites = {
    // Draw eerie skeletal skulker enemy - floating skull with glowing eyes
    drawSkulker(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const float = Math.sin(time * 3) * 2;
        const pulse = Math.sin(time * 8) * 0.1 + 0.9;
        const smokeDrift = Math.sin(time * 2) * 3;
        
        ctx.translate(0, float);
        
        // Wispy smoke trail
        for (let i = 0; i < 3; i++) {
            const smokeY = 8 + i * 4;
            const smokeAlpha = 0.15 - i * 0.04;
            const smokeX = smokeDrift * (i + 1) * 0.3;
            ctx.fillStyle = `rgba(80, 0, 0, ${smokeAlpha})`;
            ctx.beginPath();
            ctx.ellipse(smokeX, smokeY, 6 - i * 1.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ominous aura/glow
        ctx.shadowColor = attacking ? '#ff0000' : '#880000';
        ctx.shadowBlur = attacking ? 20 : 12;
        
        // Skull base - bone white with dark gradients
        const skullGradient = ctx.createRadialGradient(0, -3, 0, 0, -1, 10);
        skullGradient.addColorStop(0, '#dddddd');
        skullGradient.addColorStop(0.6, '#aaaaaa');
        skullGradient.addColorStop(1, '#666666');
        ctx.fillStyle = skullGradient;
        ctx.beginPath();
        ctx.ellipse(0, -2, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Jaw bone - slightly separated
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.ellipse(0, 6, 6, 3, 0, 0, Math.PI);
        ctx.fill();
        
        // Dark cracks in skull
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(-2, -4);
        ctx.moveTo(3, -7);
        ctx.lineTo(4, -2);
        ctx.stroke();
        
        // Eye sockets - deep black voids
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-3.5, -2, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(3.5, -2, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing red eyes - pulsing with malice
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(-3.5, -2, 1.5 * pulse, 0, Math.PI * 2);
        ctx.arc(3.5, -2, 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Nasal cavity
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.moveTo(-1, 1);
        ctx.lineTo(0, 3);
        ctx.lineTo(1, 1);
        ctx.closePath();
        ctx.fill();
        
        // Teeth
        ctx.fillStyle = '#cccccc';
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i * 2.5 - 1, 5, 1.5, 2);
        }
        
        // Enhanced attack glow
        if (attacking) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 25;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    // Draw butterfly enemy - menacing moth-like alien
    drawButterfly(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingFlap = Math.sin(time * 8) * 0.4;
        const pulse = Math.sin(time * 6) * 0.15 + 0.85;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 13, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings - left with darker, more ominous gradient
        ctx.save();
        const wingGradientL = ctx.createRadialGradient(-10, 0, 0, -10, 0, 10);
        wingGradientL.addColorStop(0, '#aa00ff');
        wingGradientL.addColorStop(0.5, '#880099');
        wingGradientL.addColorStop(1, '#440066');
        ctx.fillStyle = wingGradientL;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-10, 0, 8, 10, -0.5 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings - right
        const wingGradientR = ctx.createRadialGradient(10, 0, 0, 10, 0, 10);
        wingGradientR.addColorStop(0, '#aa00ff');
        wingGradientR.addColorStop(0.5, '#880099');
        wingGradientR.addColorStop(1, '#440066');
        ctx.fillStyle = wingGradientR;
        ctx.beginPath();
        ctx.ellipse(10, 0, 8, 10, 0.5 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Eye-like spots on wings (threatening pattern)
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-10, 0, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(10, 0, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark centers of eye spots
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(-10, 0, 1.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(10, 0, 1.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body with darker gradient
        const bodyGradient = ctx.createLinearGradient(0, -12, 0, 12);
        bodyGradient.addColorStop(0, '#660099');
        bodyGradient.addColorStop(1, '#330044');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body segments - armored look
        ctx.strokeStyle = '#220033';
        ctx.lineWidth = 1.5;
        for (let i = -8; i < 8; i += 4) {
            ctx.beginPath();
            ctx.moveTo(-5, i);
            ctx.lineTo(5, i);
            ctx.stroke();
        }
        
        // Sharp antennae - blade-like
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, -12);
        ctx.lineTo(-5, -17);
        ctx.moveTo(2, -12);
        ctx.lineTo(5, -17);
        ctx.stroke();
        
        // Sharp antennae tips - dangerous
        ctx.fillStyle = '#ff0066';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-5, -17);
        ctx.lineTo(-6, -19);
        ctx.lineTo(-4, -19);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -17);
        ctx.lineTo(4, -19);
        ctx.lineTo(6, -19);
        ctx.closePath();
        ctx.fill();
        
        // Large compound eyes - menacing
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(255, 0, 100, ${pulse})`;
        ctx.beginPath();
        ctx.ellipse(-3, -8, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(3, -8, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing pupils
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3, -8, 1, 0, Math.PI * 2);
        ctx.arc(3, -8, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw boss enemy (large, powerful)
    drawBoss(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const pulse = Math.sin(time * 4) * 0.1 + 1;
        const energyPulse = Math.sin(time * 6) * 0.5 + 0.5;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy aura
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(0, 255, 255, ${energyPulse * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 * pulse, 18 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Main body with gradient
        const bodyGradient = ctx.createRadialGradient(0, -3, 0, 0, 0, 14 * pulse);
        bodyGradient.addColorStop(0, '#66ffff');
        bodyGradient.addColorStop(0.6, '#00ddff');
        bodyGradient.addColorStop(1, '#0088cc');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark center with glow
        ctx.save();
        ctx.shadowColor = '#004466';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0088aa';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Armor plates
        ctx.strokeStyle = '#00aacc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0.5, Math.PI - 0.5);
        ctx.stroke();
        
        // Pincers with gradient
        const pincerGradient = ctx.createLinearGradient(-18, -8, -14, 0);
        pincerGradient.addColorStop(0, '#ff6666');
        pincerGradient.addColorStop(1, '#ff0000');
        ctx.fillStyle = pincerGradient;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-18, -8);
        ctx.lineTo(-16, -6);
        ctx.closePath();
        ctx.fill();
        
        const pincerGradientR = ctx.createLinearGradient(18, -8, 14, 0);
        pincerGradientR.addColorStop(0, '#ff6666');
        pincerGradientR.addColorStop(1, '#ff0000');
        ctx.fillStyle = pincerGradientR;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(18, -8);
        ctx.lineTo(16, -6);
        ctx.closePath();
        ctx.fill();
        
        // Eyes with glow
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils with shine
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.fillRect(-5, -3, 2, 2);
        ctx.fillRect(3, -3, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, -3, 1, 1);
        ctx.fillRect(3, -3, 1, 1);
        
        ctx.restore();
    },
    
    // Draw scorpion enemy (aggressive)
    drawHunter(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const pulse = Math.sin(time * 5) * 0.15 + 0.85;
        const scanAngle = Math.sin(time * 3) * 0.3;
        
        // Sleek metallic body - angular and mechanical
        const bodyGradient = ctx.createLinearGradient(0, -10, 0, 10);
        bodyGradient.addColorStop(0, '#33eeff');
        bodyGradient.addColorStop(0.5, '#00aacc');
        bodyGradient.addColorStop(1, '#006688');
        ctx.fillStyle = bodyGradient;
        
        // Main chassis - angular shape
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-8, 6);
        ctx.lineTo(0, 10);
        ctx.lineTo(8, 6);
        ctx.lineTo(8, -4);
        ctx.closePath();
        ctx.fill();
        
        // Metallic highlights
        ctx.strokeStyle = '#66ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-6, 4);
        ctx.moveTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.stroke();
        
        // Weapon pods - no tail
        ctx.fillStyle = '#004466';
        ctx.beginPath();
        ctx.rect(-10, 0, 3, 6);
        ctx.rect(7, 0, 3, 6);
        ctx.fill();
        
        // Glowing weapon tips
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 8 * pulse;
        ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
        ctx.fillRect(-10, 6, 3, 2);
        ctx.fillRect(7, 6, 3, 2);
        ctx.shadowBlur = 0;
        
        // Scanning eye - single glowing sensor
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 * pulse;
        
        // Eye housing
        ctx.fillStyle = '#001122';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing cyan eye with scan line
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, -2, 3 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Scanning beam when attacking
        if (attacking) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(scanAngle * 20, 15);
            ctx.stroke();
        }
        
        // Tech details - vents
        ctx.fillStyle = '#003344';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-2 + i * 2, 2, 1, 4);
        }
        
        // Energy core glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw moth enemy (erratic movement)
    drawParasite(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const writhe = Math.sin(time * 6) * 1.5;
        const pulse = Math.sin(time * 4) * 0.15 + 0.85;
        const ooze = Math.sin(time * 3);
        
        // Disgusting organic body - pulsating blob
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12 * pulse);
        bodyGradient.addColorStop(0, '#88ff44');
        bodyGradient.addColorStop(0.5, '#66cc22');
        bodyGradient.addColorStop(1, '#334411');
        ctx.fillStyle = bodyGradient;
        ctx.shadowColor = '#66ff33';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Visible pulsing veins
        ctx.strokeStyle = 'rgba(100, 200, 50, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(-4, -2, -6, 4);
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(4, -2, 6, 4);
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        
        // Multiple writhing tentacles
        ctx.shadowBlur = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const tentacleWave = Math.sin(time * 5 + i) * 8;
            const baseX = Math.cos(angle) * 7;
            const baseY = Math.sin(angle) * 7;
            
            ctx.strokeStyle = '#55aa22';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                baseX * 1.5 + tentacleWave, 
                baseY * 1.5 + writhe,
                baseX * 2, 
                baseY * 2
            );
            ctx.stroke();
            
            // Tentacle tip
            ctx.fillStyle = '#88ff44';
            ctx.beginPath();
            ctx.arc(baseX * 2, baseY * 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ooze drips
        if (ooze > 0) {
            const dripY = 9 + ooze * 4;
            ctx.fillStyle = `rgba(102, 255, 51, ${0.5 - ooze * 0.25})`;
            ctx.beginPath();
            ctx.ellipse(writhe * 0.3, dripY, 2, 3 + ooze, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central eye - disturbing and unblinking
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(0, -2, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Slit pupil
        ctx.fillStyle = '#000000';
        ctx.fillRect(-0.5, -5, 1, 6);
        
        // Attack mode - inject mode activated
        if (attacking) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    // Draw wraith enemy - ethereal ghostly entity with flowing form
    drawWraith(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const phase = Math.sin(time * 2) * 0.2 + 0.7; // Fade in/out
        const drift = Math.sin(time * 3) * 2;
        const tendrilWave = time * 4;
        
        // Eerie glow
        ctx.shadowColor = attacking ? '#ff00ff' : '#9966ff';
        ctx.shadowBlur = 15;
        
        // Ghostly flowing form - translucent body
        const wraitheGradient = ctx.createRadialGradient(0, -5, 0, 0, 0, 14);
        wraitheGradient.addColorStop(0, `rgba(180, 150, 255, ${phase * 0.8})`);
        wraitheGradient.addColorStop(0.6, `rgba(120, 80, 200, ${phase * 0.5})`);
        wraitheGradient.addColorStop(1, `rgba(60, 40, 120, 0)`);
        ctx.fillStyle = wraitheGradient;
        
        // Main body - flowing ethereal shape
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(-8, -8, -7, 0);
        ctx.quadraticCurveTo(-6, 6, -4, 10);
        ctx.lineTo(4, 10);
        ctx.quadraticCurveTo(6, 6, 7, 0);
        ctx.quadraticCurveTo(8, -8, 0, -12);
        ctx.fill();
        
        // Ghostly tendrils flowing beneath
        for (let i = 0; i < 5; i++) {
            const xOffset = (i - 2) * 3;
            const tendrilLength = 8 + Math.sin(tendrilWave + i) * 4;
            const tendrilDrift = Math.sin(tendrilWave + i * 0.5) * 3;
            const alpha = phase * 0.6;
            
            ctx.strokeStyle = `rgba(153, 102, 255, ${alpha})`;
            ctx.lineWidth = 2 - i * 0.2;
            ctx.beginPath();
            ctx.moveTo(xOffset, 10);
            ctx.quadraticCurveTo(
                xOffset + tendrilDrift, 
                10 + tendrilLength * 0.5,
                xOffset + tendrilDrift * 1.5, 
                10 + tendrilLength
            );
            ctx.stroke();
            
            // Wispy ends
            ctx.fillStyle = `rgba(180, 150, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(xOffset + tendrilDrift * 1.5, 10 + tendrilLength, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Hollow eyes - voids in reality
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(0, 0, 0, ${phase * 0.9})`;
        ctx.beginPath();
        ctx.ellipse(-3, -4, 2, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(3, -4, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ethereal glow in eyes
        ctx.fillStyle = `rgba(255, 100, 255, ${phase * 0.7})`;
        ctx.beginPath();
        ctx.arc(-3, -4, 1, 0, Math.PI * 2);
        ctx.arc(3, -4, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Haunting mouth - dark void
        ctx.fillStyle = `rgba(0, 0, 0, ${phase * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(0, 1, 2, 3, 0, 0, Math.PI);
        ctx.fill();
        
        // Enhanced spectral aura when attacking
        if (attacking) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${phase * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    // Draw wasp enemy (aggressive, shoots often)
    drawWasp(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const wingFlap = Math.sin(time * 18) * 0.4;
        const abdomenPulse = attacking ? Math.sin(time * 20) * 0.2 : 0;
        const wingBlur = Math.abs(Math.sin(time * 18)) * 3;
        
        // Transparent wings (behind body) with motion blur
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.abs(Math.sin(time * 18)) * 0.1;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = wingBlur;
        
        // Left wing pair
        ctx.fillStyle = 'rgba(200, 220, 255, 0.25)';
        ctx.strokeStyle = 'rgba(150, 170, 200, 0.4)';
        ctx.lineWidth = 0.5;
        // Hindwing
        ctx.beginPath();
        ctx.ellipse(-9, 2, 6, 9, -0.5 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Forewing
        ctx.beginPath();
        ctx.ellipse(-8, -3, 7, 12, -0.4 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right wing pair
        // Hindwing
        ctx.beginPath();
        ctx.ellipse(9, 2, 6, 9, 0.5 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Forewing
        ctx.beginPath();
        ctx.ellipse(8, -3, 7, 12, 0.4 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        // Head (menacing, angular)
        const headGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 5);
        headGradient.addColorStop(0, '#1a1a00');
        headGradient.addColorStop(1, '#000000');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Menacing compound eyes (large, red, glowing)
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = attacking ? 8 : 4;
        ctx.fillStyle = attacking ? '#ff3300' : '#cc0000';
        ctx.beginPath();
        ctx.ellipse(-3, -9, 2.5, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, -9, 2.5, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlights
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(-3, -10, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -10, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Mandibles (pincer-like)
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(-4, -3);
        ctx.moveTo(2, -5);
        ctx.lineTo(4, -3);
        ctx.stroke();
        
        // Thorax (segmented, armored look)
        const thoraxGradient = ctx.createLinearGradient(0, -4, 0, 4);
        thoraxGradient.addColorStop(0, '#ffcc00');
        thoraxGradient.addColorStop(0.5, '#ffaa00');
        thoraxGradient.addColorStop(1, '#ff8800');
        ctx.fillStyle = thoraxGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Thorax segments
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -2);
        ctx.lineTo(5, -2);
        ctx.moveTo(-5, 2);
        ctx.lineTo(5, 2);
        ctx.stroke();
        
        // Abdomen (striped, pulsing when attacking)
        const abdomenGradient = ctx.createLinearGradient(0, 5, 0, 20);
        abdomenGradient.addColorStop(0, '#ffcc00');
        abdomenGradient.addColorStop(1, '#ff8800');
        ctx.fillStyle = abdomenGradient;
        ctx.beginPath();
        ctx.ellipse(0, 11 + abdomenPulse, 4.5, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bold black stripes on abdomen
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 4; i++) {
            const stripeY = 6 + i * 3.5;
            ctx.beginPath();
            ctx.ellipse(0, stripeY, 4.5, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Legs (six segmented legs)
        ctx.strokeStyle = '#1a1a00';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (let side = -1; side <= 1; side += 2) {
            // Front leg
            ctx.beginPath();
            ctx.moveTo(side * 4, -2);
            ctx.lineTo(side * 7, 0);
            ctx.lineTo(side * 9, 3);
            ctx.stroke();
            // Middle leg
            ctx.beginPath();
            ctx.moveTo(side * 5, 1);
            ctx.lineTo(side * 8, 3);
            ctx.lineTo(side * 10, 5);
            ctx.stroke();
            // Back leg
            ctx.beginPath();
            ctx.moveTo(side * 4, 4);
            ctx.lineTo(side * 7, 6);
            ctx.lineTo(side * 9, 8);
            ctx.stroke();
        }
        
        // Menacing stinger (larger, more threatening)
        ctx.shadowColor = attacking ? '#ff0000' : '#000000';
        ctx.shadowBlur = attacking ? 10 : 2;
        const stingerGradient = ctx.createLinearGradient(0, 18, 0, 25);
        stingerGradient.addColorStop(0, attacking ? '#ff3300' : '#2a2a2a');
        stingerGradient.addColorStop(1, attacking ? '#990000' : '#000000');
        ctx.fillStyle = stingerGradient;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(-2.5, 25);
        ctx.lineTo(0, 26);
        ctx.lineTo(2.5, 25);
        ctx.closePath();
        ctx.fill();
        
        // Poison drip when attacking
        if (attacking) {
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(0, 26, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
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
    
    // Draw octopus enemy (tentacles wave like crazy!)
    drawOctopus(ctx, x, y, time, scale = 1, attacking = false) {
        ctx.save();
        ctx.translate(x, y);
        
        // Rotate body when diving/attacking
        if (attacking) {
            ctx.rotate(Math.PI); // Point head down when diving
        }
        
        ctx.scale(scale, scale);
        
        const pulse = 0.9 + Math.sin(time * 5) * 0.1;
        const attackIntensity = attacking ? 1.5 : 1;
        
        // Shadow (only when not attacking)
        if (!attacking) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 15, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw 8 tentacles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            
            // When attacking, tentacles stream behind
            const tentacleOffset = attacking ? -Math.PI / 2 : 0; // Shift tentacles up/behind when diving
            const adjustedAngle = angle + tentacleOffset;
            const tentacleLength = attacking ? 25 : 18; // Longer when streaming
            const tentacleWave = attacking ? 
                Math.sin(time * 12 + i) * 5 : // Less wave when diving
                Math.sin(time * 8 + i) * 12; // More wave when idle
            const tentacleWave2 = attacking ?
                Math.cos(time * 10 + i * 0.5) * 3 :
                Math.cos(time * 6 + i * 0.5) * 8;
            
            ctx.save();
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            // Gradient for tentacle
            const tentacleGradient = ctx.createLinearGradient(0, 0, 0, tentacleLength);
            tentacleGradient.addColorStop(0, '#ff6699');
            tentacleGradient.addColorStop(1, '#cc3366');
            ctx.strokeStyle = tentacleGradient;
            
            // Draw wavy tentacle with multiple segments
            ctx.beginPath();
            const startX = Math.cos(adjustedAngle) * 8;
            const startY = Math.sin(adjustedAngle) * 8;
            ctx.moveTo(startX, startY);
            
            // Bezier curve for smooth tentacle
            const midX = Math.cos(adjustedAngle) * (12 + tentacleWave);
            const midY = Math.sin(adjustedAngle) * (12 + tentacleWave);
            const endX = Math.cos(adjustedAngle) * (tentacleLength + tentacleWave2);
            const endY = Math.sin(adjustedAngle) * (tentacleLength + tentacleWave2);
            
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();
            
            // Suckers on tentacle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let s = 0; s < 3; s++) {
                const t = (s + 1) / 4;
                const suckX = startX + (endX - startX) * t;
                const suckY = startY + (endY - startY) * t;
                ctx.beginPath();
                ctx.arc(suckX, suckY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Body/head with gradient
        const bodyGradient = ctx.createRadialGradient(0, -2, 0, 0, 0, 12);
        bodyGradient.addColorStop(0, '#ff99bb');
        bodyGradient.addColorStop(0.5, '#ff6699');
        bodyGradient.addColorStop(1, '#ff3377');
        ctx.fillStyle = bodyGradient;
        ctx.save();
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Spots on body
        ctx.fillStyle = '#ffaacc';
        ctx.beginPath();
        ctx.arc(-4, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Large expressive eyes
        ctx.save();
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Pupils (look around when attacking)
        const pupilX = attacking ? Math.sin(time * 4) * 1.5 : 0;
        const pupilY = attacking ? Math.cos(time * 3) * 1 : 0;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-4 + pupilX, -2 + pupilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4 + pupilX, -2 + pupilY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5 + pupilX, -3 + pupilY, 1, 1);
        ctx.fillRect(3 + pupilX, -3 + pupilY, 1, 1);
        
        // Menacing beak/mouth - always aggressive
        ctx.strokeStyle = attacking ? '#ff0000' : '#cc0044';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Downward frown - always angry
        ctx.arc(0, 4, 3, Math.PI, 0);
        ctx.stroke();
        
        // Sharp beak point
        ctx.fillStyle = '#990022';
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(0, 5);
        ctx.lineTo(2, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw enemy by type
    draw(ctx, type, x, y, time, scale = 1, attacking = false) {
        switch (type) {
            case 'skulker':
                this.drawSkulker(ctx, x, y, time, scale, attacking);
                break;
            case 'butterfly':
                this.drawButterfly(ctx, x, y, time, scale, attacking);
                break;
            case 'boss':
                this.drawBoss(ctx, x, y, time, scale, attacking);
                break;
            case 'parasite':
                this.drawParasite(ctx, x, y, time, scale, attacking);
                break;
            case 'wraith':
                this.drawWraith(ctx, x, y, time, scale, attacking);
                break;
            case 'wasp':
                this.drawWasp(ctx, x, y, time, scale, attacking);
                break;
            case 'beetle':
                this.drawBeetle(ctx, x, y, time, scale, attacking);
                break;
            case 'octopus':
                this.drawOctopus(ctx, x, y, time, scale, attacking);
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
