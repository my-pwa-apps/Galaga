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
            up: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowUp', pressed: false },
            left: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowLeft', pressed: false },
            right: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowRight', pressed: false },
            down: { x: 0, y: 0, w: 0, h: 0, key: 'ArrowDown', pressed: false },
            fire: { x: 0, y: 0, w: 0, h: 0, key: 'Space', pressed: false }
        }
    },
    
    // Device detection
    isTouchDevice: false,
    hasKeyboard: false,
    
    // State callbacks
    onStateChange: null,
    onPause: null,
    onResume: null,
    onHighScoreInput: null,
    
    // Canvas reference
    canvas: null,

    gesture: {
        active: false,
        menuMode: false,
        startX: 0,
        startY: 0,
        moved: false,
        directionKey: null,
        fireActive: false
    },
    
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
        const btnUp = document.getElementById('btnUp');
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnDown = document.getElementById('btnDown');
        const btnFire = document.getElementById('btnFire');
        
        if (!touchControlsEl || !btnUp || !btnLeft || !btnRight || !btnDown || !btnFire) {
            console.warn('Touch control HTML elements not found');
            return;
        }
        
        // Show touch controls
        touchControlsEl.classList.add('visible');
        if (this.touchControls.enabled) return;
        
        // Wire up button events with multi-touch support
        this._wireButton(btnUp, 'up', 'ArrowUp');
        this._wireButton(btnLeft, 'left', 'ArrowLeft');
        this._wireButton(btnRight, 'right', 'ArrowRight');
        this._wireButton(btnDown, 'down', 'ArrowDown');
        this._wireButton(btnFire, 'fire', 'Space');
        
        // Canvas gestures support tap-to-fire and swipe/drag steering.
        this.canvas.addEventListener('touchstart', (e) => {
            const state = typeof GameState !== 'undefined' ? GameState.current : '';
            if (state === GameConfig.STATE.PLAYING) {
                this.handleCanvasGestureStart(e);
                return;
            }

            if (state !== GameConfig.STATE.PAUSED) {
                this.handleMenuGestureStart(e);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleCanvasGestureMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleCanvasGestureEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleCanvasGestureEnd(e), { passive: false });
        
        this.touchControls.enabled = true;
    },
    
    // Wire a touch button to a key
    _wireButton(element, buttonName, keyCode) {
        const button = this.touchControls.buttons[buttonName];
        let lastPressAt = 0;
        
        const press = (e) => {
            e.preventDefault();
            e.stopPropagation();
            lastPressAt = Date.now();
            button.pressed = true;
            if (keyCode) this.keys[keyCode] = true;
            element.classList.add('pressed');

            if (this.onStateChange) {
                const state = typeof GameState !== 'undefined' ? GameState.current : '';
                if (state !== GameConfig.STATE.PLAYING && state !== GameConfig.STATE.PAUSED) {
                    this.onStateChange(keyCode);
                }
            }
        };
        
        const release = (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.pressed = false;
            if (keyCode) this.keys[keyCode] = false;
            element.classList.remove('pressed');
        };

        const clickFallback = (e) => {
            if (Date.now() - lastPressAt < 250) return;
            press(e);
            release(e);
        };
        
        if (window.PointerEvent) {
            element.addEventListener('pointerdown', press);
            element.addEventListener('pointerup', release);
            element.addEventListener('pointercancel', release);
            element.addEventListener('pointerleave', release);
        } else {
            element.addEventListener('touchstart', press, { passive: false });
            element.addEventListener('touchend', release, { passive: false });
            element.addEventListener('touchcancel', release, { passive: false });
            element.addEventListener('mousedown', press);
            element.addEventListener('mouseup', release);
            element.addEventListener('mouseleave', release);
        }

        element.addEventListener('click', clickFallback);
        
        // Prevent context menu on long press
        element.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    
    // Handle touch start (legacy - now handled by HTML buttons)
    // Canvas tap is handled in initTouch for state changes only

    handleCanvasGestureStart(e) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        e.preventDefault();
        this.gesture.active = true;
        this.gesture.startX = touch.clientX;
        this.gesture.startY = touch.clientY;
        this.gesture.moved = false;
        this.clearGestureDirection();

        if (this.getSelectedGame() === 'galaga') {
            this.keys.Space = true;
            this.touchControls.buttons.fire.pressed = true;
            this.gesture.fireActive = true;
        }
    },

    handleMenuGestureStart(e) {
        const touch = e.changedTouches[0];
        if (!touch) return;

        e.preventDefault();
        this.gesture.active = true;
        this.gesture.menuMode = true;
        this.gesture.startX = touch.clientX;
        this.gesture.startY = touch.clientY;
        this.gesture.moved = false;
    },

    handleCanvasGestureMove(e) {
        if (!this.gesture.active) return;
        const touch = e.changedTouches[0];
        if (!touch) return;

        e.preventDefault();
        const dx = touch.clientX - this.gesture.startX;
        const dy = touch.clientY - this.gesture.startY;
        const threshold = 18;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;

        this.gesture.moved = true;
        if (this.gesture.menuMode) {
            if (this.onStateChange && Math.abs(dx) > Math.abs(dy)) {
                this.onStateChange(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
            }
            this.gesture.active = false;
            this.gesture.menuMode = false;
            return;
        }

        const direction = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
            : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        this.setGestureDirection(direction);
    },

    handleCanvasGestureEnd(e) {
        if (!this.gesture.active) return;

        e.preventDefault();
        if (this.gesture.menuMode) {
            if (!this.gesture.moved && this.onStateChange) {
                this.onStateChange('Space');
            }
            this.gesture.active = false;
            this.gesture.menuMode = false;
            this.gesture.moved = false;
            return;
        }

        this.clearGestureDirection();
        if (this.gesture.fireActive) {
            this.keys.Space = false;
            this.touchControls.buttons.fire.pressed = false;
        }

        this.gesture.active = false;
        this.gesture.fireActive = false;
        this.gesture.moved = false;
    },

    setGestureDirection(keyCode) {
        if (this.gesture.directionKey === keyCode) return;
        this.clearGestureDirection();
        this.gesture.directionKey = keyCode;
        this.keys[keyCode] = true;
    },

    clearGestureDirection() {
        if (!this.gesture.directionKey) return;
        this.keys[this.gesture.directionKey] = false;
        this.gesture.directionKey = null;
    },

    updateTouchControlMode() {
        const touchControlsEl = document.getElementById('touchControls');
        if (!touchControlsEl) return;

        const isPacManPlaying = typeof GameState !== 'undefined' &&
            GameState.current === GameConfig.STATE.PLAYING &&
            GameState.selectedGame === 'pacman';
        touchControlsEl.classList.toggle('pacman-mode', isPacManPlaying);
    },

    getSelectedGame() {
        return typeof GameState !== 'undefined' ? GameState.selectedGame : 'galaga';
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

    isUp() {
        return this.isKeyPressed('ArrowUp') || this.isButtonPressed('up');
    },

    isDown() {
        return this.isKeyPressed('ArrowDown') || this.isButtonPressed('down');
    },
    
    // Check fire input
    isFire() {
        return this.isKeyPressed('Space') || this.isButtonPressed('fire');
    },
    
    // Check pause input
    isPause() {
        return this.isKeyPressed('KeyP');
    },
    
    // Check enter input
    isEnter() {
        return this.isKeyPressed('Space') || this.isKeyPressed('Enter');
    },
    
    // Reset all input state
    reset() {
        this.keys = {};
        this.gesture.active = false;
        this.gesture.menuMode = false;
        this.gesture.directionKey = null;
        this.gesture.fireActive = false;
        
        for (const button of Object.values(this.touchControls.buttons)) {
            button.pressed = false;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}
