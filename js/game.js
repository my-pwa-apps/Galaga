class Game {
    constructor(options) {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 600;
        this.height = 800;
        this.frameCount = 0;
        this.score = 0;
        
        // Set up the game
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize game components
        this.player = new Player(this);
        this.controls = new Controls(this);
        this.projectiles = [];
        this.enemyManager = new EnemyManager(this);
        this.powerUpManager = new PowerUpManager(this);
        this.levelManager = new LevelManager(this);
        this.explosions = [];
        
        // Initial game state
        this.gameState = 'start';
        
        // Initialize UI and audio
        this.setupAudioControls();
        this.initUI();
        
        // Start animation loop
        this.animate();
    }
    
    resize() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const ratio = this.width / this.height;
        
        let canvasWidth, canvasHeight;
        
        // Calculate dimensions while maintaining aspect ratio
        if (containerHeight * ratio < containerWidth) {
            canvasHeight = containerHeight * 0.9;
            canvasWidth = canvasHeight * ratio;
        } else {
            canvasWidth = containerWidth * 0.9;
            canvasHeight = canvasWidth / ratio;
        }
        
        // Set internal canvas dimensions
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Set display size with CSS
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        
        // On mobile, adjust for controls
        if (window.innerWidth < 768) {
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls && !mobileControls.classList.contains('hidden-on-desktop')) {
                const controlsHeight = mobileControls.offsetHeight || window.innerHeight * 0.2;
                this.canvas.style.height = `${canvasHeight - controlsHeight}px`;
            }
        }
    }
    
    setupAudioControls() {
        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                const isMuted = window.audioManager?.toggleMute();
                muteButton.textContent = isMuted ? '🔇' : '🔊';
                muteButton.classList.toggle('muted', isMuted);
            });
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
