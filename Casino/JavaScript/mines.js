// mines.js - Main JavaScript for the Mines game

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const allInButton = document.getElementById('allInButton');
const setRows3x3Button = document.getElementById('setRows3x3');
const setRows5x5Button = document.getElementById('setRows5x5');
const setRows7x7Button = document.getElementById('setRows7x7');
const setRows9x9Button = document.getElementById('setRows9x9');
const mineCountInput = document.getElementById('mineCountInput');
const startGameButton = document.getElementById('startGameButton');
const minesBoard = document.getElementById('minesBoard');
const cashOutButton = document.getElementById('cashOutButton');
const resultText = document.getElementById('resultText');

// --- Game State Variables ---
// playerBalance is now managed globally by promo.js. Ensure promo.js is loaded FIRST in HTML.
let currentBet = 100;
let boardRows = 5; // Default board size
let boardCols = 5; // Default board size
let mineCount = 3; // Default number of mines
let board = [];    // Represents the game board (stores 1 for mine, 0 for safe)
let mines = [];    // Stores the positions of mines
let safeCellsClickedThisRound = 0; // Count of safe cells clicked in the current round
let gameStarted = false; // Flag to indicate if a game round is active
let currentMultiplier = 1.00; // Cumulative multiplier for the current round
let totalSafeCells = 0; // Total number of safe cells on the board for current configuration
let revealedCells = []; // Stores positions of revealed cells to restore board state

// --- Sound Effects ---
// IMPORTANT: Ensure these paths are correct for your files!
const clickSound = new Audio('../Music/Click.mp3');    // Sound for clicking a safe cell (NEW: Changed to more suitable click sound)
const mineSound = new Audio('../Music/Explosion.mp3'); // Sound for hitting a mine (NEW: Changed to explosion sound)
const cashOutSound = new Audio('../Music/Win.mp3');   // Sound for cashing out (Winning)

clickSound.load();     // Preload click sound
mineSound.load();      // Preload mine sound
cashOutSound.load();   // Preload cash out (win) sound

clickSound.volume = 0.5;
mineSound.volume = 0.7;
cashOutSound.volume = 0.7;

// --- Display Functions ---
// Updates the player's balance, current bet, and multiplier on the HTML page
function updateDisplay() {
    // Use the global updateBalanceDisplay function from promo.js
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    } else {
        // Fallback if promo.js isn't loaded (shouldn't happen with correct HTML order)
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = currentBet.toFixed(2); // Display with 2 decimal places
    multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x'; // Display with 2 decimal places
    
    // Set max value for mine count input based on board size.
    mineCountInput.max = (boardRows * boardCols) - 1; 
    // Ensure current mineCountInput value doesn't exceed new max if board size changes
    if (parseInt(mineCountInput.value) > mineCountInput.max) {
        mineCountInput.value = mineCountInput.max;
    }
    
    // Update selected board size button visual
    document.querySelectorAll('.row-option-button').forEach(button => {
        button.classList.remove('selected');
    });
    const selectedButtonId = `setRows${boardRows}x${boardCols}`;
    const selectedButton = document.getElementById(selectedButtonId);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

// --- Game Board Functions ---

// Generates the HTML structure for the game board
function generateBoardHTML() {
    minesBoard.innerHTML = ''; // Clear existing board
    minesBoard.style.gridTemplateColumns = `repeat(${boardCols}, 1fr)`;
    minesBoard.style.gridTemplateRows = `repeat(${boardRows}, 1fr)`;

    for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('mine-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);
            minesBoard.appendChild(cell);
        }
    }
}

// Initializes the game board with mines and numbers (0 for safe, 1 for mine)
function initializeGame() {
    // Reset game state for a new round
    board = Array(boardRows).fill(0).map(() => Array(boardCols).fill(0)); // Initialize all cells as safe (0)
    mines = [];
    safeCellsClickedThisRound = 0; // Reset count of safe cells clicked
    currentMultiplier = 1.00; // Reset multiplier to 1.00 at the start of a new game
    resultText.textContent = '';
    revealedCells = []; // Reset revealed cells

    // Stop all sounds before starting a new game
    clickSound.pause(); clickSound.currentTime = 0;
    mineSound.pause(); mineSound.currentTime = 0;
    cashOutSound.pause(); cashOutSound.currentTime = 0;

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const r = Math.floor(Math.random() * boardRows);
        const c = Math.floor(Math.random() * boardCols);
        if (board[r][c] !== 1) { // If cell is not already a mine
            board[r][c] = 1; // Mark cell as a mine (value 1)
            mines.push({ row: r, col: c }); // Store mine position
            minesPlaced++;
        }
    }
    console.log("Mines placed (actual count):", mines.length); // DEBUG: Log actual mine count to verify

    totalSafeCells = (boardRows * boardCols) - mineCount; // Calculate total safe cells for win condition

    // Generate HTML and update display
    generateBoardHTML();
    updateDisplay();
    
    // Disable setup controls and enable cash out button
    disableGameControlsForRound(); 
    
    gameStarted = true;
}

// Function to load game state from localStorage
function loadGameState() {
    const savedState = JSON.parse(localStorage.getItem('minesGameState'));
    if (savedState && savedState.gameStarted) {
        console.log("Loading saved game state:", savedState);
        currentBet = savedState.currentBet;
        boardRows = savedState.boardRows;
        boardCols = savedState.boardCols;
        mineCount = savedState.mineCount;
        board = savedState.board; // JSON.parse handles 2D array
        mines = savedState.mines;
        safeCellsClickedThisRound = savedState.safeCellsClickedThisRound;
        gameStarted = savedState.gameStarted;
        currentMultiplier = savedState.currentMultiplier;
        totalSafeCells = savedState.totalSafeCells;
        revealedCells = savedState.revealedCells; // Restore revealed cells

        generateBoardHTML(); // Re-render board structure

        // Re-apply revealed state and content to cells
        revealedCells.forEach(cellPos => {
            const r = cellPos.row;
            const c = cellPos.col;
            const cellElement = minesBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cellElement) {
                // Ensure cells are visually updated correctly on load
                cellElement.classList.add('revealed', 'safe-revealed'); 
                cellElement.textContent = '⭐';
                // If it was a mine that was already revealed (shouldn't be in revealedCells, but for safety)
                if (board[r][c] === 1) {
                    cellElement.classList.remove('safe-revealed');
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                }
            }
        });

        updateDisplay(); // Update display with loaded values
        resultText.textContent = 'Game resumed. Click to continue!';
        disableGameControlsForRound(); // Ensure controls are correct for resumed game
        return true; // Game loaded successfully
    }
    return false; // No saved game found
}

// Function to save game state to localStorage
function saveGameState() {
    const gameState = {
        currentBet: currentBet,
        boardRows: boardRows,
        boardCols: boardCols,
        mineCount: mineCount,
        board: board, // Directly save the 2D array
        mines: mines,
        safeCellsClickedThisRound: safeCellsClickedThisRound,
        gameStarted: gameStarted,
        currentMultiplier: currentMultiplier,
        totalSafeCells: totalSafeCells,
        revealedCells: revealedCells // Save revealed cells
    };
    localStorage.setItem('minesGameState', JSON.stringify(gameState));
    // Also update player balance from promo.js to ensure consistency
    saveBalance(); // This is for playerBalance, not gameState specific
}

// Reveals a cell and its content (for Casino Mines: either safe or mine)
function revealCell(row, col) {
    const cellElement = minesBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cellElement || cellElement.classList.contains('revealed')) {
        return; // Cell is already revealed or doesn't exist
    }

    // Add 'revealed' class to show it's open
    cellElement.classList.add('revealed');
    revealedCells.push({row: row, col: col}); // Store position of newly revealed cell
    
    // Check if the cell contains a mine or is safe
    if (board[row][col] === 1) { // If it's a mine (value 1)
        cellElement.classList.add('mine'); // Add 'mine' class for red background
        cellElement.textContent = '💣'; // Display BOMB EMOJI
        // Removed mineSound.play() from here; it will be in endGame(false)
        endGame(false); // Game over - player loses
    } else { // It's a safe cell (value 0)
        safeCellsClickedThisRound++; // Increment count of safe cells clicked
        clickSound.pause(); clickSound.currentTime = 0; // Reset and play click sound
        clickSound.play();
        cellElement.textContent = '⭐'; // Display STAR EMOJI for safe cells
        cellElement.classList.add('safe-revealed'); // Add class for gold background

        // --- Multiplier Calculation for Casino Mines Game ---
        let newCalculatedMultiplier = 1;
        const totalCells = boardRows * boardCols;
        for (let i = 0; i < safeCellsClickedThisRound; i++) {
            const cellsNotYetClicked = totalCells - i;
            const safeCellsNotYetClicked = totalSafeCells - i;
            if (safeCellsNotYetClicked > 0) { // Avoid division by zero
                newCalculatedMultiplier *= (cellsNotYetClicked / safeCellsNotYetClicked) * 0.98; // 0.98 is a house edge factor
            } else {
                break; // All safe cells have been clicked
            }
        }
        currentMultiplier = newCalculatedMultiplier;

        // Check if all safe cells have been revealed (player wins automatically if so)
        if (safeCellsClickedThisRound === totalSafeCells) {
            endGame(true); // Player wins, all safe cells found
            resultText.textContent = `Congratulations! You found all ${safeCellsClickedThisRound} safe cells! 🎉`;
            return; // Exit function as game has ended
        }
        
        updateDisplay(); // Update display with new multiplier
        saveGameState(); // Save game state after each successful safe click
    }
}

// Handles a click on a cell
function handleCellClick(event) {
    if (!gameStarted) {
        resultText.textContent = 'Please start a game first!';
        return; // Only allow clicks if game has started
    }
    // Prevent clicking revealed cells during an active game
    if (event.target.classList.contains('revealed')) {
        return;
    }

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    revealCell(row, col);
}

// Ends the game (win or lose)
function endGame(win) {
    gameStarted = false; // Set game state to not active
    
    // Reveal ALL cells on the board (mines and unclicked safe cells)
    for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
            const cellElement = minesBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cellElement && !cellElement.classList.contains('revealed')) { // If cell is not yet revealed
                cellElement.classList.add('revealed'); // Mark as revealed

                if (board[r][c] === 1) { // If it's a mine
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣'; // Display BOMB EMOJI
                } else { // If it's a safe cell (that wasn't clicked)
                    cellElement.classList.add('safe-revealed'); // Gold background
                    cellElement.textContent = '⭐'; // Star emoji
                }
            }
        }
    }

    // Play win/lose sound based on result
    if (win) {
        let winnings = currentBet * currentMultiplier;
        winnings = parseFloat(winnings.toFixed(2)); 
        playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
        saveBalance(); // Use saveBalance() from promo.js
        resultText.textContent = `You cashed out! 🎉 Won ${winnings.toFixed(2)} (${currentMultiplier.toFixed(2)}x)`;
        cashOutSound.pause(); cashOutSound.currentTime = 0; // Reset and play win sound
        cashOutSound.play();
    } else {
        // If the player loses, the balance was already deducted at the start of the game.
        saveBalance(); // Use saveBalance() to persist final balance after a loss
        resultText.textContent = `BOOM! You hit a mine. 💥 Lost ${currentBet.toFixed(2)}.`;
        mineSound.pause(); mineSound.currentTime = 0; // Reset and play lose sound
        mineSound.play();
    }

    // Clear saved game state
    localStorage.removeItem('minesGameState'); 

    // Re-enable setup controls
    enableGameSetupControls();
    
    updateDisplay(); // Update final balance and UI
}

// --- Helper functions for controlling game state ---
function disableGameControlsForRound() { // Disable input during active round
    setBetButton.disabled = true;
    allInButton.disabled = true;
    mineCountInput.disabled = true;
    setRows3x3Button.disabled = true;
    setRows5x5Button.disabled = true;
    setRows7x7Button.disabled = true;
    setRows9x9Button.disabled = true;
    startGameButton.disabled = true; // Disable start game button during active game
    cashOutButton.disabled = false; // Enable cash out button during active game
    minesBoard.style.pointerEvents = 'auto'; // Enable clicks on cells
}

function enableGameSetupControls() { // Enable input for game setup
    setBetButton.disabled = false;
    allInButton.disabled = false;
    mineCountInput.disabled = false;
    setRows3x3Button.disabled = false;
    setRows5x5Button.disabled = false;
    setRows7x7Button.disabled = false;
    setRows9x9Button.disabled = false;
    startGameButton.disabled = false; // Enable start game button when ready
    cashOutButton.disabled = true; // Disable cash out when not in game
    minesBoard.style.pointerEvents = 'none'; // Disable clicks on board cells
}

// Function to pause game logic when page is hidden
function pauseGameLogic() {
    // If a game is in progress and player has clicked safe cells, treat as cash out
    if (gameStarted && safeCellsClickedThisRound > 0) {
        console.log("Game in progress, cashing out on page hide.");
        endGame(true); // Treat as a cash out
    } else if (gameStarted && safeCellsClickedThisRound === 0) {
        // If game started but no safe cells clicked, it's a loss (bet already deducted)
        console.log("Game started but no cells clicked, ending game on page hide.");
        endGame(false); // Just end the game (loss)
    }
    // Always save game state on hide, even if not started (to record gameStarted=false)
    saveGameState(); 

    // Stop all sounds on page hide
    clickSound.pause(); clickSound.currentTime = 0;
    mineSound.pause(); mineSound.currentTime = 0;
    cashOutSound.pause(); cashOutSound.currentTime = 0;

    // Visually disable interaction and show message
    minesBoard.style.pointerEvents = 'none'; // Disable board clicks
    resultText.textContent = 'Game paused. Return to continue or start new.';
}

// Function to resume game logic when page becomes visible
function resumeGameLogic() {
    if (loadGameState()) { // Attempt to load a saved game
        // Game resumed, board and controls updated by loadGameState
        console.log("Game resumed from saved state.");
        // Re-enable interaction for active game if it was loaded
        minesBoard.style.pointerEvents = 'auto'; 
    } else {
        // No saved game or game ended, ensure setup controls are enabled
        console.log("No saved game or game ended. Enabling setup controls.");
        enableGameSetupControls();
    }
    resultText.textContent = ''; // Clear pause message
}

// --- Event Listeners ---

// Set Bet button
setBetButton.addEventListener('click', () => {
    // Prevent changing bet during an active game
    if (gameStarted) { 
        resultText.textContent = "Cannot change bet while a game is in progress!";
        return;
    }
    let newBet = parseFloat(betAmountInput.value); 

    // Round the entered bet value to 2 decimal places
    if (!isNaN(newBet)) {
        newBet = parseFloat(newBet.toFixed(2));
    }

    if (isNaN(newBet) || newBet <= 0) {
        resultText.textContent = 'Bet must be a positive number!';
        return;
    }
    if (newBet < 0.01) { // Minimum bet
        resultText.textContent = 'Minimum bet is 0.01!';
        return;
    }
    // playerBalance is global from promo.js
    if (newBet > playerBalance) {
        resultText.textContent = 'Bet cannot exceed your balance!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    resultText.textContent = `Bet amount set: ${currentBet.toFixed(2)}`;
});

// All In button
allInButton.addEventListener('click', () => {
    if (gameStarted) {
        resultText.textContent = "Cannot go All In while a game is in progress!";
        return;
    }
    if (playerBalance <= 0) {
        resultText.textContent = "You have no balance to go All In!";
        return;
    }
    
    currentBet = parseFloat(playerBalance.toFixed(2)); // Use current balance, rounded
    // localStorage.setItem here is no longer needed, balance will be saved when startGameButton is clicked.

    betAmountInput.value = currentBet.toFixed(2);
    updateDisplay();
    resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`;
});

// Board size selection buttons
setRows3x3Button.addEventListener('click', () => { 
    if (gameStarted) { resultText.textContent = "Cannot change board size while a game is in progress!"; return; }
    boardRows = 3; boardCols = 3; generateBoardHTML(); updateDisplay(); 
});
setRows5x5Button.addEventListener('click', () => { 
    if (gameStarted) { resultText.textContent = "Cannot change board size while a game is in progress!"; return; }
    boardRows = 5; boardCols = 5; generateBoardHTML(); updateDisplay(); 
});
setRows7x7Button.addEventListener('click', () => { 
    if (gameStarted) { resultText.textContent = "Cannot change board size while a game is in progress!"; return; }
    boardRows = 7; boardCols = 7; generateBoardHTML(); updateDisplay(); 
});
setRows9x9Button.addEventListener('click', () => { 
    if (gameStarted) { resultText.textContent = "Cannot change board size while a game is in progress!"; return; }
    boardRows = 9; boardCols = 9; generateBoardHTML(); updateDisplay(); 
});

// Start Game button
startGameButton.addEventListener('click', () => {
    if (gameStarted) { // Prevent starting a new game if one is already in progress
        resultText.textContent = 'A game is already in progress!';
        return;
    }
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }
    // Validate mine count input
    const inputMineCount = parseInt(mineCountInput.value);
    if (isNaN(inputMineCount) || inputMineCount < 1 || inputMineCount >= (boardRows * boardCols)) {
        resultText.textContent = `Invalid mine count! Must be between 1 and ${boardRows * boardCols - 1}.`; // Update error message
        return;
    }
    mineCount = inputMineCount; // Use parsed value

    // Deduct bet and save balance IMMEDIATELY at game start
    playerBalance = parseFloat((playerBalance - currentBet).toFixed(2)); // Deduct bet
    saveBalance(); // Save balance using global promo.js function

    initializeGame(); // Setup and start the game
    saveGameState(); // Save initial game state immediately after starting
});

// Cash Out button
cashOutButton.addEventListener('click', () => {
    if (gameStarted && safeCellsClickedThisRound > 0) { // Can only cash out if game started and at least one safe cell revealed
        endGame(true); // Player wins by cashing out
    } else {
        resultText.textContent = 'No active game or no safe cells revealed to cash out from.';
    }
});

// Event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});

// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    generateBoardHTML(); // Draw the initial 5x5 board
    updateDisplay();     // Update initial balance and bet display
    
    // Attempt to load a saved game first
    if (!loadGameState()) { 
        enableGameSetupControls(); // If no game loaded, enable setup controls for a new game
    }
});
