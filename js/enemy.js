// Update the Enemy class to handle difficulty parameters

class Enemy {
    constructor(options) {
        // ... existing code ...
        
        this.attackChance = options.attackChance || 0.001;
        
        // ... existing code ...
    }
    
    // ... existing code ...
    
    tryToAttack() {
        if (this.attackDelay > 0) {
            this.attackDelay--;
            return;
        }
        
        // Different attack chances based on enemy type and difficulty level
        let attackChance = this.attackChance;
        
        switch (this.type) {
            case 'basic':
                // Base attack chance
                break;
            case 'dive':
                // Dive enemies are more aggressive
                attackChance *= 2;
                this.state = Math.random() < 0.5 ? 'attacking' : 'diving';
                break;
            case 'boss':
                // Boss enemies are slightly more aggressive
                attackChance *= 1.5;
                break;
            default:
                // Default behavior
        }
        
        if (Math.random() < attackChance) {
            this.state = 'attacking';
        }
    }
    
    // ... existing code ...
}
