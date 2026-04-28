# Changelog

## [2.4.0] - 2026-04-27

### Cloudflare Storage, PWA, and Mobile Controls

#### New Features

**Cloudflare score storage:**
- Added `StorageService` for per-game high scores.
- Added Cloudflare Pages Function endpoint at `/api/scores`.
- Added KV-backed score persistence with localStorage fallback for local play.
- Added server-side validation for game IDs, initials, score ranges, levels, and stats.
- Configured `wrangler.toml` with production and preview `ARCADE_SCORES` bindings.

**Installable app:**
- Added `manifest.json` with app name, display mode, theme colors, and icon metadata.
- Added `assets/icons/icon.svg` for browser and install surfaces.
- Added `serviceworker.js` with app-shell caching and versioned cache cleanup.
- Registered the service worker on HTTP/HTTPS deployments.

**Mobile controls:**
- Added playable Ms. Pac-Man, Dig Dug, and Centipede cabinets to the arcade selector.
- Added four-way D-pad controls for maze movement.
- Hid the fire button while Pac-Man is active.
- Added canvas swipe/drag steering for both games.
- Added tap-anywhere fire for Galaga gameplay.
- Filled Pac-Man passable corridors with pellets and reserved only the ghost house as empty floor.
- Repositioned the orange ghost into the ghost house lineup.
- Tightened Pac-Man collision to check the full actor radius and keep movement centered in lanes.
- Restored the original ghost-house side-wall positions while keeping the missing pellets filled.
- Added pellets back to the normal corridors around the ghost house; only the ghost pen/doorway remains empty.
- Removed pellets from unreachable side-tunnel-adjacent pockets, made ghost-house floor ghost-only, and biased ghosts toward the exit while inside the pen.
- Added explicit ghost-house exit steering so ghosts leave the pen instead of idling inside.
- Kept ghost doorway exit direction stable so ghosts fully clear the pen instead of oscillating at the doorway.
- Removed ghost-only side pockets so ghosts cannot path into invisible traps beside the central pen.
- Fixed game selection controls by adding pointer support to on-screen buttons and swipe-to-select on the splash canvas.
- Added a guarded click fallback for on-screen controls so cabinet selection works across pointer, touch, and mouse environments.
- Made touch/control initialization idempotent so repeated setup cannot double-toggle cabinet selection.

#### Technical Improvements

- Removed legacy client-side cloud SDK scripts and hardcoded cloud config.
- Awaited high-score submission and prevented duplicate score saves.
- Kept high-score lists separate for Galaga and Pac-Man.
- Updated documentation for Cloudflare deployment and installability.

---

## [2.2.0] - 2025-10-15

### 🎨 Alien Diversity & Optimization Update

#### ✨ New Features

**New Alien Types (3 additions!):**
- ✅ **Dragonfly** - Fast insect with 4 realistic wings, green body, compound eyes
- ✅ **Wasp** - Aggressive striped enemy, animated stinger that glows when attacking
- ✅ **Beetle** - Armored tank with metallic purple shell, 6 animated legs, 3 HP

**Total Aliens: 8 unique types!**

**Enhanced Visual Diversity:**
- ✅ Realistic insect anatomy (dragonfly has 4 wings, beetle has 6 legs)
- ✅ Unique color palette for each alien (green, yellow/black, purple added)
- ✅ Advanced visual effects (gradients, transparency, glowing elements)
- ✅ State-based animations (wasp stinger glows when attacking)
- ✅ Varied animation speeds (15Hz dragonfly vs 8Hz butterfly)

**Progressive Unlock System:**
- ✅ Level 2: Dragonfly unlocks alongside Butterfly
- ✅ Level 4: Wasp unlocks alongside Moth
- ✅ Level 6: Beetle unlocks (armored tank)
- ✅ Level 8: Boss unlocks (final enemy type)

#### 🔧 Performance Optimizations

**Particle System Overhaul:**
- ✅ Batched rendering by color (reduces state changes by 87%)
- ✅ Eliminated redundant save/restore calls
- ✅ 20-30% faster particle rendering
- ✅ Better frame rates during explosions
- ✅ Reduced draw calls by 60%

**Code Cleanup:**
- ✅ Removed redundant patterns
- ✅ Improved code organization with comments
- ✅ Consistent naming conventions
- ✅ Better separation of rendering logic

#### 📊 Balance Changes

**New Enemy Stats:**
- Dragonfly: 1 HP, 140 speed, 180 score (fast threat)
- Wasp: 2 HP, 110 speed, 280 score, 0.018 shoot chance (aggressive)
- Beetle: 3 HP, 70 speed, 350 score (tank role)

**Strategic Impact:**
- More diverse threat types per level
- Tank enemies require focus fire
- Fast enemies test reaction time
- High-shooters demand priority targeting

#### 📝 Documentation
- ✅ New ALIEN_DIVERSITY.md with complete alien encyclopedia
- ✅ Visual descriptions for all 8 alien types
- ✅ Performance optimization details
- ✅ Strategic gameplay tips
- ✅ Unlock progression table

---

## [2.1.0] - 2025-10-01

### 🔊 Sound System & Difficulty Balance

#### ✨ New Features

**Web Audio API Sound Engine:**
- ✅ Procedurally generated sound effects (no external files!)
- ✅ 11 unique sounds:
  - Player shoot (pew!)
  - Enemy shoot (low hum)
  - Explosion (filtered noise)
  - Hit (sharp beep)
  - Bullet collision (high ping)
  - Powerup (musical arpeggio)
  - Player death (descending sweep)
  - Level complete (victory fanfare)
  - Menu select (UI beep)
  - Background music (ambient drone)
- ✅ Sound integration at all game events
- ✅ Oscillator-based synthesis (square, sine, sawtooth, triangle waves)
- ✅ Envelope shaping (ADSR)
- ✅ White noise generation for explosions

**Difficulty Progression System:**
- ✅ Gradual scaling every 2 levels
- ✅ Level 1 starts much easier:
  - 6 enemies (was 10)
  - Slower bullets (120 px/s vs 200)
  - Less aggressive attacks (0.0008 vs 0.002)
  - Max 2 attackers (was 4)
  - Reduced shooting rates
- ✅ Smooth progression to level 11+ expert mode
- ✅ Dynamic difficulty scaling function
- ✅ Console logging of difficulty changes
- ✅ Bullet speed scaling (120→220 over 10 levels)

**Combat Improvements:**
- ✅ Bullet-on-bullet collision system
- ✅ Shoot down enemy fire for +10 score
- ✅ Enhanced spaceship sprite (70 lines, gradients, animated engines)
- ✅ Smart touch controls (only show on actual touch devices)
- ✅ Keyboard detection to auto-hide controls

#### 🐛 Bug Fixes
- ✅ Fixed level starting at 2 instead of 1
- ✅ Fixed enemies not shooting frequently enough
- ✅ Fixed limited attack pattern variety
- ✅ Fixed ship appearing as simple square
- ✅ Fixed touch controls showing on desktop

#### 📝 Documentation
- ✅ DIFFICULTY_PROGRESSION.md with complete scaling formulas
- ✅ LEVEL_BULLET_FIXES.md detailing combat improvements
- ✅ SPACESHIP_IMPROVEMENTS.md with visual upgrade details
- ✅ COMBAT_IMPROVEMENTS.md with attack pattern documentation

---

## [2.0.0] - 2025-09-30

### 🎉 Major Rewrite - Complete Game Overhaul

#### ✨ Added Features

**Enemy Systems:**
- ✅ Complete `AlienSprites` object with 5 unique, animated enemy types:
  - Bee (yellow, fast, basic enemy)
  - Butterfly (magenta, medium difficulty with wing animations)
  - Boss (cyan, large with pincers and pulsing effects)
  - Scorpion (orange, aggressive with animated tail)
  - Moth (gray, erratic with fuzzy body texture)
- ✅ `EnemyManager` system for intelligent AI and spawning
- ✅ Progressive enemy type unlocking based on level
- ✅ Smooth Bezier curve entrance animations
- ✅ Formation pattern management with swaying movement
- ✅ Dive attack mechanics with wobble patterns
- ✅ Per-enemy-type properties (HP, speed, score, shoot chance)
- ✅ Level-based difficulty scaling (10% increase per level)
- ✅ Health bars for enemies with HP > 1
- ✅ Enemy shooting with type-specific bullet colors

**Powerup System:**
- ✅ `PowerupManager` for automatic powerup spawning
- ✅ 4 powerup types:
  - Double Shot (2 bullets at once, 10s duration)
  - Speed Boost (faster movement & firing, 10s duration)
  - Shield (invincibility, 15s duration)
  - Extra Life (+1 life, instant)
- ✅ Visual powerup rotation animations
- ✅ 10% drop chance from destroyed enemies
- ✅ Automatic spawning every 15 seconds
- ✅ Collision detection and pickup system

**Graphics & Performance:**
- ✅ Adaptive quality system (auto-adjusts based on FPS)
- ✅ Three quality presets: Low, Medium, High
- ✅ Performance monitoring with FPS tracking
- ✅ Object pooling for bullets, enemy bullets, and particles
- ✅ Batched rendering system for improved performance
- ✅ Path, gradient, and text caching
- ✅ Memory management with automatic cache cleanup
- ✅ Viewport culling system (prepared for future use)
- ✅ 3-layer parallax scrolling starfield
- ✅ Enhanced particle system with hit effects

**Collision Detection:**
- ✅ Circular collision detection (more accurate than AABB)
- ✅ Player bullets vs enemies with HP tracking
- ✅ Enemy bullets vs player with shield check
- ✅ Enemy collision damage to player
- ✅ Powerup collection detection
- ✅ Hit effects for partial damage
- ✅ Explosion effects for destruction
- ✅ Screen shake on damage

**High Score System:**
- ✅ Firebase Realtime Database integration
- ✅ High score entry screen with keyboard input
- ✅ 5-character name entry (up from 3)
- ✅ Arrow key navigation for initial selection
- ✅ Backspace support for corrections
- ✅ Automatic high score checking on game over
- ✅ Top 10 leaderboard storage
- ✅ Timestamp tracking for scores

**Level Progression:**
- ✅ Level transition screen with message
- ✅ Automatic wave spawning when enemies cleared
- ✅ Increasing enemy count per level (8 + level * 2, max 24)
- ✅ Staggered enemy spawning (300ms intervals)
- ✅ Progressive difficulty curve
- ✅ Level display in UI

**Touch Controls:**
- ✅ Mobile device detection
- ✅ On-screen button rendering
- ✅ Touch event handlers (start, move, end)
- ✅ Auto-fire toggle for mobile
- ✅ Visual feedback for pressed buttons
- ✅ Multi-touch support

**UI & Polish:**
- ✅ Enhanced arcade splash screen with animations
- ✅ Enemy showcase carousel on splash
- ✅ Glowing title effects
- ✅ Power-up indicator in HUD
- ✅ Smooth shield visual effect
- ✅ Level transition messages
- ✅ Improved pause screen
- ✅ Better game over screen with stats

#### 🔧 Technical Improvements

**Code Architecture:**
- ✅ Complete refactor with manager pattern
- ✅ State machine for game flow
- ✅ Separation of concerns (rendering, logic, AI)
- ✅ Extensive code documentation
- ✅ Error handling for Firebase failures
- ✅ Graceful degradation without database

**Performance Optimizations:**
- ✅ Delta time (dt) for frame-rate independence
- ✅ Capped dt to prevent "spiral of death"
- ✅ Object pool reuse to reduce GC pressure
- ✅ Batched draw calls for similar objects
- ✅ Reduced unnecessary console logging
- ✅ Efficient array filtering and splicing
- ✅ Performance metrics tracking

**Game Balance:**
- ✅ Slower, more gradual difficulty progression
- ✅ Balanced enemy HP and damage
- ✅ Fair powerup spawn rates
- ✅ Reasonable shooting cooldowns
- ✅ Limited max attackers (2 at once)
- ✅ Appropriate formation spacing

#### 🐛 Bug Fixes
- ✅ Fixed missing `initTouchControls` error
- ✅ Fixed missing `updateSplash` function
- ✅ Fixed missing `updateGameplay` function
- ✅ Fixed missing enemy spawning
- ✅ Fixed formation spot management
- ✅ Fixed bullet pooling issues
- ✅ Fixed collision detection accuracy
- ✅ Fixed high score entry not working
- ✅ Fixed screen shake not resetting transform
- ✅ Fixed starfield not initializing
- ✅ Fixed enemies not appearing
- ✅ Fixed powerups not being collected

#### 📝 Documentation
- ✅ Comprehensive README.md with full documentation
- ✅ Installation instructions
- ✅ Control reference (desktop & mobile)
- ✅ Technical architecture details
- ✅ Customization guide
- ✅ Known issues and future enhancements
- ✅ Performance tips
- ✅ Firebase setup guide

## [1.0.0] - Previous Version

### Initial Implementation
- Basic Galaga-inspired game
- Simple enemy shapes
- Player movement and shooting
- Basic collision detection
- Firebase high score integration
- Arcade splash screen
- GraphicsOptimizer foundation

---

## Upgrade Notes

**Breaking Changes from 1.0:**
- Enemy rendering now uses `EnemyManager.draw()` instead of individual enemy drawing
- Collision detection uses circular bounds instead of AABB
- High score entry now requires 5 characters instead of 3
- Powerups now managed by `PowerupManager`

**Migration:**
- If you had custom enemy types, they need to be added to `AlienSprites`
- Custom collision code may need adjustment for circular detection
- Firebase database structure is compatible, no migration needed

---

## Future Roadmap

**Planned for 2.1.0:**
- 🔊 Sound effects and music
- 🎯 Challenge stages
- 🎮 Boss Galaga tractor beam
- 🚀 Dual ship mode
- 🏆 Achievement system

**Planned for 3.0.0:**
- 🌐 Multiplayer mode
- 📱 Progressive Web App (PWA)
- 🎨 Theme customization
- 🎪 Additional game modes

---

**Legend:**
- ✅ Completed
- 🔊 Sound-related
- 🎯 Gameplay feature
- 🎮 Control/Input
- 🚀 Enhancement
- 🏆 Meta-game feature
- 🌐 Network feature
- 📱 Platform feature
- 🎨 Visual feature
- 🎪 Mode/Variety
