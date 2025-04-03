// Firebase High Scores Management for Galaga

class HighScoreManager {
    constructor() {
        // Initialize Firebase with your config
        const firebaseConfig = {
            apiKey: "AIzaSyB6VUKC89covzLlhUO7UMeILVCJVy1SPdc",
            authDomain: "galaga-e7527.firebaseapp.com",
            databaseURL: "https://galaga-e7527-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "galaga-e7527",
            storageBucket: "galaga-e7527.firebasestorage.app",
            messagingSenderId: "983420615265",
            appId: "1:983420615265:web:77861c68c1b93f92dd4820",
            measurementId: "G-R9Z2YFQ30C"
        };

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.database = firebase.database();
        this.highScoresRef = this.database.ref('highScores');
        this.maxHighScores = 10; // Only store top 10 scores
        this.currentGameScore = 0;
        this.isHighScore = false;
        
        // DOM elements
        this.highScoresList = document.getElementById('highscores-list');
        this.gameOverHighScoresList = document.getElementById('gameover-highscores-list');
        this.highScoreMessage = document.getElementById('highscore-message');
        this.nameInputContainer = document.getElementById('name-input-container');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreButton = document.getElementById('submit-score');
        
        // Bind event listeners
        this.setupEventListeners();
        
        // Load high scores when the game starts
        this.loadHighScores();
    }
    
    setupEventListeners() {
        // Add submit score event listener
        if (this.submitScoreButton) {
            this.submitScoreButton.addEventListener('click', () => {
                this.submitScore();
            });
        }
        
        // Add enter key for score submission
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitScore();
                }
            });
        }
    }
    
    loadHighScores() {
        // Get data from Firebase
        this.highScoresRef.orderByChild('score').limitToLast(this.maxHighScores).once('value', (snapshot) => {
            // Update both high score lists (main menu and game over screen)
            this.updateHighScoreList(this.highScoresList, snapshot);
            this.updateHighScoreList(this.gameOverHighScoresList, snapshot);
        });
    }
    
    updateHighScoreList(listElement, snapshot) {
        if (!listElement) return;
        
        // Clear the current list
        listElement.innerHTML = '';
        
        // If no high scores exist yet
        if (!snapshot.exists()) {
            listElement.innerHTML = '<p>No high scores yet. Be the first!</p>';
            return;
        }
        
        // Create a table for high scores
        const table = document.createElement('table');
        table.classList.add('highscores-table');
        
        // Table header
        const headerRow = document.createElement('tr');
        const rankHeader = document.createElement('th');
        rankHeader.textContent = 'Rank';
        const nameHeader = document.createElement('th');
        nameHeader.textContent = 'Name';
        const scoreHeader = document.createElement('th');
        scoreHeader.textContent = 'Score';
        headerRow.appendChild(rankHeader);
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(scoreHeader);
        table.appendChild(headerRow);
        
        // Convert to array for sorting
        const highScores = [];
        snapshot.forEach((childSnapshot) => {
            highScores.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);
        
        // Add each score to the table
        highScores.forEach((score, index) => {
            const row = document.createElement('tr');
            
            // Highlight the current player's score if it's in the list
            if (score.score === this.currentGameScore && this.isHighScore) {
                row.classList.add('highlight-score');
            }
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = score.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = score.score;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            table.appendChild(row);
        });
        
        listElement.appendChild(table);
    }
    
    checkHighScore(score) {
        this.currentGameScore = score;
        return new Promise((resolve) => {
            // Get the lowest high score
            this.highScoresRef.orderByChild('score').limitToLast(this.maxHighScores).once('value', (snapshot) => {
                // If we have fewer than maxHighScores scores, it's definitely a high score
                if (!snapshot.exists() || snapshot.numChildren() < this.maxHighScores) {
                    this.isHighScore = true;
                    resolve(true);
                    return;
                }
                
                // Get the lowest score
                let lowestScore = Infinity;
                snapshot.forEach((childSnapshot) => {
                    const scoreValue = childSnapshot.val().score;
                    lowestScore = Math.min(lowestScore, scoreValue);
                });
                
                // Check if the current score beats the lowest high score
                this.isHighScore = score > lowestScore;
                resolve(this.isHighScore);
            });
        });
    }
    
    showHighScoreForm(isHighScore) {
        // Always update both high score tables regardless of high score status
        this.loadHighScores();
        
        if (!this.highScoreMessage || !this.nameInputContainer) return;
        
        if (isHighScore) {
            this.highScoreMessage.textContent = "Congratulations! You've got a high score!";
            this.nameInputContainer.style.display = 'block';
            
            // Auto-focus the name input
            setTimeout(() => {
                if (this.playerNameInput) {
                    this.playerNameInput.focus();
                }
            }, 100);
        } else {
            this.highScoreMessage.textContent = "Good game! Try again to beat the high scores.";
            this.nameInputContainer.style.display = 'none';
        }
    }
    
    submitScore() {
        if (!this.playerNameInput) return;
        
        let playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            playerName = "AAA"; // Default name
        }
        
        // Limit name length
        playerName = playerName.substring(0, 10);
        
        // Add the score to Firebase
        const newScore = {
            name: playerName,
            score: this.currentGameScore,
            timestamp: Date.now()
        };
        
        this.highScoresRef.push(newScore)
            .then(() => {
                console.log("Score added successfully");
                // After adding, potentially clean up old scores
                this.cleanupOldScores();
                
                // Hide the input form
                if (this.nameInputContainer) {
                    this.nameInputContainer.style.display = 'none';
                }
                
                // Update high scores message
                if (this.highScoreMessage) {
                    this.highScoreMessage.textContent = `Score submitted! Thanks, ${playerName}!`;
                }
                
                // Refresh the high scores list
                this.loadHighScores();
            })
            .catch((error) => {
                console.error("Error adding score: ", error);
            });
    }
    
    cleanupOldScores() {
        // If we have more than maxHighScores, remove the lowest ones
        this.highScoresRef.orderByChild('score').once('value', (snapshot) => {
            if (snapshot.numChildren() > this.maxHighScores) {
                // Convert to array for sorting
                const scores = [];
                snapshot.forEach((childSnapshot) => {
                    scores.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Sort by score (lowest first)
                scores.sort((a, b) => a.score - b.score);
                
                // Remove excess scores
                const scoresToRemove = scores.slice(0, scores.length - this.maxHighScores);
                
                // Delete each excess score
                scoresToRemove.forEach((score) => {
                    this.highScoresRef.child(score.id).remove();
                });
            }
        });
    }
}

// Create a global instance when the script loads
window.highScoreManager = new HighScoreManager();