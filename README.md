# 🚀 Galaga Arcade Tribute

A fully-featured, arcade-style Galaga tribute game built with HTML5 Canvas and vanilla JavaScript. Features advanced graphics optimization, progressive difficulty, and Firebase integration for global high scores.

## 🎮 Features

### Core Gameplay
- **Classic Galaga Mechanics**: Formation-based enemies, dive attacks, and bullet patterns
- **Progressive Difficulty System**: New enemy types unlock as you advance through levels
- **5 Unique Enemy Types**:
  - 🐝 **Bee**: Fast and nimble
  - 🦋 **Butterfly**: Medium difficulty with erratic patterns
  - 🦂 **Scorpion**: Aggressive with rapid fire
  - 🦟 **Moth**: Unpredictable movement
  - 👾 **Boss**: Large, powerful, and tough

### Advanced Features
- **Smooth Enemy AI**: Bezier curve entrance animations, formation patterns, and intelligent dive attacks
- **Powerup System**: 
  - Double Shot (x2 bullets)
  - Speed Boost (faster movement & firing)
  - Shield (temporary invincibility)
  - Extra Life (+1 health)
- **Particle Effects**: Explosions, hit effects, and screen shake
- **Animated Sprites**: All enemies hand-coded with CSS-style animations
- **Touch Controls**: Full mobile/tablet support with on-screen buttons
- **Firebase Integration**: Global high score leaderboard

### Graphics Optimization
- **Adaptive Quality System**: Automatically adjusts graphics quality based on device performance
- **Object Pooling**: Efficient memory management for bullets and particles
- **Batched Rendering**: Optimized drawing for better FPS
- **Performance Monitoring**: Real-time FPS tracking and quality adjustment
- **3-Layer Parallax Starfield**: Smooth scrolling background

## 🎯 How to Play

### Desktop Controls
- **Arrow Keys** or **A/D**: Move left/right
- **Spacebar**: Fire bullets
- **P**: Pause/Resume
- **Enter**: Start game / Submit high score

### Mobile/Touch Controls
- **< / >**: Movement buttons
- **O**: Fire button
- **AUTO**: Toggle auto-fire mode

## 🛠️ Technical Details

### Architecture
- **State Machine**: Clean game state management (Splash, Playing, Paused, Game Over, High Score Entry)
- **Manager Pattern**: Separate managers for enemies, powerups, and graphics
- **Canvas 2D API**: Pure JavaScript with no external game libraries
- **Firebase Realtime Database**: Cloud-based high score storage

### Performance
- **60 FPS Target**: Adaptive quality system maintains smooth gameplay
- **Object Pooling**: Pre-allocated objects prevent garbage collection stutters
- **Delta Time**: Frame-rate independent movement and animations
- **Viewport Culling**: Efficient off-screen object management

### Code Quality
- **Modular Design**: Separated concerns with dedicated managers
- **Extensive Comments**: Well-documented code throughout
- **Error Handling**: Graceful degradation if Firebase is unavailable
- **Cross-Browser**: Works on modern browsers (Chrome, Firefox, Safari, Edge)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/galaga.git
cd galaga
```

2. Serve the files with any HTTP server:
```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000

# VS Code Live Server
# Right-click index.html > Open with Live Server
```

3. Open your browser to `http://localhost:8000`

## 🔧 Configuration

### Firebase Setup (Optional)
To enable global high scores:

1. Create a Firebase project at https://firebase.google.com
2. Enable Realtime Database
3. Replace the `firebaseConfig` in `game.js` with your credentials:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    databaseURL: "https://your-app.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Graphics Quality
The game automatically adjusts quality, but you can force a specific quality level:
```javascript
// In browser console:
GraphicsOptimizer.setLowQualityPreset();
GraphicsOptimizer.setMediumQualityPreset();
GraphicsOptimizer.setHighQualityPreset();
```

## 🎨 Customization

### Adding New Enemy Types
1. Add a drawing function to `AlienSprites`:
```javascript
drawNewEnemy(ctx, x, y, time, scale = 1, attacking = false) {
    // Your drawing code here
}
```

2. Add enemy type to `EnemyManager.types`
3. Add properties to `EnemyManager.getEnemyProperties()`
4. Add to `getAvailableTypes()` for progressive unlocking

### Tweaking Difficulty
Adjust progression in `EnemyManager.getEnemyProperties()`:
```javascript
const levelMultiplier = 1 + (level - 1) * 0.1; // Slower: 0.05, Faster: 0.2
```

## 📊 Game Stats

You can view performance metrics in the console:
```javascript
window.showGraphicsPerformance();
```

Shows:
- Quality Level
- Average FPS
- Frame time
- Cache sizes
- Rendering efficiency

## 🐛 Known Issues / Future Enhancements

### Potential Improvements
- [ ] Add sound effects and background music
- [ ] Challenge stages (no enemies, collect bonus items)
- [ ] Boss Galaga tractor beam mechanic
- [ ] Dual ship mode (captured ship rescue)
- [ ] More complex attack patterns
- [ ] Achievement system
- [ ] Combo multipliers
- [ ] Weapon upgrades beyond powerups

### Browser Compatibility
- Requires modern browser with ES6 support
- Touch events require touch-capable device
- Firebase requires network connectivity

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Credits

- Inspired by the classic Namco Galaga arcade game (1981)
- Built as a learning project to demonstrate:
  - Canvas 2D API mastery
  - Game architecture patterns
  - Performance optimization techniques
  - Firebase integration

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

**Made with ❤️ and JavaScript** | [Play Now](index.html) | [View Source](game.js)
