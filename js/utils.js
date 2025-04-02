// Add keyboard navigation detection for accessibility

// Utility functions

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function detectCollision(obj1, obj2) {
    return distance(obj1.x, obj1.y, obj2.x, obj2.y) < (obj1.radius + obj2.radius);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add keyboard navigation detection
function setupKeyboardNavigationDetection() {
    // Add a class to the body when user is navigating with keyboard
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    // Remove the class when user clicks with mouse
    window.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Call this function when the game initializes
document.addEventListener('DOMContentLoaded', setupKeyboardNavigationDetection);
