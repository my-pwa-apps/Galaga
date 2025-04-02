// Enhanced mobile controls implementation

class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        
        // Setup input listeners
        this.setupKeyboardControls();
        
        // Always setup touch controls for better compatibility
        this.setupTouchControls();
        
        // Track if controls are available
        this.mobileControlsActive = false;
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
    
    setupTouchControls() {
        const moveLeft = document.getElementById('move-left');
        const moveRight = document.getElementById('move-right');
        const shoot = document.getElementById('shoot');
        
        if (!moveLeft || !moveRight || !shoot) {
            console.error("Mobile control elements not found");
            return;
        }
        
        // Handle mobile control visibility
        this.setupMobileControlsVisibility();
        
        // Use both touch and mouse events for better compatibility
        this.setupButtonEvents(moveLeft, 'left');
        this.setupButtonEvents(moveRight, 'right');
        this.setupButtonEvents(shoot, 'fire');
    }
    
    setupButtonEvents(element, control) {
        // Touch events
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys[control] = true;
        });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys[control] = false;
        });
        
        // Mouse events (for testing on desktop)
        element.addEventListener('mousedown', (e) => {
            this.keys[control] = true;
        });
        
        element.addEventListener('mouseup', (e) => {
            this.keys[control] = false;
        });
        
        // Ensure control is released when cursor/touch leaves button
        element.addEventListener('touchcancel', (e) => {
            this.keys[control] = false;
        });
        
        element.addEventListener('mouseleave', (e) => {
            this.keys[control] = false;
        });
    }
    
    setupMobileControlsVisibility() {
        const mobileControls = document.getElementById('mobile-controls');
        
        // Show mobile controls on touch devices
        if (this.isTouchDevice()) {
            this.mobileControlsActive = true;
            mobileControls.classList.remove('hidden-on-desktop');
            
            // Mark the body for potential CSS adjustments
            document.body.classList.add('touch-device');
        } else {
            // Make sure mobile controls stay hidden on non-touch devices
            mobileControls.classList.add('hidden-on-desktop');
        }
    }
    
    isTouchDevice() {
        return (('ontouchstart' in window) || 
                (navigator.maxTouchPoints > 0) || 
                (navigator.msMaxTouchPoints > 0));
    }
}

// Add a global initialization to create a debug function for controls
window.addEventListener('load', () => {
    window.checkControlsStatus = function() {
        if (window.game && window.game.controls) {
            console.log("Control states:", window.game.controls.keys);
            console.log("Mobile controls active:", window.game.controls.mobileControlsActive);
        } else {
            console.log("Game controls not initialized yet");
        }
    };
});
