# 🚀 Quick Start Guide - Galaga Arcade Game

## ⚡ 60-Second Setup

### Option 1: Open Directly (Recommended)
1. Open `index.html` in your browser
2. Press **SPACE** to start playing!

### Option 2: Local Server (For Firebase)
```powershell
# PowerShell (Windows)
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Galaga"
python -m http.server 8000
# Open browser to: http://localhost:8000
```

```bash
# Linux/Mac
cd path/to/Galaga
python3 -m http.server 8000
# Open browser to: http://localhost:8000
```

---

## 🎮 Controls

### Desktop
- **← →** : Move left/right
- **SPACE** : Fire bullets
- **P** : Pause game
- **ENTER** : Start / Submit high score

### Mobile/Tablet
- **< >** : Move buttons (on-screen)
- **O** : Fire button
- **AUTO** : Toggle auto-fire

---

## 🎯 Game Objectives

1. **Destroy all enemies** to advance levels
2. **Dodge enemy bullets** and dive attacks
3. **Collect powerups** for temporary abilities
4. **Survive as long as possible** for high score

---

## 🏆 Scoring

| Enemy Type | Points | Unlocks |
|-----------|-------:|--------:|
| 🐝 Bee | 100 | Level 1 |
| 🦋 Butterfly | 200 | Level 2 |
| 🦂 Scorpion | 250 | Level 3 |
| 🦟 Moth | 150 | Level 5 |
| 👾 Boss | 500 | Level 7 |
| 💎 Powerup | +50 | Always |

---

## ⚡ Powerups

| Icon | Name | Effect | Duration |
|------|------|--------|----------|
| **x2** (Green) | Double Shot | Fire 2 bullets | 10s |
| **>>** (Yellow) | Speed Boost | Faster movement | 10s |
| **S** (Cyan) | Shield | Invincibility | 15s |
| **+** (Red) | Extra Life | +1 life | Instant |

---

## 📊 Tips for High Scores

1. **Stay Mobile** - Keep moving to dodge bullets
2. **Prioritize Bosses** - Worth 5x normal enemies
3. **Collect Powerups** - Free points + abilities
4. **Learn Patterns** - Enemies telegraph attacks
5. **Use Shield Wisely** - Don't waste on easy enemies

---

## 🐛 Troubleshooting

### Game Won't Start
- ✅ Check browser console (F12) for errors
- ✅ Make sure JavaScript is enabled
- ✅ Try a different browser (Chrome recommended)

### Low FPS
- ✅ Close other browser tabs
- ✅ Game will auto-adjust quality
- ✅ Force low quality: `GraphicsOptimizer.setLowQualityPreset()`

### No Enemies Spawning
- ✅ Wait 2-3 seconds for first wave
- ✅ Check console for JavaScript errors
- ✅ Refresh the page

### Touch Controls Not Working
- ✅ Use a touchscreen device
- ✅ Allow browser to use touch events
- ✅ Tap the canvas area

### High Scores Not Saving
- ✅ Check internet connection
- ✅ Firebase may not be configured
- ✅ Game will work without Firebase

---

## ⚙️ Advanced Options

### Performance Monitoring
```javascript
// In browser console (F12):
window.showGraphicsPerformance();
```

### Force Quality Level
```javascript
// Low quality (best performance)
GraphicsOptimizer.setLowQualityPreset();

// Medium quality (balanced)
GraphicsOptimizer.setMediumQualityPreset();

// High quality (best visuals)
GraphicsOptimizer.setHighQualityPreset();
```

### Adjust Difficulty
Edit `game.js` line ~1940:
```javascript
// Make it easier:
const levelMultiplier = 1 + (level - 1) * 0.05; // 5% instead of 10%

// Make it harder:
const levelMultiplier = 1 + (level - 1) * 0.20; // 20% instead of 10%
```

---

## 🎨 Customization

### Change Player Color
Edit `game.js` line ~2555:
```javascript
ctx.fillStyle = '#00ff00'; // Change to any color
```

### Add More Lives
Edit `game.js` line ~1382:
```javascript
let lives = 5; // Start with 5 lives instead of 3
```

### Faster Powerups
Edit `game.js` line ~2166:
```javascript
spawnInterval: 10, // Spawn every 10s instead of 15s
```

---

## 📱 Mobile Optimization

### Best Results
- Use landscape orientation
- Close background apps
- Tap "AUTO" for continuous fire
- Use headphones (when sound added)

### Performance Issues?
- Lower browser display resolution
- Close other browser tabs
- Restart browser
- Try Chrome (best performance)

---

## 🔥 Pro Tips

### Movement
- **Short taps** for precise positioning
- **Hold keys** for maximum speed
- **Stay centered** to dodge both sides

### Shooting
- **Lead your shots** for moving targets
- **Fire constantly** during boss waves
- **Save ammo** during entrance phase (they can't shoot)

### Strategy
- **Kill attackers first** (diving enemies)
- **Use formation gaps** to predict attacks
- **Retreat when outnumbered** 
- **Push forward with shield** (safe aggression)

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Version History**: See `CHANGELOG.md`
- **Technical Details**: See `SUMMARY.md`
- **Source Code**: See `game.js` (fully commented)

---

## 🎮 Ready to Play?

1. Open `index.html`
2. Press **SPACE**
3. Have fun! 🎉

---

**Need Help?** Check the README.md or open an issue on GitHub.

**Found a Bug?** Please report it with:
- Browser version
- Steps to reproduce
- Console errors (F12)

---

*Made with ❤️ and JavaScript* | **Current Version: 2.0.0**
