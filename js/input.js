// ============================================
// INPUT MANAGER
// Keyboard and touch controls
// ============================================

const InputManager = {
    // Input state
    keys: {},
    touchControls: {
        enabled: false,
        buttons: {
            left: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowLeft', pressed: false, touchId: null },
            right: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowRight', pressed: false, touchId: null },
            fire: { x: 0, y: 0, w: 0, h: 0, key: 'Space', pressed: false, touchId: null },
            autoShoot: { x: 0, y: 0, w: 0, h: 0, key: null, pressed: false, touchId: null }
        }
    },
    
    // Device detection
    isTouchDevice: false,
    hasKeyboard: false,
    autoShootActive: false,
    
    // State callbacks
    onStateChange: null,
    onPause: null,
    onResume: null,
    onHighScoreInput: null,
    
    // Canvas reference
    canvas: null,
    
    // Initialize input system
    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.onStateChange = callbacks.onStateChange || null;
        this.onPause = callbacks.onPause || null;
        this.onResume = callbacks.onResume || null;
        this.onHighScoreInput = callbacks.onHighScoreInput || null;
        
        // Set up keyboard
        this.initKeyboard();
        
        // Detect touch support
        this.isTouchDevice = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
        
        this.hasKeyboard = !this.isTouchDevice;
        
        // Initialize touch if available
        if (this.isTouchDevice) {
            this.initTouch();
        }
        
        console.log(`✅ Input Manager initialized (touch: ${this.isTouchDevice})`);
        return this;
    },
    
    // Keyboard initialization
    initKeyboard() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Handle window blur/focus to prevent stuck keys
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
        
        // Make canvas focusable and handle clicks
        if (this.canvas) {
            this.canvas.tabIndex = 1000; // Make canvas focusable
            this.canvas.addEventListener('click', () => {
                this.canvas.focus();
            });
            
            // Focus canvas immediately
            this.canvas.focus();
        }
    },
    
    // Handle window losing focus
    handleWindowBlur() {
        console.log('Window lost focus - resetting input state');
        this.reset();
    },
    
    // Handle window regaining focus
    handleWindowFocus() {
        console.log('Window regained focus - ready for input');
        if (this.canvas) {
            this.canvas.focus();
        }
    },
    
    // Handle key down
    handleKeyDown(e) {
        // Prevent default for game keys
        if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyP', 'Enter'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Mark keyboard as detected
        if (!this.hasKeyboard) {
            this.hasKeyboard = true;
            console.log('Keyboard detected - touch controls will be hidden');
        }
        
        this.keys[e.code] = true;
        
        // Notify state changes if callback provided
        if (this.onStateChange) {
            this.onStateChange(e.code);
        }
    },
    
    // Handle key up
    handleKeyUp(e) {
        this.keys[e.code] = false;
    },
    
    // Touch initialization
    initTouch() {
        if (!this.canvas) return;
        
        const buttonSize = 60;
        const margin = 20;
        const bottomMargin = 40;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Left button
        this.touchControls.buttons.left = {
            x: margin,
            y: canvasHeight - buttonSize - bottomMargin,
            w: buttonSize,
            h: buttonSize,
            key: 'ArrowLeft',
            pressed: false,
            touchId: null
        };
        
        // Right button
        this.touchControls.buttons.right = {
            x: margin + buttonSize + 10,
            y: canvasHeight - buttonSize - bottomMargin,
            w: buttonSize,
            h: buttonSize,
            key: 'ArrowRight',
            pressed: false,
            touchId: null
        };
        
        // Auto-shoot button
        this.touchControls.buttons.autoShoot = {
            x: canvasWidth - buttonSize * 2 - margin - 10,
            y: canvasHeight - buttonSize - bottomMargin,
            w: buttonSize,
            h: buttonSize,
            key: null,
            pressed: false,
            touchId: null
        };
        
        // Fire button
        this.touchControls.buttons.fire = {
            x: canvasWidth - buttonSize - margin,
            y: canvasHeight - buttonSize - bottomMargin,
            w: buttonSize,
            h: buttonSize,
            key: 'Space',
            pressed: false,
            touchId: null
        };
        
        // Add touch listeners
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        this.touchControls.enabled = true;
        console.log('Touch controls initialized');
    },
    
    // Handle touch start
    handleTouchStart(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touches = e.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // For splash/game over screens - treat any tap as Enter/Space
            // This allows tap-anywhere to start/continue
            // Trigger the state change callback which handles screen transitions
            if (this.onStateChange) {
                this.onStateChange('Space');
            }
            
            // Also simulate Space key for consistent handling
            this.keys['Space'] = true;
            setTimeout(() => { this.keys['Space'] = false; }, 100);
            
            // Check which button was touched (for gameplay)
            for (const [buttonName, button] of Object.entries(this.touchControls.buttons)) {
                if (x >= button.x && x <= button.x + button.w &&
                    y >= button.y && y <= button.y + button.h) {
                    
                    button.pressed = true;
                    button.touchId = touch.identifier;
                    
                    // Handle special cases
                    if (buttonName === 'autoShoot') {
                        this.autoShootActive = !this.autoShootActive;
                    } else if (button.key) {
                        this.keys[button.key] = true;
                    }
                    
                    break;
                }
            }
        }
    },
    
    // Handle touch move
    handleTouchMove(e) {
        e.preventDefault();
        // Could add drag handling here if needed
    },
    
    // Handle touch end
    handleTouchEnd(e) {
        e.preventDefault();
        
        const touches = e.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            
            // Find and release the button
            for (const [buttonName, button] of Object.entries(this.touchControls.buttons)) {
                if (button.touchId === touch.identifier) {
                    button.pressed = false;
                    button.touchId = null;
                    
                    // Release key (except autoShoot which is a toggle)
                    if (button.key && buttonName !== 'autoShoot') {
                        this.keys[button.key] = false;
                    }
                    
                    break;
                }
            }
        }
    },
    
    // Check if key is pressed
    isKeyPressed(keyCode) {
        return this.keys[keyCode] === true;
    },
    
    // Check if button is pressed
    isButtonPressed(buttonName) {
        return this.touchControls.buttons[buttonName]?.pressed === true;
    },
    
    // Check left input
    isLeft() {
        return this.isKeyPressed('ArrowLeft') || this.isButtonPressed('left');
    },
    
    // Check right input
    isRight() {
        return this.isKeyPressed('ArrowRight') || this.isButtonPressed('right');
    },
    
    // Check fire input
    isFire() {
        return this.isKeyPressed('Space') || this.isButtonPressed('fire') || this.autoShootActive;
    },
    
    // Check pause input
    isPause() {
        return this.isKeyPressed('KeyP');
    },
    
    // Check enter input
    isEnter() {
        return this.isKeyPressed('Space') || this.isKeyPressed('Enter');
    },
    
    // Should show touch controls
    shouldShowTouchControls() {
        return this.isTouchDevice && !this.hasKeyboard && this.touchControls.enabled;
    },
    
    // Reset all input state
    reset() {
        this.keys = {};
        this.autoShootActive = false;
        
        for (const button of Object.values(this.touchControls.buttons)) {
            button.pressed = false;
            button.touchId = null;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}
