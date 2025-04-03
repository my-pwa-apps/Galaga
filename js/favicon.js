// Favicon generator for Galaga game
(function() {
    // Create a canvas for our favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with black (space) background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 32, 32);
    
    // Function to draw player ship
    function drawPlayerShip() {
        // Main body (blue)
        ctx.fillStyle = '#1E90FF';
        
        // Ship body
        ctx.beginPath();
        ctx.moveTo(16, 6);    // Nose of the ship
        ctx.lineTo(22, 26);   // Bottom right
        ctx.lineTo(10, 26);   // Bottom left
        ctx.closePath();
        ctx.fill();
        
        // Thruster fire (orange/red gradient)
        const gradient = ctx.createLinearGradient(16, 26, 16, 30);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#FF4500');
        gradient.addColorStop(1, '#FF0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(13, 26);
        ctx.lineTo(16, 30);
        ctx.lineTo(19, 26);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(16, 16, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Function to draw an enemy ship
    function drawEnemyShip() {
        // Main body (red)
        ctx.fillStyle = '#FF0000';
        
        // Body
        ctx.beginPath();
        ctx.moveTo(16, 8);  // Top center
        ctx.lineTo(24, 14); // Right wing
        ctx.lineTo(20, 22); // Bottom right
        ctx.lineTo(12, 22); // Bottom left
        ctx.lineTo(8, 14);  // Left wing
        ctx.closePath();
        ctx.fill();
        
        // Eyes (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(12, 16, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(20, 16, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Choose which icon to display - let's go with the player ship
    drawPlayerShip();
    //drawEnemyShip(); // Uncomment to use enemy ship instead
    
    // Create link element and set the favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png');
    
    // Add favicon to document
    document.head.appendChild(link);
})();