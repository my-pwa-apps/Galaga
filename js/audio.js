// Sound manager using Web Audio API with inline audio data

class AudioManager {
    constructor() {
        this.initialized = false;
        this.sounds = {};
        this.masterVolume = 0.7;
        this.muted = false;
        
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            this.initialized = true;
            console.log('Audio system initialized');
            
            // Load sounds using generated audio instead of fetching files
            this.loadSounds();
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }
    
    loadSounds() {
        // Generate sounds instead of loading them from files to avoid fetch errors
        this.createSound('playerShoot', 'short', { frequency: 880, duration: 0.1 });
        this.createSound('enemyShoot', 'short', { frequency: 220, duration: 0.2 });
        this.createSound('explosion', 'noise', { duration: 0.5 });
        this.createSound('powerUp', 'sweep', { startFreq: 220, endFreq: 880, duration: 0.3 });
        this.createSound('bulletHit', 'short', { frequency: 440, duration: 0.05 });
        this.createSound('levelUp', 'sweep', { startFreq: 440, endFreq: 1320, duration: 0.6 });
        this.createSound('gameOver', 'sweep', { startFreq: 880, endFreq: 110, duration: 1.0 });
        this.createSound('background', 'ambient', { duration: 5.0, isLoop: true });
    }
    
    createSound(name, type, options) {
        if (!this.initialized) return;
        
        const duration = options.duration || 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (type) {
            case 'short':
                this.generateTone(data, options.frequency || 440, duration, options.decay || 0.1);
                break;
            case 'noise':
                this.generateNoise(data, duration);
                break;
            case 'sweep':
                this.generateSweep(data, options.startFreq || 220, options.endFreq || 880, duration);
                break;
            case 'ambient':
                this.generateAmbient(data, duration);
                break;
            default:
                this.generateTone(data, 440, duration);
        }
        
        this.sounds[name] = {
            buffer: buffer,
            isLoop: options.isLoop || false
        };
        
        console.log(`Sound created: ${name}`);
    }
    
    generateTone(dataArray, frequency, duration, decay = 0.1) {
        const sampleRate = this.audioContext.sampleRate;
        for (let i = 0; i < dataArray.length; i++) {
            const t = i / sampleRate;
            const amplitude = Math.pow(1 - t / duration, decay * 10);
            dataArray[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.5;
        }
    }
    
    generateNoise(dataArray, duration) {
        for (let i = 0; i < dataArray.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const decay = Math.pow(1 - t / duration, 2);
            dataArray[i] = (Math.random() * 2 - 1) * decay * 0.5;
        }
    }
    
    generateSweep(dataArray, startFreq, endFreq, duration) {
        const sampleRate = this.audioContext.sampleRate;
        for (let i = 0; i < dataArray.length; i++) {
            const t = i / sampleRate;
            const freq = startFreq + (endFreq - startFreq) * (t / duration);
            const amplitude = Math.pow(1 - t / duration, 0.5);
            dataArray[i] = Math.sin(2 * Math.PI * freq * t) * amplitude * 0.5;
        }
    }
    
    generateAmbient(dataArray, duration) {
        const sampleRate = this.audioContext.sampleRate;
        for (let i = 0; i < dataArray.length; i++) {
            const t = i / sampleRate;
            const f1 = 100 + 50 * Math.sin(2 * Math.PI * 0.1 * t);
            const f2 = 200 + 80 * Math.sin(2 * Math.PI * 0.11 * t);
            dataArray[i] = (
                Math.sin(2 * Math.PI * f1 * t) * 0.3 + 
                Math.sin(2 * Math.PI * f2 * t) * 0.2
            ) * 0.5;
        }
    }
    
    play(name, volume = 1.0) {
        if (!this.initialized) return null;
        
        // Don't try to play sounds if audio is muted
        if (this.muted) return null;
        
        // Auto-resume audio context if it's suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('Could not resume audio context:', e));
        }
        
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return null;
        }
        
        try {
            // Create audio source
            const source = this.audioContext.createBufferSource();
            source.buffer = sound.buffer;
            source.loop = sound.isLoop;
            
            // Create gain node for this sound
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume * this.masterVolume;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Play the sound
            source.start();
            return source; // Return source to allow stopping loops
        } catch (e) {
            console.error('Error playing sound:', e);
            return null;
        }
    }
    
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        }
        return this.muted;
    }
    
    playBackgroundMusic() {
        // Stop any existing background music first
        if (this.backgroundSource) {
            try {
                this.backgroundSource.stop();
            } catch (e) {
                console.warn('Error stopping background music:', e);
            }
        }
        
        // Play background music with looping
        if (!this.initialized) return null;
        
        this.backgroundSource = this.play('background', 0.3);
        return this.backgroundSource;
    }
    
    stopBackgroundMusic() {
        if (this.backgroundSource) {
            try {
                this.backgroundSource.stop();
                this.backgroundSource = null;
            } catch (e) {
                console.warn('Error stopping background music:', e);
            }
        }
    }
    
    stopAll() {
        if (!this.initialized) return;
        
        // Disconnect and recreate master gain to stop all sounds
        this.masterGain.disconnect();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.audioContext.destination);
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();
