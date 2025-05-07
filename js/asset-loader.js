// Optimized Asset Preloader with batched loading and caching
class AssetLoader {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgress = null;
        this.onComplete = null;
        this.errors = [];
        this.loadingStartTime = 0;
        this.assetLoadTimes = {}; // Track loading time for each asset
        this.batchSize = 4; // Number of assets to load concurrently
        this.loadQueue = []; // Queue of assets to load
        this.activeLoads = 0; // Number of assets currently loading
        
        // Enable caching where possible
        this.useCache = true;
        this.cacheVersion = Date.now().toString(); // Cache buster
    }

    // Register an image to be preloaded
    addImage(key, src) {
        this.totalAssets++;
        // Add to loading queue instead of loading immediately
        this.loadQueue.push({
            type: 'image',
            key: key,
            src: src
        });
        
        // Create a placeholder
        this.images[key] = null;
        
        return {
            key: key,
            src: src,
            // Return a promise for immediate use
            loaded: new Promise((resolve) => {
                this[`_resolve_${key}`] = resolve;
            })
        };
    }

    // Register a sound to be preloaded
    addSound(key, src) {
        this.totalAssets++;
        // Add to loading queue instead of loading immediately
        this.loadQueue.push({
            type: 'sound',
            key: key,
            src: src
        });
        
        // Create a placeholder
        this.sounds[key] = null;
        
        return {
            key: key,
            src: src,
            // Return a promise for immediate use
            loaded: new Promise((resolve) => {
                this[`_resolve_${key}`] = resolve;
            })
        };
    }

    // Process the load queue
    _processQueue() {
        // Process queue while we have items and are under the batch size
        while (this.loadQueue.length > 0 && this.activeLoads < this.batchSize) {
            const asset = this.loadQueue.shift();
            this._loadAsset(asset);
        }
    }

    // Load an individual asset
    _loadAsset(asset) {
        this.activeLoads++;
        const startTime = performance.now();
        
        try {
            if (asset.type === 'image') {
                const img = new Image();
                
                // Set up load callbacks
                img.onload = () => {
                    this.images[asset.key] = img;
                    const loadTime = performance.now() - startTime;
                    this.assetLoadTimes[asset.key] = loadTime;
                    this._assetLoaded(`Image: ${asset.key} (${Math.round(loadTime)}ms)`);
                    
                    // Resolve promise if any listeners are waiting
                    if (this[`_resolve_${asset.key}`]) {
                        this[`_resolve_${asset.key}`](img);
                    }
                };
                
                img.onerror = (err) => {
                    this._assetError(`Failed to load image: ${asset.key}`, err);
                };
                
                // Add cache busting if enabled
                let src = asset.src;
                if (this.useCache) {
                    const separator = src.includes('?') ? '&' : '?';
                    src = `${src}${separator}v=${this.cacheVersion}`;
                }
                
                // Start loading
                img.src = src;
            } else if (asset.type === 'sound') {
                const sound = new Audio();
                
                // Set up load callbacks
                sound.oncanplaythrough = () => {
                    this.sounds[asset.key] = sound;
                    const loadTime = performance.now() - startTime;
                    this.assetLoadTimes[asset.key] = loadTime;
                    this._assetLoaded(`Sound: ${asset.key} (${Math.round(loadTime)}ms)`);
                    
                    // Resolve promise if any listeners are waiting
                    if (this[`_resolve_${asset.key}`]) {
                        this[`_resolve_${asset.key}`](sound);
                    }
                };
                
                sound.onerror = (err) => {
                    this._assetError(`Failed to load sound: ${asset.key}`, err);
                };
                
                // Add cache busting if enabled
                let src = asset.src;
                if (this.useCache) {
                    const separator = src.includes('?') ? '&' : '?';
                    src = `${src}${separator}v=${this.cacheVersion}`;
                }
                
                // Start loading
                sound.src = src;
                sound.load();
            }
        } catch (e) {
            this._assetError(`Exception loading ${asset.type}: ${asset.key}`, e);
        }
    }

    // Track loaded assets
    _assetLoaded(assetInfo) {
        this.loadedAssets++;
        this.activeLoads--;
        
        // Update progress
        if (this.onProgress) {
            const progress = Math.min(100, Math.floor((this.loadedAssets / this.totalAssets) * 100));
            const elapsed = performance.now() - this.loadingStartTime;
            
            this.onProgress(progress, {
                loaded: this.loadedAssets,
                total: this.totalAssets,
                elapsed: elapsed,
                assetInfo: assetInfo
            });
        }
        
        // Continue processing queue
        this._processQueue();
        
        // Check if complete
        this._checkComplete();
    }

    // Handle loading errors
    _assetError(message, err) {
        console.warn(message, err);
        this.errors.push({ message, error: err });
        this.loadedAssets++; // Still count as "loaded" to avoid blocking
        this.activeLoads--;
        
        // Continue processing queue
        this._processQueue();
        
        // Check if complete
        this._checkComplete();
    }

    // Check if all assets are loaded
    _checkComplete() {
        if (this.loadedAssets >= this.totalAssets && this.onComplete) {
            const totalTime = performance.now() - this.loadingStartTime;
            console.log(`All assets loaded in ${Math.round(totalTime)}ms`);
            
            // Report any errors
            if (this.errors.length > 0) {
                console.warn(`${this.errors.length} assets failed to load:`, this.errors);
            }
            
            // Calculate statistics
            const stats = {
                totalTime: totalTime,
                totalAssets: this.totalAssets,
                errors: this.errors.length,
                loadTimes: this.assetLoadTimes
            };
            
            this.onComplete(stats);
        }
    }

    // Start preloading with callbacks
    preload(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.loadingStartTime = performance.now();
        
        // If no assets to load, complete immediately
        if (this.totalAssets === 0) {
            if (onComplete) setTimeout(() => onComplete({ totalTime: 0, totalAssets: 0, errors: 0 }), 0);
            return;
        }
        
        // Start processing the queue
        this._processQueue();
    }
    
    // Get a loaded asset
    getImage(key) {
        return this.images[key] || null;
    }
    
    getSound(key) {
        return this.sounds[key] || null;
    }
    
    // Check if all images needed for a specific level are loaded
    hasLevelAssets(levelNumber) {
        // Implementation depends on your level structure
        return true;
    }
}

// Create global instance
window.assetLoader = new AssetLoader();
