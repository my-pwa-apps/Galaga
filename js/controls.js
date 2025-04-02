// Add auto-shooting functionality

class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        
        this.touches = {}; // Track active touches by ID
        
        // Add auto-shoot property
        this.autoShoot = false;
        
        // Initialize controls
        this.setupKeyboardControls();
        this.setupMobileControls();
    }
    
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            this.handleKeyAction(e.key, true);
        });
        
        window.addEventListener('keyup', (e) => {
            this.handleKeyAction(e.key, false);
        });
    }
    
    handleKeyAction(key, isDown) {
        switch(key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = isDown;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = isDown;
                break;
            case ' ':
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.fire = isDown;
                break;
        }
    }
    
    setupMobileControls() {
        // Only proceed if we have the controls container
        const mobileControls = document.getElementById('mobile-controls');
        if (!mobileControls) return;
        
        // Detect if we're on a touch device and show controls accordingly
        if (this.isTouchDevice()) {
            mobileControls.classList.remove('hidden-on-desktop');
            document.body.classList.add('touch-device');
            
            // Set up touch controls
            this.setupTouchControls();
            
            // Set up auto-shoot toggle
            this.setupAutoShootToggle();
            
            // Handle global touch events on the game canvas
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.addEventListener('touchstart', this.handleCanvasTouch.bind(this), { passive: false });
                canvas.addEventListener('touchend', this.handleCanvasTouch.bind(this), { passive: false });
                canvas.addEventListener('touchcancel', this.handleCanvasTouch.bind(this), { passive: false });
            }
        }
    }
    
    setupAutoShootToggle() {
        const autoShootToggle = document.getElementById('auto-shoot-toggle');
        if (!autoShootToggle) return;
        
        // Check localStorage for previous setting
        const savedAutoShoot = localStorage.getItem('autoShootEnabled');
        if (savedAutoShoot === 'true') {
            this.autoShoot = true;
            autoShootToggle.classList.add('active');
        }
        
        // Set up toggle button
        autoShootToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.autoShoot = !this.autoShoot;
            autoShootToggle.classList.toggle('active');
            
            // Save preference
            localStorage.setItem('autoShootEnabled', this.autoShoot.toString());
            
            // Provide haptic feedback on toggle
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(30);
            }
            
            // Play sound feedback if available
            if (window.audioManager) {
                window.audioManager.play(this.autoShoot ? 'powerUp' : 'bulletHit', 0.3);
            }
        });
    }
    
    setupTouchControls() {
        const moveLeft = document.getElementById('move-left');
        const moveRight = document.getElementById('move-right');
        const shoot = document.getElementById('shoot');
        
        if (!moveLeft || !moveRight || !shoot) return;
        
        // Use optimized event handlers with proper binding and options
        this.setupTouchButton(moveLeft, 'left');
        this.setupTouchButton(moveRight, 'right');
        this.setupTouchButton(shoot, 'fire');
    }
    
    setupTouchButton(element, control) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys[control] = true;
            this.touches[e.touches[0].identifier] = control;
            
            // Attempt to use vibration API for haptic feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(20);
            }
        }, { passive: false });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys[control] = false;
            
            // Clear this touch ID
            for (const id in this.touches) {
                if (this.touches[id] === control) {
                    delete this.touches[id];
                }
            }
        }, { passive: false });
        
        element.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys[control] = false;
            
            // Clear this touch ID
            for (const id in this.touches) {
                if (this.touches[id] === control) {
                    delete this.touches[id];
                }
            }
        }, { passive: false });
    }
    
    handleCanvasTouch(e) {
        // This handles touches directly on the canvas
        if (e.type === 'touchstart') {
            e.preventDefault();
            
            // Check the position of the touch to determine what action to take
            const touch = e.touches[0];
            const canvas = document.getElementById('game-canvas');
            const rect = canvas.getBoundingClientRect();
            
            // Normalize touch position to canvas coordinates
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // If touch is in the top half of screen, shoot
            if (y < rect.height / 2) {
                this.keys.fire = true;
                this.touches[touch.identifier] = 'fire';
            } else {
                // Otherwise move based on which side was touched
                if (x < rect.width / 2) {
                    this.keys.left = true;
                    this.touches[touch.identifier] = 'left';
                } else {
                    this.keys.right = true;
                    this.touches[touch.identifier] = 'right';
                }
            }
        } else if (e.type === 'touchend' || e.type === 'touchcancel') {
            e.preventDefault();
            
            // Clear the touch actions
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touchId = e.changedTouches[i].identifier;
                const control = this.touches[touchId];
                
                if (control) {
                    this.keys[control] = false;
                    delete this.touches[touchId];
                }
            }
        }
    }
    
    update() {
        // Method to be called each frame from the game loop
        if (this.autoShoot && this.game.gameState === 'playing') {
            // Set fire key to true when auto-shoot is enabled
            this.keys.fire = true;
        }
    }
    
    reset() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.fire = false;
        this.touches = {};
        // Don't reset autoShoot as it's a persistent setting
    }
    
    isTouchDevice() {
        return (('ontouchstart' in window) || 
                (navigator.maxTouchPoints > 0) || 
                (navigator.msMaxTouchPoints > 0));
    }
}
