// Fix syntax error at line 3

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
    
    // Rest of your game.js code...
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
