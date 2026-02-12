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
        
        // Input manager ready
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
        this.reset();
    },
    
    // Handle window regaining focus
    handleWindowFocus() {
        if (this.canvas) {
            this.canvas.focus();
        }
    },
    
    // Handle key down
    handleKeyDown(e) {
        // Prevent default for game keys
        if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyP', 'Enter'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Mark keyboard as detected
        if (!this.hasKeyboard) {
            this.hasKeyboard = true;
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
        
        // Get HTML touch control elements
        const touchControlsEl = document.getElementById('touchControls');
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnFire = document.getElementById('btnFire');
        
        if (!touchControlsEl || !btnLeft || !btnRight || !btnFire) {
            console.warn('Touch control HTML elements not found');
            return;
        }
        
        // Show touch controls
        touchControlsEl.classList.add('visible');
        
        // Wire up button events with multi-touch support
        this._wireButton(btnLeft, 'left', 'ArrowLeft');
        this._wireButton(btnRight, 'right', 'ArrowRight');
        this._wireButton(btnFire, 'fire', 'Space');
        
        // Canvas tap for state changes (start/continue/etc.)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.onStateChange) {
                this.onStateChange('Space');
            }
            this.keys['Space'] = true;
            setTimeout(() => { this.keys['Space'] = false; }, 100);
        }, { passive: false });
        
        this.touchControls.enabled = true;
    },
    
    // Wire a touch button to a key
    _wireButton(element, buttonName, keyCode) {
        const button = this.touchControls.buttons[buttonName];
        
        const press = (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.pressed = true;
            if (keyCode) this.keys[keyCode] = true;
            element.classList.add('pressed');
        };
        
        const release = (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.pressed = false;
            if (keyCode) this.keys[keyCode] = false;
            element.classList.remove('pressed');
        };
        
        element.addEventListener('touchstart', press, { passive: false });
        element.addEventListener('touchend', release, { passive: false });
        element.addEventListener('touchcancel', release, { passive: false });
        
        // Prevent context menu on long press
        element.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    
    // Handle touch start (legacy - now handled by HTML buttons)
    // Canvas tap is handled in initTouch for state changes only
    
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
