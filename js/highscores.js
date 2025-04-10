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
        const levelHeader = document.createElement('th');
        levelHeader.textContent = 'Level';
        headerRow.appendChild(rankHeader);
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(scoreHeader);
        headerRow.appendChild(levelHeader);
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
            
            const levelCell = document.createElement('td');
            levelCell.textContent = score.level || '1';
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(levelCell);
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
            level: this.currentGameLevel || 1, // Default to level 1 if not provided
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
    
    submitHighScore(name, score, level) {
        // Validate inputs
        if (!name || typeof score !== 'number' || score <= 0) {
            console.error('Invalid high score data');
            return Promise.reject('Invalid high score data');
        }

        return new Promise((resolve, reject) => {
            if (!this.database) {
                console.error('Firebase database not initialized');
                reject('Database not available');
                return;
            }

            // Get a reference to the high scores in the database
            const scoresRef = this.database.ref('highScores');
            
            // Ensure level is always a number and at least 1
            const finalLevel = (typeof level === 'number' && level > 0) ? level : 1;
            
            // Create a new score entry with explicit level information
            // Allow up to 6 characters for player name
            const newScore = {
                name: name.substring(0, 6).toUpperCase(), // Allow up to 6 characters
                score: score,
                level: finalLevel,
                timestamp: Date.now()
            };
            
            // Push the new score to the database
            scoresRef.push(newScore)
                .then(() => {
                    console.log('High score submitted successfully');
                    resolve();
                })
                .catch(error => {
                    console.error('Error submitting high score:', error);
                    reject(error);
                });
        });
    }

    // Update the fetchHighScores method to ensure it retrieves level data
    fetchHighScores() {
        return new Promise((resolve, reject) => {
            if (!this.database) {
                console.error('Firebase database not initialized');
                reject('Database not available');
                return;
            }
            
            const scoresRef = this.database.ref('highScores');
            
            scoresRef.orderByChild('score')
                .limitToLast(this.maxHighScores)
                .once('value')
                .then(snapshot => {
                    const scores = [];
                    snapshot.forEach(childSnapshot => {
                        const scoreData = childSnapshot.val();
                        
                        // Make sure level is included and has a default value if missing
                        if (!scoreData.level) {
                            scoreData.level = 1;
                        }
                        
                        scores.push(scoreData);
                    });
                    
                    // Sort in descending order
                    scores.sort((a, b) => b.score - a.score);
                    resolve(scores);
                })
                .catch(error => {
                    console.error('Error fetching high scores:', error);
                    reject(error);
                });
        });
    }

    // Make sure the renderHighScores method displays the level correctly
    renderHighScores(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID ${containerId} not found`);
            return;
        }
        
        this.fetchHighScores()
            .then(scores => {
                // Clear the container
                container.innerHTML = '';
                
                if (scores.length === 0) {
                    container.innerHTML = '<p>No high scores yet. Be the first!</p>';
                    return;
                }
                
                // Create table for better layout
                const table = document.createElement('table');
                table.className = 'highscores-table';
                
                // Create table header
                const headerRow = document.createElement('tr');
                
                const rankHeader = document.createElement('th');
                rankHeader.textContent = 'RANK';
                
                const nameHeader = document.createElement('th');
                nameHeader.textContent = 'NAME';
                
                const scoreHeader = document.createElement('th');
                scoreHeader.textContent = 'SCORE';
                
                // Add level header
                const levelHeader = document.createElement('th');
                levelHeader.textContent = 'LEVEL';
                
                headerRow.appendChild(rankHeader);
                headerRow.appendChild(nameHeader);
                headerRow.appendChild(scoreHeader);
                headerRow.appendChild(levelHeader);
                table.appendChild(headerRow);
                
                // Add rows for each high score
                scores.forEach((score, index) => {
                    const row = document.createElement('tr');
                    
                    // Check if this is a new high score to highlight
                    if (score.isNew) {
                        row.className = 'new-highscore';
                    }
                    
                    const rankCell = document.createElement('td');
                    rankCell.textContent = `${index + 1}`;
                    
                    const nameCell = document.createElement('td');
                    nameCell.textContent = score.name;
                    
                    const scoreCell = document.createElement('td');
                    scoreCell.textContent = score.score;
                    
                    // Add level cell with proper value
                    const levelCell = document.createElement('td');
                    // Ensure level is a number and at least 1
                    const level = (typeof score.level === 'number' && score.level > 0) ? score.level : 1;
                    levelCell.textContent = level;
                    
                    row.appendChild(rankCell);
                    row.appendChild(nameCell);
                    row.appendChild(scoreCell);
                    row.appendChild(levelCell);
                    table.appendChild(row);
                });
                
                container.appendChild(table);
            })
            .catch(error => {
                console.error('Error rendering high scores:', error);
                container.innerHTML = '<p>Error loading high scores. Please try again later.</p>';
            });
    }
}

// Create a global instance when the script loads
window.highScoreManager = new HighScoreManager();