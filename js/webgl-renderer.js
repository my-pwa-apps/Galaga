// WebGL Renderer for optimized performance
class WebGLRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.gl = null;
        this.program = null;
        this.initialized = false;
        this.sprites = new Map();
        this.shaderCache = new Map();
        this.maxSprites = 1000; // Maximum sprites to render in a batch
        
        // Try to initialize WebGL
        this.initWebGL();
    }
    
    initWebGL() {
        try {
            // Initialize WebGL context
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
            if (!this.gl) {
                console.log("WebGL not supported, falling back to Canvas rendering");
                return false;
            }
            
            // Create shader programs
            this.initShaders();
            
            // Initialize buffers
            this.initBuffers();
            
            // Set blend mode for transparency
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            
            // Clear color (black)
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            
            // Set initialization flag
            this.initialized = true;
            return true;
        } catch (e) {
            console.error("Error initializing WebGL:", e);
            return false;
        }
    }
    
    initShaders() {
        // Create vertex shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            
            uniform vec2 u_resolution;
            
            varying vec2 v_texCoord;
            
            void main() {
                // Convert from pixels to clip space
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                v_texCoord = a_texCoord;
            }
        `;
        
        // Create fragment shader
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D u_image;
            uniform vec4 u_color;
            
            varying vec2 v_texCoord;
            
            void main() {
                vec4 texColor = texture2D(u_image, v_texCoord);
                gl_FragColor = texColor * u_color;
            }
        `;
        
        // Compile shaders
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        // Check if program linked successfully
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error("Could not initialize shaders");
            return null;
        }
        
        // Use program
        this.gl.useProgram(this.program);
        
        // Get attribute and uniform locations
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, "a_texCoord");
        this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.imageUniformLocation = this.gl.getUniformLocation(this.program, "u_image");
        this.colorUniformLocation = this.gl.getUniformLocation(this.program, "u_color");
    }
    
    compileShader(source, type) {
        // Create shader
        const shader = this.gl.createShader(type);
        
        // Set shader source
        this.gl.shaderSource(shader, source);
        
        // Compile shader
        this.gl.compileShader(shader);
        
        // Check if shader compiled successfully
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Could not compile shader:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    initBuffers() {
        // Create position buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        
        // Create tex coord buffer
        this.texCoordBuffer = this.gl.createBuffer();
    }
    
    loadTexture(imageKey, imageSource) {
        // Check if texture already loaded
        if (this.sprites.has(imageKey)) {
            return this.sprites.get(imageKey);
        }
        
        // Create texture object
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        
        // Upload a 1x1 blue pixel while the image loads
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, 
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, 
            new Uint8Array([0, 0, 255, 255])
        );
        
        // Load the image
        const image = new Image();
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,
                this.gl.UNSIGNED_BYTE, image
            );
        };
        image.src = imageSource;
        
        // Store texture in sprites map
        this.sprites.set(imageKey, {
            texture: texture,
            image: image,
            width: 0,
            height: 0
        });
        
        return this.sprites.get(imageKey);
    }
    
    resize() {
        // Set the canvas to match its display size
        this.canvas.width = this.game.width;
        this.canvas.height = this.game.height;
        
        // Tell WebGL how to convert clip space to pixels
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Set resolution uniform
        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
    }
      clear() {
        // Clear the canvas with black background
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    render() {
        if (!this.initialized) return;
        
        // Always clear the canvas first to prevent pixel accumulation
        this.clear();
        
        // Set canvas size if needed
        this.resize();
        
        // Only render game elements if initialized properly
        if (this.gl && this.program) {
            // Render background (stars)
            this.renderStars();
            
            // Render sprites (enemies, player, projectiles)
            this.renderSprites();
            
            // Render UI elements (score, lives, etc.)
            this.renderUI();
        } else {
            // If WebGL isn't working, fall back to the main renderer
            console.warn("WebGL rendering failed, falling back to canvas renderer");
            if (this.game.renderer) {
                this.game.renderer.render();
            }
        }
    }
    
    renderStars() {
        // Render stars using WebGL point sprites for better performance
        if (!this.game.starfield) return;
    }
    
    renderSprites() {
        // Render all sprites in a single batch
        if (!this.game.player) return;
        
        // Render player
        this.renderPlayer();
        
        // Render enemies
        this.renderEnemies();
        
        // Render projectiles
        this.renderProjectiles();
        
        // Render powerups
        this.renderPowerups();
    }
    
    renderPlayer() {
        // Render the player sprite
        if (!this.game.player || !this.game.player.active) return;
    }
    
    renderEnemies() {
        // Render enemy sprites
        if (!this.game.enemyManager) return;
    }
    
    renderProjectiles() {
        // Render projectiles
        if (!this.game.projectilePool) return;
    }
    
    renderPowerups() {
        // Render powerups
        if (!this.game.powerUpManager) return;
    }
    
    renderUI() {
        // Render UI elements
        // For now, use the canvas 2D context for UI
    }
}

// Only create the WebGL renderer if needed
if (typeof window !== 'undefined') {
    window.WebGLRenderer = WebGLRenderer;
}
