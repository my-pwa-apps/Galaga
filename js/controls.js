// Enhanced mobile controls implementation with better touch handling

class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        
        this.touches = {}; // Track active touches by ID
        this.touchThrottled = false; // For optimizing touch handling
        this.touchStartTime = 0;
        this.longPressThreshold = 300; // ms
        
        // Initialize the controls
        this.setupKeyboardControls();
        this.setupMobileControls();
        
        // First-time control hint
        if (this.isTouchDevice() && !localStorage.getItem('controlsHintShown')) {
            this.showControlsHint();
        }
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
            
            // Set up the controls
            this.setupTouchControls();
            
            // Handle global touch events on the game canvas
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.addEventListener('touchstart', this.handleCanvasTouch.bind(this), { passive: false });
                canvas.addEventListener('touchend', this.handleCanvasTouch.bind(this), { passive: false });
                canvas.addEventListener('touchcancel', this.handleCanvasTouch.bind(this), { passive: false });
            }
        }
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
    
    showControlsHint() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen) return;
        
        // Create a hint element
        const hint = document.createElement('div');
        hint.className = 'controls-hint';
        hint.textContent = 'Tap sides to move, top to shoot';
        gameScreen.appendChild(hint);
        
        // Remove after animation completes
        setTimeout(() => {
            hint.remove();
            localStorage.setItem('controlsHintShown', 'true');
        }, 5000);
    }
    
    isTouchDevice() {
        return (('ontouchstart' in window) || 
                (navigator.maxTouchPoints > 0) || 
                (navigator.msMaxTouchPoints > 0));
    }
    
    // Reset controls state - useful when switching screens
    reset() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.fire = false;
        this.touches = {};
    }
}
