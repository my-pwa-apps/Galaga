# Difficulty Progression System

## Overview
The game now features a gradual difficulty progression that starts easier and ramps up over levels, providing a better learning curve for new players while maintaining challenge for experienced players.

## Level 1 Starting Values (Easy Mode)

### Enemy Wave Configuration
- **Enemy Count**: 6 enemies (was 10)
- **Attack Chance**: 0.0008 per frame (was 0.002)
- **Max Simultaneous Attackers**: 2 (was 4)
- **Group Attack Chance**: 5% (was 15%)
- **Diving Speed**: 150 pixels/sec (was 180)
- **Bullet Speed**: 120 pixels/sec (was 200) - **More reaction time!**
- **Formation Shoot Chance**: 0.005 per frame (was 0.01)
- **Attacking Shoot Chance**: 0.015 per frame (was 0.03)

### Enemy Properties (Level 1)
| Enemy Type | HP | Speed | Base Shoot Chance |
|-----------|----|----|-----------------|
| Bee       | 1  | 100 | 0.010 |
| Butterfly | 1  | 80  | 0.012 |
| Moth      | 1  | 150 | 0.010 |
| Scorpion  | 2  | 120 | 0.015 |
| Boss      | 3  | 60  | 0.020 |

## Difficulty Scaling Formula

### Every 2 Levels (Tier System)
The game increases difficulty every 2 levels using a tier system:
- **Tier 0**: Levels 1-2
- **Tier 1**: Levels 3-4
- **Tier 2**: Levels 5-6
- And so on...

### Progression Rates

#### Wave Configuration Scaling
```
baseAttackChance: 0.0008 → 0.003 (caps at level 11)
  +0.0004 per tier

maxAttackers: 2 → 5 (caps at level 13)
  +1 every 2 tiers (every 4 levels)

groupAttackChance: 0.05 → 0.20 (caps at level 13)
  +0.025 per tier

divingSpeed: 150 → 200 (caps at level 11)
  +10 per tier

bulletSpeed: 120 → 220 (caps at level 11)
  +20 per tier

formationShootChance: 0.005 → 0.015 (caps at level 11)
  +0.002 per tier

attackingShootChance: 0.015 → 0.035 (caps at level 11)
  +0.004 per tier
```

#### Enemy Count Scaling
```
Level 1: 6 enemies
Level 2: 8 enemies
Level 3: 10 enemies
...
Level 7+: 20 enemies (capped)
```

#### Enemy Property Scaling
Each enemy's properties scale with level:
```
HP Multiplier: 1.0 → 1.8+ (8% per level after level 1)
Speed Multiplier: 1.0 → 1.4 (capped)
Shoot Chance Multiplier: 1.0 → 1.15 (3% per level after level 1, max 0.06)
Score Multiplier: Scales with HP multiplier
```

## Level-by-Level Breakdown

### Levels 1-2: Tutorial Phase
- **Focus**: Learn the basics
- **Enemy Count**: 6-8
- **Attackers**: Max 2 at once
- **Shooting**: Minimal formation fire, rare attacks
- **Strategy**: Perfect time to master movement and shooting

### Levels 3-4: Beginner Phase
- **Focus**: Handle more enemies and attacks
- **Enemy Count**: 10-12
- **Attackers**: Max 2 at once
- **Shooting**: Slightly increased
- **Strategy**: Start using defensive bullet-on-bullet tactics

### Levels 5-6: Intermediate Phase
- **Focus**: Multi-enemy attacks begin
- **Enemy Count**: 14-16
- **Attackers**: Max 3 at once
- **Shooting**: Moderate frequency
- **Strategy**: Powerups become important

### Levels 7-10: Advanced Phase
- **Focus**: Coordination and reaction
- **Enemy Count**: 18-20 (capped)
- **Attackers**: Max 4 at once
- **Shooting**: Heavy fire from formation and attackers
- **Strategy**: Master all mechanics to survive

### Levels 11+: Expert Phase
- **Focus**: Maximum difficulty
- **Enemy Count**: 20 (capped)
- **Attackers**: Max 5 at once
- **Shooting**: Near-constant barrage
- **Strategy**: Perfect execution required

## Comparison: Old vs New Level 1

### Old Level 1 (Too Hard)
- 10 enemies with high HP
- 4 simultaneous attackers
- Heavy shooting (0.03 attack chance, 0.01 formation)
- Fast bullets (200 speed) - Hard to dodge!
- 15% group attacks
- Fast diving (180 speed)
- **Result**: Overwhelming for new players

### New Level 1 (Just Right)
- 6 enemies with minimal HP
- 2 simultaneous attackers
- Light shooting (0.015 attack chance, 0.005 formation)
- Slow bullets (120 speed) - Easier to dodge!
- 5% group attacks
- Moderate diving (150 speed)
- **Result**: Learn mechanics without frustration

## Benefits of New System

1. **Smooth Learning Curve**: Players can learn mechanics gradually
2. **Better Retention**: Less frustrating for new players
3. **Maintained Challenge**: Veterans still face difficulty in later levels
4. **Predictable Scaling**: Clear progression every 2 levels
5. **Balanced Caps**: Difficulty plateaus at level 11-13 to remain playable

## Bullet Speed Progression Detail

One of the most impactful changes is **bullet speed scaling**:

| Level | Bullet Speed | Reaction Time Gain |
|-------|-------------|-------------------|
| 1-2   | 120 px/s    | **40% more time to dodge!** |
| 3-4   | 140 px/s    | 30% more time |
| 5-6   | 160 px/s    | 20% more time |
| 7-8   | 180 px/s    | 10% more time |
| 9-10  | 200 px/s    | Original speed |
| 11+   | 220 px/s    | 10% faster (challenge!) |

This gives new players crucial extra time to:
- Track incoming bullets
- Position for dodging
- Practice bullet-on-bullet shooting
- Build confidence before facing faster projectiles

## Console Logging

The game logs difficulty changes:
```javascript
Level 3 difficulty: {
  attackChance: 0.0012,
  maxAttackers: 2,
  groupAttackChance: 0.075,
  divingSpeed: 160,
  bulletSpeed: 140
}
```

Check the browser console to see difficulty adjustments as you progress!
