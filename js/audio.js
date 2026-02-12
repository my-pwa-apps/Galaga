// ============================================
// AUDIO ENGINE (Web Audio API)
// All sounds generated from code
// ============================================

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
            
            // Audio engine ready
        } catch (e) {
            console.warn('⚠️ Web Audio API not supported:', e);
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
    
    // Shield hit sound
    shieldHit() {
        if (!this.enabled || !this.context) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.08);
        
        gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
}
