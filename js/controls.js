// Input controls for both keyboard and touch

class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        
        this.setupKeyboardControls();
        
        if (isMobileDevice()) {
            this.setupTouchControls();
        }
    }
    
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case ' ':
                    this.keys.fire = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case ' ':
                    this.keys.fire = false;
                    break;
            }
        });
    }
    
    setupTouchControls() {
        const moveLeft = document.getElementById('move-left');
        const moveRight = document.getElementById('move-right');
        const shoot = document.getElementById('shoot');
        
        // Left button
        moveLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.left = true;
        });
        
        moveLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.left = false;
        });
        
        // Right button
        moveRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.right = true;
        });
        
        moveRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.right = false;
        });
        
        // Shoot button
        shoot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.fire = true;
        });
        
        shoot.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.fire = false;
        });
        
        // Show mobile controls
        document.getElementById('mobile-controls').classList.remove('hidden-on-desktop');
    }
}
