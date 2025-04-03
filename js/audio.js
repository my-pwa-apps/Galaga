// Sound manager using Web Audio API with enhanced sound generation

class AudioManager {
    constructor() {
        this.initialized = false;
        this.sounds = {};
        this.masterVolume = 0.7;
        this.muted = false;
        this.backgroundMusicNodes = [];
        this.backgroundSequencer = null;
        
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create effects chain
            this.createEffectsChain();
            
            this.initialized = true;
            console.log('Enhanced audio system initialized');
            
            // Load enhanced sounds
            this.loadSounds();
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }
    
    createEffectsChain() {
        // Create a compressor for better sound dynamics
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        this.compressor.connect(this.masterGain);
        
        // Create a reverb effect for spatial depth
        this.createReverb(2, 0.2).then(reverb => {
            this.reverb = reverb;
            this.reverb.connect(this.compressor);
        });
    }
    
    async createReverb(duration = 2, decay = 0.5) {
        // Create impulse response for reverb
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = i / length;
            // Create decay curve with random values for natural sound
            const value = (1 - n) * Math.pow(1 - n, decay * 10) * (Math.random() * 2 - 1);
            impulseL[i] = value;
            impulseR[i] = value * (Math.random() * 0.5 + 0.5); // Slight stereo variation
        }
        
        const convolver = this.audioContext.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }
    
    loadSounds() {
        // Enhanced sound generation for better game feel
        this.createSound('playerShoot', 'laser', { 
            frequency: 880, 
            duration: 0.15,
            attack: 0.01,
            decay: 0.05,
            sweep: true
        });
        
        this.createSound('enemyShoot', 'laser', { 
            frequency: 330, 
            duration: 0.2,
            attack: 0.01, 
            decay: 0.1,
            sweep: true,
            sweepRange: -100
        });
        
        this.createSound('explosion', 'complexNoise', { 
            duration: 0.6,
            lowFreq: 80,
            highFreq: 1000
        });
        
        this.createSound('powerUp', 'melodicSweep', { 
            startFreq: 220, 
            endFreq: 880, 
            duration: 0.4,
            harmonics: [1, 1.5, 2]
        });
        
        this.createSound('bulletHit', 'impact', { 
            frequency: 440, 
            duration: 0.1
        });
        
        this.createSound('levelUp', 'fanfare', { 
            baseFreq: 440, 
            duration: 0.8
        });
        
        this.createSound('gameOver', 'dramaticSweep', { 
            startFreq: 880, 
            endFreq: 110, 
            duration: 1.2
        });
        
        // Add hyperspeed sound for level transitions
        this.createSound('hyperspeed', 'hyperspeed', { 
            duration: 2.0
        });
    }
    
    createSound(name, type, options) {
        if (!this.initialized) return;
        
        const duration = options.duration || 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate); // Stereo sound
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);
        
        switch (type) {
            case 'laser':
                this.generateLaserSound(dataL, dataR, options);
                break;
            case 'complexNoise':
                this.generateComplexNoise(dataL, dataR, options);
                break;
            case 'melodicSweep':
                this.generateMelodicSweep(dataL, dataR, options);
                break;
            case 'impact':
                this.generateImpact(dataL, dataR, options);
                break;
            case 'fanfare':
                this.generateFanfare(dataL, dataR, options);
                break;
            case 'dramaticSweep':
                this.generateDramaticSweep(dataL, dataR, options);
                break;
            case 'hyperspeed':
                this.generateHyperspeedSound(dataL, dataR, options);
                break;
            default:
                this.generateTone(dataL, dataR, 440, duration);
        }
        
        this.sounds[name] = {
            buffer: buffer,
            isLoop: options.isLoop || false,
            useReverb: options.useReverb || false
        };
        
        console.log(`Enhanced sound created: ${name}`);
    }
    
    generateLaserSound(dataL, dataR, options) {
        const { frequency, duration, attack = 0.01, decay = 0.1, sweep = false, sweepRange = 200 } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            
            // Envelope shaping
            let amplitude;
            if (t < attack) {
                amplitude = t / attack; // Attack phase
            } else {
                amplitude = Math.pow(1 - ((t - attack) / (duration - attack)), decay * 10); // Decay phase
            }
            
            // Frequency modulation for laser effect
            let freq = frequency;
            if (sweep) {
                freq += sweepRange * (1 - t / duration);
            }
            
            // Add slight detune between channels for stereo effect
            const valueL = Math.sin(2 * Math.PI * freq * t) * amplitude * 0.5;
            const valueR = Math.sin(2 * Math.PI * (freq + 2) * t) * amplitude * 0.5;
            
            // Add harmonics for richer sound
            const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * amplitude * 0.15;
            
            dataL[i] = valueL + harmonic;
            dataR[i] = valueR + harmonic;
        }
    }
    
    generateComplexNoise(dataL, dataR, options) {
        const { duration, lowFreq = 100, highFreq = 1000 } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        // Create multiple noise bands for a rich explosion sound
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            const decayFactor = Math.pow(1 - t / duration, 2);
            
            // Low frequency rumble
            const lowFreqNoise = (Math.random() * 2 - 1) * 0.5 * decayFactor;
            
            // Mid-frequency crackle
            const midDecay = Math.pow(1 - t / duration, 4);
            const midFreqNoise = (Math.random() * 2 - 1) * 0.3 * midDecay;
            
            // High frequency sizzle with faster decay
            const highDecay = Math.pow(1 - t / (duration * 0.6), 6);
            const highFreqNoise = (Math.random() * 2 - 1) * 0.2 * (t < duration * 0.6 ? highDecay : 0);
            
            // Combine all noise bands
            dataL[i] = lowFreqNoise + midFreqNoise + highFreqNoise;
            dataR[i] = lowFreqNoise + (Math.random() * 2 - 1) * 0.3 * midDecay + highFreqNoise;
        }
    }
    
    generateMelodicSweep(dataL, dataR, options) {
        const { startFreq, endFreq, duration, harmonics = [1] } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            const normalizedTime = t / duration;
            
            // Envelope shaping - attack and decay
            let amplitude;
            if (normalizedTime < 0.1) {
                amplitude = normalizedTime / 0.1; // Fast attack
            } else {
                amplitude = Math.pow(1 - ((normalizedTime - 0.1) / 0.9), 0.5); // Gentle decay
            }
            
            // Frequency sweep calculation
            const freq = startFreq + (endFreq - startFreq) * Math.pow(normalizedTime, 0.7);
            
            // Base tone
            let valueL = 0;
            let valueR = 0;
            
            // Add harmonics for rich tone
            harmonics.forEach((harmonic, index) => {
                const phase = index % 2 ? 0 : Math.PI / 4; // Alternate phase for richer sound
                valueL += Math.sin(2 * Math.PI * freq * harmonic * t + phase) * (0.6 / (index + 1));
                valueR += Math.sin(2 * Math.PI * freq * harmonic * t) * (0.6 / (index + 1));
            });
            
            dataL[i] = valueL * amplitude * 0.5;
            dataR[i] = valueR * amplitude * 0.5;
        }
    }
    
    generateImpact(dataL, dataR, options) {
        const { frequency, duration } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            
            // Very fast attack, rapid decay
            const amplitude = t < 0.01 ? t / 0.01 : Math.pow(1 - (t - 0.01) / (duration - 0.01), 8);
            
            // Add slight pitch drop for impact feel
            const freqMod = 1 - Math.min(0.2, 0.5 * t / duration);
            
            // Include noise burst at the beginning
            const noiseBurst = t < 0.03 ? (Math.random() * 2 - 1) * (1 - t / 0.03) * 0.4 : 0;
            
            const toneL = Math.sin(2 * Math.PI * frequency * freqMod * t) * amplitude * 0.5;
            const toneR = Math.sin(2 * Math.PI * frequency * freqMod * t + 0.1) * amplitude * 0.5;
            
            dataL[i] = toneL + noiseBurst;
            dataR[i] = toneR + noiseBurst;
        }
    }
    
    generateFanfare(dataL, dataR, options) {
        const { baseFreq, duration } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        // Create a short melodic sequence for level up
        const notes = [1, 1.25, 1.5, 2]; // Musical intervals in the fanfare
        const noteDuration = duration / notes.length;
        
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.min(notes.length - 1, Math.floor(t / noteDuration));
            const noteT = t - (noteIndex * noteDuration); // Time within the current note
            
            // Note envelope
            const noteAmplitude = noteT < 0.02 ? noteT / 0.02 : 
                                Math.pow(1 - (noteT - 0.02) / (noteDuration - 0.02), 1);
            
            const freq = baseFreq * notes[noteIndex];
            
            // Create rich fanfare with multiple harmonics
            let valueL = 0;
            let valueR = 0;
            
            // Fundamental
            valueL += Math.sin(2 * Math.PI * freq * t) * 0.4;
            valueR += Math.sin(2 * Math.PI * freq * t + 0.1) * 0.4;
            
            // First harmonic (octave)
            valueL += Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
            valueR += Math.sin(2 * Math.PI * freq * 2 * t + 0.05) * 0.2;
            
            // Fifth
            valueL += Math.sin(2 * Math.PI * freq * 1.5 * t + 0.2) * 0.15;
            valueR += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15;
            
            dataL[i] = valueL * noteAmplitude * 0.5;
            dataR[i] = valueR * noteAmplitude * 0.5;
        }
    }
    
    generateDramaticSweep(dataL, dataR, options) {
        const { startFreq, endFreq, duration } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            const normalizedTime = t / duration;
            
            // Dramatic amplitude envelope with sustain
            let amplitude;
            if (normalizedTime < 0.1) { // Attack
                amplitude = 0.8 * (normalizedTime / 0.1);
            } else if (normalizedTime < 0.7) { // Sustain
                amplitude = 0.8;
            } else { // Release
                amplitude = 0.8 * (1 - (normalizedTime - 0.7) / 0.3);
            }
            
            // Non-linear frequency sweep for dramatic effect
            const expFactor = Math.pow(normalizedTime, 1.5); // Exponential curve
            const freq = startFreq + (endFreq - startFreq) * expFactor;
            
            // Add vibrato for tension
            const vibratoDepth = 20;
            const vibratoRate = 7;
            const vibrato = Math.sin(2 * Math.PI * vibratoRate * t) * vibratoDepth * normalizedTime;
            
            // Generate rich tone with multiple components
            let valueL = Math.sin(2 * Math.PI * (freq + vibrato) * t) * 0.4;
            let valueR = Math.sin(2 * Math.PI * (freq + vibrato) * t + 0.2) * 0.4;
            
            // Add lower octave
            valueL += Math.sin(2 * Math.PI * (freq/2) * t) * 0.2;
            valueR += Math.sin(2 * Math.PI * (freq/2) * t + 0.1) * 0.2;
            
            // Add slight dissonance for tension
            if (normalizedTime > 0.4) {
                valueL += Math.sin(2 * Math.PI * (freq * 1.08) * t) * 0.15 * (normalizedTime - 0.4) / 0.6;
                valueR += Math.sin(2 * Math.PI * (freq * 1.08) * t + 0.3) * 0.15 * (normalizedTime - 0.4) / 0.6;
            }
            
            dataL[i] = valueL * amplitude * 0.5;
            dataR[i] = valueR * amplitude * 0.5;
        }
    }
    
    generateHyperspeedSound(dataL, dataR, options) {
        const { duration = 2.0 } = options;
        const sampleRate = this.audioContext.sampleRate;
        
        // Create a futuristic "warp" sound with multiple layers
        for (let i = 0; i < dataL.length; i++) {
            const t = i / sampleRate;
            const normalizedTime = t / duration;
            
            // Base warp sound - increasing pitch with wobbly modulation
            const baseFreq = 150 + normalizedTime * 300;
            const wobbleRate = 7 + normalizedTime * 20;
            const wobbleDepth = 30 + normalizedTime * 100;
            
            // Amplitude envelope with gradual build-up
            let amplitude;
            if (normalizedTime < 0.2) {
                // Initial build-up
                amplitude = normalizedTime * 5; // Fast ramp up
            } else if (normalizedTime > 0.85) {
                // Tail off
                amplitude = (1.0 - normalizedTime) * 6.67; // Fast tail off
            } else {
                // Sustain with slight pulsing
                amplitude = 1.0 + Math.sin(normalizedTime * 50) * 0.1;
            }
            
            // Create wobble effect for main engine sound
            const wobble = Math.sin(wobbleRate * t * Math.PI * 2) * wobbleDepth;
            
            // Main engine tone with wobble
            let valueL = Math.sin(2 * Math.PI * (baseFreq + wobble) * t) * 0.35;
            let valueR = Math.sin(2 * Math.PI * (baseFreq + wobble + 2) * t + 0.2) * 0.35;
            
            // Add higher frequency "whoosh" layer
            const whooshFreq = 800 + Math.sin(t * 12) * 300 + normalizedTime * 1000;
            valueL += Math.sin(2 * Math.PI * whooshFreq * t) * 0.15 * normalizedTime;
            valueR += Math.sin(2 * Math.PI * whooshFreq * t + 0.3) * 0.15 * normalizedTime;
            
            // Add rumble at start
            if (normalizedTime < 0.4) {
                const rumbleAmp = (0.4 - normalizedTime) * 2.5;
                valueL += (Math.random() * 2 - 1) * 0.3 * rumbleAmp;
                valueR += (Math.random() * 2 - 1) * 0.3 * rumbleAmp;
            }
            
            // Add high-frequency harmonic sweeping layer
            if (normalizedTime > 0.2) {
                const sweepFreq = 1200 + (normalizedTime - 0.2) * 8000;
                const sweepAmp = Math.min(0.25, (normalizedTime - 0.2) / 2);
                valueL += Math.sin(2 * Math.PI * sweepFreq * t) * sweepAmp;
                valueR += Math.sin(2 * Math.PI * sweepFreq * t + 0.5) * sweepAmp;
            }
            
            // Final amplitude adjustment
            dataL[i] = valueL * amplitude * 0.5;
            dataR[i] = valueR * amplitude * 0.5;
        }
    }
    
    // Background music generator with soft melody that supports the action
    createBackgroundMusic() {
        if (!this.initialized) return;
        
        // Stop any existing background music
        this.stopBackgroundMusic();
        
        // Create nodes for background music
        const baseGain = this.audioContext.createGain();
        baseGain.gain.value = 0.2; // Low volume to stay in background
        
        // Connect to reverb for spacious feel
        const musicDestination = this.reverb ? this.reverb : this.compressor;
        baseGain.connect(musicDestination);
        
        // Store reference for later cleanup
        this.backgroundMusicNodes.push(baseGain);
        
        // Define musical parameters
        const tempo = 100; // BPM
        const beatLength = 60 / tempo;
        
        // Define melody in C minor pentatonic
        const melodyNotes = [
            { note: 'C4', duration: 2 },
            { note: 'Eb4', duration: 2 },
            { note: 'G4', duration: 1 },
            { note: 'Bb4', duration: 1 },
            { note: 'G4', duration: 2 },
            { note: 'F4', duration: 2 },
            { note: 'Eb4', duration: 1 },
            { note: 'C4', duration: 1 },
            { note: 'G3', duration: 4 }
        ];
        
        // Define bassline
        const bassNotes = [
            { note: 'C2', duration: 4 },
            { note: 'G2', duration: 4 },
            { note: 'Bb2', duration: 4 },
            { note: 'C3', duration: 2 },
            { note: 'G2', duration: 2 }
        ];
        
        // Helper to convert note names to frequencies
        const noteToFreq = (note) => {
            const notes = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
            const octave = parseInt(note.slice(-1));
            const noteName = note.slice(0, -1);
            const semitones = notes[noteName];
            return 440 * Math.pow(2, (semitones - 9) / 12) * Math.pow(2, octave - 4);
        };
        
        // Sequencer function to play the background music
        const playSequence = (time) => {
            // Play melody
            const melodyGain = this.audioContext.createGain();
            melodyGain.gain.value = 0.15;
            melodyGain.connect(baseGain);
            
            let melodyTime = time;
            let melodyRepeat = 0;
            
            const scheduleMelody = () => {
                melodyNotes.forEach(note => {
                    const osc = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    // Set oscillator type
                    osc.type = 'sine';
                    osc.frequency.value = noteToFreq(note.note);
                    
                    // Connect through gain for envelope
                    osc.connect(gainNode);
                    gainNode.connect(melodyGain);
                    
                    // Schedule playback
                    const noteDuration = note.duration * beatLength;
                    const now = this.audioContext.currentTime;
                    
                    // Envelope shaping
                    gainNode.gain.setValueAtTime(0, melodyTime);
                    gainNode.gain.linearRampToValueAtTime(0.8, melodyTime + 0.05);
                    gainNode.gain.setValueAtTime(0.8, melodyTime + noteDuration * 0.7);
                    gainNode.gain.linearRampToValueAtTime(0, melodyTime + noteDuration);
                    
                    // Start and stop oscillator
                    osc.start(melodyTime);
                    osc.stop(melodyTime + noteDuration);
                    
                    // Cleanup
                    setTimeout(() => {
                        osc.disconnect();
                        gainNode.disconnect();
                    }, (melodyTime + noteDuration - now) * 1000 + 100);
                    
                    // Move time forward
                    melodyTime += noteDuration;
                });
                
                // Schedule next iteration with slight variation
                melodyRepeat++;
                if (melodyRepeat < 8) { // Limit the recursion
                    setTimeout(scheduleMelody, 8000); // Schedule next repeats
                }
            };
            
            // Play bass
            const bassGain = this.audioContext.createGain();
            bassGain.gain.value = 0.25;
            bassGain.connect(baseGain);
            
            let bassTime = time;
            let bassRepeat = 0;
            
            const scheduleBass = () => {
                bassNotes.forEach(note => {
                    const osc = this.audioContext.createOscillator();
                    const filter = this.audioContext.createBiquadFilter();
                    const gainNode = this.audioContext.createGain();
                    
                    // Set up oscillator and filter
                    osc.type = 'triangle';
                    osc.frequency.value = noteToFreq(note.note);
                    
                    filter.type = 'lowpass';
                    filter.frequency.value = 500;
                    
                    // Connect nodes
                    osc.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(bassGain);
                    
                    // Schedule playback
                    const noteDuration = note.duration * beatLength;
                    const now = this.audioContext.currentTime;
                    
                    // Envelope shaping
                    gainNode.gain.setValueAtTime(0, bassTime);
                    gainNode.gain.linearRampToValueAtTime(1, bassTime + 0.1);
                    gainNode.gain.setValueAtTime(1, bassTime + noteDuration * 0.8);
                    gainNode.gain.linearRampToValueAtTime(0, bassTime + noteDuration);
                    
                    // Start and stop oscillator
                    osc.start(bassTime);
                    osc.stop(bassTime + noteDuration);
                    
                    // Cleanup
                    setTimeout(() => {
                        osc.disconnect();
                        filter.disconnect();
                        gainNode.disconnect();
                    }, (bassTime + noteDuration - now) * 1000 + 100);
                    
                    // Move time forward
                    bassTime += noteDuration;
                });
                
                // Schedule next iteration
                bassRepeat++;
                if (bassRepeat < 8) { // Limit the recursion
                    setTimeout(scheduleBass, 8000); // Schedule next repeats
                }
            };
            
            // Add ambient pad sound
            const padGain = this.audioContext.createGain();
            padGain.gain.value = 0.05; // Very subtle
            padGain.connect(baseGain);
            
            const createPad = () => {
                const padOsc1 = this.audioContext.createOscillator();
                const padOsc2 = this.audioContext.createOscillator();
                const padFilter = this.audioContext.createBiquadFilter();
                
                // Set oscillator properties
                padOsc1.type = 'sine';
                padOsc1.frequency.value = noteToFreq('C3');
                
                padOsc2.type = 'sine';
                padOsc2.frequency.value = noteToFreq('G3');
                
                // Set filter properties
                padFilter.type = 'lowpass';
                padFilter.frequency.value = 800;
                padFilter.Q.value = 0.5;
                
                // Connect nodes
                padOsc1.connect(padFilter);
                padOsc2.connect(padFilter);
                padFilter.connect(padGain);
                
                // Schedule pad sound
                const now = this.audioContext.currentTime;
                const padDuration = 16 * beatLength; // Long sustaining pad
                
                padGain.gain.setValueAtTime(0, now);
                padGain.gain.linearRampToValueAtTime(0.05, now + 2);
                padGain.gain.setValueAtTime(0.05, now + padDuration - 2);
                padGain.gain.linearRampToValueAtTime(0, now + padDuration);
                
                padOsc1.start(now);
                padOsc2.start(now);
                padOsc1.stop(now + padDuration);
                padOsc2.stop(now + padDuration);
                
                // Store and clean up
                this.backgroundMusicNodes.push(padOsc1, padOsc2, padFilter);
                
                // Schedule next pad
                setTimeout(() => {
                    padOsc1.disconnect();
                    padOsc2.disconnect();
                    padFilter.disconnect();
                    createPad(); // Recreate pad for continuous sound
                }, (padDuration - 0.5) * 1000);
            };
            
            // Start the parts of the music
            scheduleMelody();
            scheduleBass();
            createPad();
        };
        
        // Start the sequence
        this.backgroundSequencer = playSequence;
        playSequence(this.audioContext.currentTime);
        
        console.log("Background music started");
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
            
            // Connect through effects if needed
            source.connect(gainNode);
            
            if (sound.useReverb && this.reverb) {
                gainNode.connect(this.reverb);
            } else {
                gainNode.connect(this.compressor);
            }
            
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
        // Create and play the background music
        if (this.initialized) {
            this.createBackgroundMusic();
        }
    }
    
    stopBackgroundMusic() {
        // Clean up all background music nodes
        if (this.backgroundMusicNodes && this.backgroundMusicNodes.length > 0) {
            this.backgroundMusicNodes.forEach(node => {
                try {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                } catch (e) {
                    console.warn('Error cleaning up background music node:', e);
                }
            });
            this.backgroundMusicNodes = [];
        }
        
        // Clear sequencer
        this.backgroundSequencer = null;
    }
    
    stopAll() {
        if (!this.initialized) return;
        
        // Stop background music
        this.stopBackgroundMusic();
        
        // Disconnect and recreate master gain to stop all sounds
        this.masterGain.disconnect();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        
        // Reconnect effects chain
        if (this.reverb) {
            this.reverb.connect(this.compressor);
            this.compressor.connect(this.masterGain);
        } else if (this.compressor) {
            this.compressor.connect(this.masterGain);
        }
        
        this.masterGain.connect(this.audioContext.destination);
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();
