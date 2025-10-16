# Firebase Integration Documentation

## 🔥 Overview

The Galaga game uses **Firebase Realtime Database** for persistent data storage, including high scores, player statistics, game settings, and achievements. The integration is handled through a centralized `FirebaseService` object that provides a clean API for all Firebase operations.

---

## 📊 Database Structure

```
galaga-database/
├── highScores/
│   ├── {scoreId1}/
│   │   ├── name: "ABC"
│   │   ├── score: 15000
│   │   ├── level: 10
│   │   ├── timestamp: 1697500000000
│   │   └── stats/
│   │       ├── enemiesDestroyed: 120
│   │       ├── accuracy: 65.5
│   │       ├── powerupsCollected: 8
│   │       └── survivalTime: 450
│   └── {scoreId2}/...
│
├── playerStats/
│   ├── {sessionId1}/
│   │   ├── sessionId: "session_1697500000000_abc123"
│   │   ├── timestamp: 1697500000000
│   │   ├── score: 12000
│   │   ├── level: 8
│   │   ├── lives: 0
│   │   ├── enemiesDestroyed: 95
│   │   ├── shotsFired: 200
│   │   ├── shotsHit: 130
│   │   ├── accuracy: 65.0
│   │   ├── powerupsCollected: 6
│   │   ├── survivalTime: 380
│   │   └── difficulty: "normal"
│   └── {sessionId2}/...
│
├── settings/
│   ├── {userId1}/
│   │   ├── soundEnabled: true
│   │   ├── musicEnabled: true
│   │   ├── difficulty: "normal"
│   │   ├── graphicsQuality: "high"
│   │   ├── touchControls: true
│   │   └── lastUpdated: 1697500000000
│   └── {userId2}/...
│
└── achievements/
    ├── {userId1}/
    │   ├── {achievementId1}/
    │   │   ├── name: "First Kill"
    │   │   ├── description: "Destroy your first enemy"
    │   │   ├── unlockedAt: 1697500000000
    │   │   └── value: 10
    │   └── {achievementId2}/...
    └── {userId2}/...
```

---

## 🛠️ FirebaseService API

### Initialization

#### `FirebaseService.init()`
Initializes the Firebase connection and sets up monitoring.

```javascript
FirebaseService.init();
// Returns: true (success) or false (failure)
```

**Features:**
- Checks for Firebase SDK availability
- Initializes Firebase app with config
- Sets up connection monitoring
- Handles errors gracefully

**Console Output:**
- `🔥 Initializing Firebase Service...`
- `✅ Firebase Service initialized successfully`
- `❌ Firebase initialization failed: {error}`

---

### High Scores Management

#### `FirebaseService.fetchHighScores()`
Fetches the top high scores from the database.

```javascript
const scores = await FirebaseService.fetchHighScores();
```

**Returns:** Array of score objects
```javascript
[
  {
    id: "scoreId123",
    name: "ABC",
    score: 15000,
    level: 10,
    timestamp: 1697500000000,
    stats: {
      enemiesDestroyed: 120,
      accuracy: 65.5,
      powerupsCollected: 8,
      survivalTime: 450
    }
  },
  ...
]
```

**Features:**
- Automatically sorted by score (highest first)
- Limited to top 10 scores (configurable via `MAX_HIGH_SCORES`)
- Cached for offline access
- Handles connection failures gracefully

---

#### `FirebaseService.submitHighScore(name, score, level, stats)`
Submits a new high score to the database.

```javascript
await FirebaseService.submitHighScore('ABC', 15000, 10, {
  enemiesDestroyed: 120,
  accuracy: 65.5,
  powerupsCollected: 8,
  survivalTime: 450
});
```

**Parameters:**
- `name` (string): Player name (3-5 characters)
- `score` (number): Final score
- `level` (number): Level reached
- `stats` (object): Game statistics

**Features:**
- Automatically cleans up old scores
- Refreshes high scores cache
- Validates and sanitizes data
- Returns `true` on success, `false` on failure

---

#### `FirebaseService.cleanupHighScores()`
Removes scores beyond the top 10 to keep database clean.

```javascript
await FirebaseService.cleanupHighScores();
```

**Features:**
- Automatically called after submitting new score
- Keeps only `MAX_HIGH_SCORES` entries
- Sorts by score before cleanup
- Logs cleanup operations

---

### Player Statistics

#### `FirebaseService.savePlayerStats(sessionId, stats)`
Saves detailed statistics for a game session.

```javascript
await FirebaseService.savePlayerStats('session_1697500000000_abc123', {
  score: 12000,
  level: 8,
  lives: 0,
  enemiesDestroyed: 95,
  shotsFired: 200,
  shotsHit: 130,
  powerupsCollected: 6,
  survivalTime: 380,
  difficulty: 'normal'
});
```

**Parameters:**
- `sessionId` (string): Unique session identifier
- `stats` (object): Detailed game statistics

**Tracked Statistics:**
- `score`: Final score
- `level`: Level reached
- `lives`: Lives remaining
- `enemiesDestroyed`: Total enemies destroyed
- `shotsFired`: Total shots fired
- `shotsHit`: Shots that hit enemies
- `accuracy`: Calculated accuracy percentage
- `powerupsCollected`: Powerups collected
- `survivalTime`: Total game time in seconds
- `difficulty`: Game difficulty level

---

#### `FirebaseService.getPlayerStats(limit)`
Retrieves recent player statistics.

```javascript
const stats = await FirebaseService.getPlayerStats(10);
```

**Parameters:**
- `limit` (number, default: 10): Number of stats to retrieve

**Returns:** Array of stats objects sorted by timestamp (most recent first)

---

### Game Settings

#### `FirebaseService.saveSettings(userId, settings)`
Saves user preferences and settings.

```javascript
await FirebaseService.saveSettings('user123', {
  soundEnabled: true,
  musicEnabled: false,
  difficulty: 'hard',
  graphicsQuality: 'medium',
  touchControls: true
});
```

**Features:**
- Falls back to localStorage if Firebase unavailable
- Timestamps all settings updates
- Persists across sessions and devices

---

#### `FirebaseService.loadSettings(userId)`
Loads user settings from database or localStorage.

```javascript
const settings = await FirebaseService.loadSettings('user123');
```

**Returns:** Settings object or `null` if not found

**Fallback:** Automatically uses localStorage if Firebase unavailable

---

### Achievements System

#### `FirebaseService.unlockAchievement(userId, achievementId, achievementData)`
Unlocks an achievement for a user.

```javascript
await FirebaseService.unlockAchievement('user123', 'first_kill', {
  name: 'First Kill',
  description: 'Destroy your first enemy',
  value: 10
});
```

**Console Output:**
- `🏆 Achievement unlocked: first_kill`

---

#### `FirebaseService.getUserAchievements(userId)`
Retrieves all achievements for a user.

```javascript
const achievements = await FirebaseService.getUserAchievements('user123');
```

**Returns:** Array of achievement objects with unlock timestamps

---

### Utility Methods

#### `FirebaseService.generateSessionId()`
Generates a unique session identifier.

```javascript
const sessionId = FirebaseService.generateSessionId();
// Returns: "session_1697500000000_abc123def"
```

**Format:** `session_{timestamp}_{random}`

---

#### `FirebaseService.getConnectionStatus()`
Checks Firebase connection status.

```javascript
const status = FirebaseService.getConnectionStatus();
// Returns: { isConnected: true, hasDatabase: true }
```

---

#### `FirebaseService.clearCache()`
Clears all cached data.

```javascript
FirebaseService.clearCache();
```

**Console Output:**
- `🧹 Firebase cache cleared`

---

## 📈 Game Statistics Tracking

The game automatically tracks comprehensive statistics during gameplay:

### Tracked Metrics

```javascript
window.gameStats = {
  enemiesDestroyed: 0,      // Total enemies killed
  shotsFired: 0,             // Total shots fired
  shotsHit: 0,               // Shots that hit enemies
  powerupsCollected: 0,      // Powerups collected
  survivalTime: 0,           // Time played in seconds
  accuracy: 0,               // Hit percentage (calculated)
  gameStartTime: 0           // Game start timestamp
};
```

### Automatic Tracking

**When player shoots:**
```javascript
window.gameStats.shotsFired++;
```

**When bullet hits enemy:**
```javascript
window.gameStats.shotsHit++;
```

**When enemy destroyed:**
```javascript
window.gameStats.enemiesDestroyed++;
```

**When powerup collected:**
```javascript
window.gameStats.powerupsCollected++;
```

**Every frame during gameplay:**
```javascript
window.gameStats.survivalTime = (Date.now() - window.gameStats.gameStartTime) / 1000;
window.gameStats.accuracy = ((window.gameStats.shotsHit / window.gameStats.shotsFired) * 100).toFixed(1);
```

---

## 🔄 Backward Compatibility

Legacy code compatibility is maintained through global variables:

```javascript
let database = FirebaseService.db;           // Legacy database reference
let firebaseHighScores = [];                 // Legacy high scores array
const MAX_HIGH_SCORES = 10;                  // Legacy constant
```

**Legacy functions** are updated to use the new service:

```javascript
async function fetchHighScores() {
  const scores = await FirebaseService.fetchHighScores();
  firebaseHighScores = scores;
}

async function submitHighScore() {
  await FirebaseService.submitHighScore(name, score, level, gameStats);
}
```

---

## 🌐 Connection Monitoring

Firebase connection status is monitored in real-time:

```javascript
FirebaseService.setupConnectionMonitoring();
```

**Console Output:**
- `Firebase: 🟢 ONLINE` - Connected to Firebase
- `Firebase: 🔴 OFFLINE` - Disconnected from Firebase

**Features:**
- Real-time connection state tracking
- Automatic reconnection attempts
- Graceful offline degradation
- Cached data available when offline

---

## 💾 Data Persistence

### Online Mode
- All data synced to Firebase Realtime Database
- Instant updates across sessions
- Global leaderboard functionality
- Cross-device synchronization

### Offline Mode
- High scores cached in memory
- Settings stored in localStorage
- Stats not saved (requires connection)
- Seamless transition when connection restored

---

## 🔒 Security Rules (Recommended)

Configure Firebase Security Rules for production:

```json
{
  "rules": {
    "highScores": {
      ".read": true,
      ".write": true,
      ".indexOn": ["score", "timestamp"]
    },
    "playerStats": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp"]
    },
    "settings": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "achievements": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

---

## 🎯 Usage Examples

### Complete Game Flow

```javascript
// 1. Initialize Firebase on game start
FirebaseService.init();
window.currentSessionId = FirebaseService.generateSessionId();

// 2. Load high scores for splash screen
const highScores = await FirebaseService.fetchHighScores();

// 3. Track stats during gameplay
// (automatic via window.gameStats)

// 4. Submit high score on game over
await FirebaseService.submitHighScore(
  playerName,
  score,
  level,
  window.gameStats
);

// 5. Save detailed session stats
await FirebaseService.savePlayerStats(
  window.currentSessionId,
  {
    score: score,
    level: level,
    lives: lives,
    ...window.gameStats
  }
);
```

---

## 🐛 Error Handling

All Firebase operations include comprehensive error handling:

```javascript
try {
  await FirebaseService.submitHighScore(name, score, level, stats);
} catch (error) {
  console.error('Error submitting high score:', error);
  // Game continues normally, data cached locally
}
```

**Features:**
- Graceful degradation
- Console logging for debugging
- No game crashes on Firebase errors
- Automatic fallback to local storage

---

## 📊 Performance Considerations

### Caching Strategy
- High scores cached for 5 minutes (`CACHE_DURATION`)
- Settings cached until next load
- Stats cached during session
- Reduces database reads significantly

### Cleanup Operations
- Automatic cleanup of old high scores
- Maximum 100 stats records per player
- Periodic cache clearing
- Efficient indexing for queries

### Optimization Tips
1. Use `once()` instead of `on()` for single reads
2. Limit query results with `.limitToLast()`
3. Index frequently queried fields
4. Batch write operations when possible
5. Cache data in memory to reduce reads

---

## 🎮 Future Enhancements

Planned features for Firebase integration:

1. **User Authentication**
   - Anonymous auth for guest players
   - Social login (Google, Facebook)
   - Persistent user IDs

2. **Real-time Multiplayer**
   - Firebase Realtime Database for game state
   - Player presence detection
   - Live leaderboard updates

3. **Cloud Functions**
   - Server-side score validation
   - Anti-cheat mechanisms
   - Automated data cleanup

4. **Analytics**
   - Firebase Analytics integration
   - Player behavior tracking
   - A/B testing capabilities

5. **Notifications**
   - Achievement unlock notifications
   - New high score alerts
   - Daily challenge reminders

---

## 🔑 Configuration

Current Firebase configuration (stored in `FirebaseService.config`):

```javascript
{
  apiKey: "AIzaSyB6VUKC89covzLlhUO7UMeILVCJVy1SPdc",
  authDomain: "galaga-e7527.firebaseapp.com",
  databaseURL: "https://galaga-e7527-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "galaga-e7527",
  storageBucket: "galaga-e7527.appspot.com",
  messagingSenderId: "983420615265",
  appId: "1:983420615265:web:77861c68c1b93f92dd4820",
  measurementId: "G-R9Z2YFQ30C"
}
```

**Note:** API key is intentionally exposed for client-side Firebase. Use Security Rules to protect data.

---

## 📱 Console Commands

Useful debug commands available in browser console:

```javascript
// Check connection status
FirebaseService.getConnectionStatus();

// Clear cache
FirebaseService.clearCache();

// View cached high scores
console.log(FirebaseService.cache.highScores);

// View current game stats
console.log(window.gameStats);

// Generate new session ID
FirebaseService.generateSessionId();
```

---

## ✅ Testing Checklist

- [ ] Firebase initializes successfully
- [ ] High scores fetch correctly
- [ ] New scores submit and appear in leaderboard
- [ ] Old scores cleanup after submission
- [ ] Stats tracking works during gameplay
- [ ] Session stats save on game over
- [ ] Connection monitoring responds to network changes
- [ ] Offline mode falls back gracefully
- [ ] Settings persist across sessions
- [ ] Achievements unlock properly

---

**Last Updated:** October 16, 2025  
**Firebase SDK Version:** 8.10.0  
**Database Region:** europe-west1
