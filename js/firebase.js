// ============================================
// FIREBASE SERVICE
// High scores, statistics, cloud storage
// ============================================

const FirebaseService = {
    // Configuration
    config: {
        apiKey: "AIzaSyB6VUKC89covzLlhUO7UMeILVCJVy1SPdc",
        authDomain: "galaga-e7527.firebaseapp.com",
        databaseURL: "https://galaga-e7527-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "galaga-e7527",
        storageBucket: "galaga-e7527.appspot.com",
        messagingSenderId: "983420615265",
        appId: "1:983420615265:web:77861c68c1b93f92dd4820",
        measurementId: "G-R9Z2YFQ30C"
    },
    
    db: null,
    isConnected: false,
    
    cache: {
        highScores: [],
        playerStats: null,
        gameSettings: null,
        achievements: []
    },
    
    MAX_HIGH_SCORES: 10,
    
    // Initialize Firebase
    init() {
        console.log('🔥 Initializing Firebase Service...');
        
        try {
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }
            
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(this.config);
            }
            
            this.db = firebase.database();
            this.isConnected = true;
            
            this.setupConnectionMonitoring();
            
            console.log('✅ Firebase Service initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.isConnected = false;
            this.db = null;
            return false;
        }
    },
    
    // Monitor connection status
    setupConnectionMonitoring() {
        if (!this.db) return;
        
        const connectedRef = this.db.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            this.isConnected = snapshot.val() === true;
            console.log(`Firebase: ${this.isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
        });
    },
    
    // Fetch high scores
    async fetchHighScores() {
        if (!this.db) {
            console.warn('Database not available, using cached high scores');
            return this.cache.highScores;
        }
        
        try {
            const snapshot = await this.db.ref('highScores')
                .orderByChild('score')
                .limitToLast(this.MAX_HIGH_SCORES)
                .once('value');
            
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            scores.reverse();
            this.cache.highScores = scores;
            console.log(`✅ Fetched ${scores.length} high scores`);
            
            return scores;
            
        } catch (error) {
            console.error('Error fetching high scores:', error);
            return this.cache.highScores;
        }
    },
    
    // Submit high score
    async submitHighScore(name, score, level, stats = {}) {
        if (!this.db) {
            console.warn('Database not available, high score not saved');
            return false;
        }
        
        try {
            const scoreData = {
                name: name.toUpperCase().trim() || 'AAA',
                score: score,
                level: level,
                timestamp: Date.now(),
                stats: {
                    enemiesDestroyed: stats.enemiesDestroyed || 0,
                    accuracy: stats.accuracy || 0,
                    powerupsCollected: stats.powerupsCollected || 0,
                    survivalTime: stats.survivalTime || 0
                }
            };
            
            const newScoreRef = this.db.ref('highScores').push();
            await newScoreRef.set(scoreData);
            
            console.log('✅ High score saved:', scoreData);
            
            await this.cleanupHighScores();
            await this.fetchHighScores();
            
            return true;
            
        } catch (error) {
            console.error('Error submitting high score:', error);
            return false;
        }
    },
    
    // Cleanup old scores
    async cleanupHighScores() {
        if (!this.db) return;
        
        try {
            const snapshot = await this.db.ref('highScores')
                .orderByChild('score')
                .once('value');
            
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push({
                    id: childSnapshot.key,
                    score: childSnapshot.val().score
                });
            });
            
            scores.sort((a, b) => b.score - a.score);
            
            if (scores.length > this.MAX_HIGH_SCORES) {
                const toRemove = scores.slice(this.MAX_HIGH_SCORES);
                const removePromises = toRemove.map(item => 
                    this.db.ref(`highScores/${item.id}`).remove()
                );
                await Promise.all(removePromises);
                console.log(`🧹 Cleaned up ${toRemove.length} old high scores`);
            }
            
        } catch (error) {
            console.error('Error cleaning up high scores:', error);
        }
    },
    
    // Save player statistics
    async savePlayerStats(sessionId, stats) {
        if (!this.db) return false;
        
        try {
            const statsData = {
                sessionId: sessionId,
                timestamp: Date.now(),
                score: stats.score || 0,
                level: stats.level || 1,
                lives: stats.lives || 0,
                enemiesDestroyed: stats.enemiesDestroyed || 0,
                shotsFired: stats.shotsFired || 0,
                shotsHit: stats.shotsHit || 0,
                accuracy: stats.shotsFired > 0 ? 
                    ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1) : 0,
                powerupsCollected: stats.powerupsCollected || 0,
                survivalTime: stats.survivalTime || 0,
                difficulty: stats.difficulty || 'normal'
            };
            
            await this.db.ref(`playerStats/${sessionId}`).set(statsData);
            console.log('✅ Player stats saved');
            
            return true;
            
        } catch (error) {
            console.error('Error saving player stats:', error);
            return false;
        }
    },
    
    // Get player statistics
    async getPlayerStats(limit = 10) {
        if (!this.db) return [];
        
        try {
            const snapshot = await this.db.ref('playerStats')
                .orderByChild('timestamp')
                .limitToLast(limit)
                .once('value');
            
            const stats = [];
            snapshot.forEach((childSnapshot) => {
                stats.push(childSnapshot.val());
            });
            
            stats.reverse();
            this.cache.playerStats = stats;
            
            return stats;
            
        } catch (error) {
            console.error('Error fetching player stats:', error);
            return this.cache.playerStats || [];
        }
    },
    
    // Save game settings
    async saveSettings(userId, settings) {
        if (!this.db) {
            localStorage.setItem('galaga_settings', JSON.stringify(settings));
            return false;
        }
        
        try {
            await this.db.ref(`settings/${userId}`).set({
                ...settings,
                lastUpdated: Date.now()
            });
            
            console.log('✅ Settings saved');
            return true;
            
        } catch (error) {
            console.error('Error saving settings:', error);
            localStorage.setItem('galaga_settings', JSON.stringify(settings));
            return false;
        }
    },
    
    // Load game settings
    async loadSettings(userId) {
        if (!this.db) {
            const stored = localStorage.getItem('galaga_settings');
            return stored ? JSON.parse(stored) : null;
        }
        
        try {
            const snapshot = await this.db.ref(`settings/${userId}`).once('value');
            const settings = snapshot.val();
            
            if (settings) {
                this.cache.gameSettings = settings;
            }
            
            return settings;
            
        } catch (error) {
            console.error('Error loading settings:', error);
            const stored = localStorage.getItem('galaga_settings');
            return stored ? JSON.parse(stored) : null;
        }
    },
    
    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            hasDatabase: this.db !== null
        };
    },
    
    // Clear cache
    clearCache() {
        this.cache = {
            highScores: [],
            playerStats: null,
            gameSettings: null,
            achievements: []
        };
        console.log('🧹 Firebase cache cleared');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseService;
}
