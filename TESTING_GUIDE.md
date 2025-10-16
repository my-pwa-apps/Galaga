# 🧪 Galaga Modular Version - Testing Guide

## 🚀 Quick Start

1. Open `index.html` in a modern web browser
2. Check browser console (F12) for initialization messages
3. You should see these messages:
   ```
   🎮 Initializing Galaga game...
   ✅ Renderer initialized (480x640)
   ✅ Audio Engine initialized
   ✅ Graphics Optimizer initialized - Quality: high
   ✅ Object pools initialized (bullets: 50, enemy bullets: 100, particles: 250)
   ✅ Enemy Manager initialized
   ✅ Powerup Manager initialized
   🔥 Initializing Firebase Service...
   ✅ Firebase Service initialized successfully
   Firebase: 🟢 ONLINE
   ✅ Input Manager initialized (touch: false)
   Formation setup: 32 spots
   📊 Loaded X high scores
   ✅ Game initialized successfully!
   ```

## ✅ Visual Verification

### Splash Screen
- [ ] "GALAGA" title displays in large text
- [ ] "PRESS SPACE TO START" shows
- [ ] High scores display (if any exist)
- [ ] Starfield scrolls smoothly in background
- [ ] No console errors

### Gameplay
- [ ] Player ship renders at bottom center (white triangle)
- [ ] Enemies spawn in formation at top
- [ ] Enemies perform entrance animations (curved paths)
- [ ] Press LEFT/RIGHT arrow - ship moves smoothly
- [ ] Press SPACE - ship shoots yellow bullets upward
- [ ] Enemies shoot red bullets downward
- [ ] Collisions register (bullets hit enemies)
- [ ] Particles explode on hits (colored dots)
- [ ] Score increases when enemies destroyed
- [ ] Score, Level, Lives display in top-left corner

### Alien Types
All 8 types should appear and animate correctly:
1. **Bee** - Yellow with black stripes, wings flap
2. **Butterfly** - Pink/magenta with white wing spots
3. **Boss** - Cyan with pincers, pulsing body
4. **Scorpion** - Orange with animated tail
5. **Moth** - Gray with white spots, flutter motion
6. **Dragonfly** - Green/cyan with 4 wings, segmented
7. **Wasp** - Black/yellow stripes, glowing stinger
8. **Beetle** - Purple armored shell, 6 legs

### Attack Patterns
Enemies should perform 3 different attack patterns:
1. **Dive** - Sinusoidal dive toward player
2. **Swoop** - Arc across screen
3. **Loop** - Looping spiral pattern

### Powerups
- [ ] Powerups drop from destroyed enemies (~10% chance)
- [ ] Powerups are colored squares with symbols:
  - **Green "x2"** - Double shot
  - **Yellow ">>"** - Rapid fire
  - **Cyan "S"** - Shield
  - **Red "+"** - Extra life
- [ ] Powerups rotate as they fall
- [ ] Collecting powerup plays sound and applies effect
- [ ] Powerup timer bar shows in top-left when active

## 🎵 Audio Testing

Open console and manually trigger sounds:
```javascript
AudioEngine.playerShoot()    // High-pitched "pew"
AudioEngine.enemyShoot()     // Lower "zap"
AudioEngine.explosion()      // Noise explosion
AudioEngine.hit()            // Quick hit sound
AudioEngine.bulletHit()      // Bullet collision
AudioEngine.powerup()        // Ascending arpeggio
AudioEngine.playerDeath()    // Descending sweep
AudioEngine.levelComplete()  // Victory fanfare
AudioEngine.menuSelect()     // UI beep
AudioEngine.shieldHit()      // Shield impact
```

## 🔥 Firebase Testing

### High Scores
1. Play game and get a score
2. When game over, check if "NEW HIGH SCORE!" appears
3. Enter name (if prompted)
4. Check Firebase console: https://console.firebase.google.com/
5. Navigate to: Realtime Database → galaga-e7527 → highScores
6. Verify entry appears

### Connection Status
```javascript
FirebaseService.getConnectionStatus()
// Should return: { isConnected: true, hasDatabase: true }
```

## 📱 Mobile Testing

On a mobile device or using browser dev tools mobile emulation:
1. Touch controls should appear at bottom
2. Left/Right buttons move ship
3. Fire button shoots
4. Auto-shoot toggle (icon on right)
5. Buttons highlight when pressed

## 🎮 Gameplay Testing Checklist

### Level 1
- [ ] 6-8 enemies spawn
- [ ] Only bee and butterfly types appear
- [ ] Enemies attack occasionally
- [ ] Difficulty feels appropriate for beginners

### Level 2+
- [ ] More enemy types unlock
- [ ] More enemies spawn per wave
- [ ] Attack frequency increases
- [ ] Bullet speed increases

### Collision Detection
- [ ] Player bullets hit enemies
- [ ] Enemy bullets hit player
- [ ] Bullets can destroy other bullets
- [ ] Powerups can be collected
- [ ] Enemy collision with player damages

### Lives System
- [ ] Start with 3 lives
- [ ] Lose life when hit
- [ ] Game over at 0 lives
- [ ] Health powerup adds life (max 5)

### Shield Powerup
- [ ] Blue circle appears around ship
- [ ] Enemy bullets bounce off
- [ ] Timer bar depletes
- [ ] Shield expires after ~12 seconds

### Double Shot
- [ ] Two bullets fire simultaneously
- [ ] Spread apart slightly
- [ ] Timer bar shows
- [ ] Expires after ~10 seconds

### Rapid Fire
- [ ] Shooting cooldown reduced
- [ ] Can spam space bar
- [ ] Timer bar shows
- [ ] Expires after ~8 seconds

## ⚡ Performance Testing

### Check FPS
```javascript
GraphicsOptimizer.getFPS()      // Current FPS
GraphicsOptimizer.getAvgFPS()   // Average FPS
```

Should maintain:
- **Desktop**: 55-60 FPS
- **Mobile**: 30-60 FPS (depends on device)

### Check Memory
```javascript
ObjectPool.getStats()
// Should show active/available counts for:
// - bullets
// - enemyBullets  
// - particles
```

### Stress Test
1. Get to level 5+
2. Let many enemies accumulate
3. Shoot rapidly
4. Multiple explosions at once
5. FPS should stay above 30

## 🐛 Common Issues & Fixes

### No Enemies Spawn
- Check console for errors
- Verify `EnemyManager.init()` was called
- Check `EnemyManager.formationSpots` has 32 spots

### No Sound
- Click/tap screen first (browsers require user interaction)
- Check `AudioEngine.enabled` is true
- Check browser audio isn't muted
- Try: `AudioEngine.resume()`

### Firebase Offline
- Check internet connection
- Firebase may show 🔴 OFFLINE initially, then 🟢 ONLINE
- High scores will still work from cache/localStorage

### Touch Controls Not Showing
- Only appears on touch devices
- Check: `InputManager.isTouchDevice` is true
- Try: `InputManager.shouldShowTouchControls()`

### Graphics Slow
- Adaptive quality should kick in
- Check: `GraphicsOptimizer.qualityLevel`
- Manually set: `GraphicsOptimizer.qualityLevel = 'low'`

### Module Load Errors
- Check all 13 files exist in `js/` folder
- Check console for 404 errors
- Verify file names match exactly (case-sensitive)

## 🔍 Debug Commands

Open browser console and try these:

```javascript
// Check game state
GameState.score
GameState.level
GameState.lives
GameState.enemies.length

// Check configuration
GameConfig.CANVAS_WIDTH
GameConfig.PLAYER.SPEED
GameConfig.ENEMIES.bee

// Cheat: Add lives
GameState.lives = 99

// Cheat: Skip to level 5
GameState.level = 5

// Cheat: Add score
GameState.score += 10000

// Check module status
typeof GalagaGame      // Should be 'object'
typeof AudioEngine     // Should be 'object'
typeof Renderer        // Should be 'object'

// Performance stats
GraphicsOptimizer.getAvgFPS()
ObjectPool.getStats()
```

## 📊 Success Criteria

The modular version is working correctly if:
- ✅ All modules load without errors
- ✅ Game initializes and shows splash screen
- ✅ Gameplay is smooth (30+ FPS)
- ✅ All 8 alien types render correctly
- ✅ Sound effects play
- ✅ Collision detection works
- ✅ Powerups work
- ✅ Score/lives/level track correctly
- ✅ Firebase connects (or falls back gracefully)
- ✅ Touch controls work on mobile
- ✅ Difficulty scales across levels
- ✅ Game over triggers correctly
- ✅ Original Galaga feel is preserved!

## 🎯 Comparison Test

If you still have the original `game.js`:
1. Create `index-old.html` pointing to old `game.js`
2. Create `index-new.html` pointing to modular version
3. Play both side-by-side
4. Verify identical gameplay experience

## 📝 Test Report Template

```
=== GALAGA MODULAR VERSION TEST REPORT ===

Date: [DATE]
Browser: [Chrome/Firefox/Safari/Edge]
Device: [Desktop/Mobile]

MODULE LOADING:
[ ] All 13 modules loaded
[ ] No console errors
[ ] Firebase initialized

GAMEPLAY:
[ ] Player ship renders
[ ] Enemies spawn
[ ] Shooting works
[ ] Collisions work
[ ] Particles render

AUDIO:
[ ] All sounds play
[ ] No audio glitches

PERFORMANCE:
[ ] FPS: ___
[ ] No lag
[ ] No memory leaks

FIREBASE:
[ ] High scores load
[ ] High scores save
[ ] Connection stable

MOBILE (if applicable):
[ ] Touch controls work
[ ] Responsive layout
[ ] Playable on device

ISSUES FOUND:
[List any issues]

OVERALL: PASS / FAIL
```

---

**Happy Testing! 🎮✨**

If everything works, you've successfully modernized a 3,955-line monolith into a clean, maintainable 13-module architecture while preserving the classic arcade experience!
