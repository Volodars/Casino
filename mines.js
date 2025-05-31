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
// Load player balance from localStorage, or set to 1000 if not found
// let playerBalance = parseFloat(localStorage.getItem('playerBalance')) || 1000; //изза него не грузилось и ошибка была)))) нельзя чтобы было 2 инициализирования
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

// --- Sound Effects (Placeholders, replace with actual sounds) ---
const clickSound = new Audio('click.mp3');   // Sound for clicking a safe cell
const mineSound = new Audio('mine.mp3');     // Sound for hitting a mine
const cashOutSound = new Audio('cashout.mp3'); // Sound for cashing out
clickSound.volume = 0.5;
mineSound.volume = 0.7;
cashOutSound.volume = 0.7;

// --- Display Functions ---
// Updates the player's balance, current bet, and multiplier on the HTML page
function updateDisplay() {
    balanceDisplay.textContent = playerBalance.toFixed(2); // <--- Применяем toFixed(2) для отображения
    currentBetDisplay.textContent = currentBet.toFixed(2); // <--- Применяем toFixed(2) для отображения
    multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x' * 0.98; // Display with 2 decimal places + HOUSE EDGE = 2%
    
    // Set max value for mine count input based on board size.
    // Max mines should be total cells minus 1, to ensure at least one safe spot to start.
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

    // In Casino Mines, we don't calculate adjacent mine counts for display.
    // The 'board' array will simply store 0 for safe cells and 1 for mines.
    totalSafeCells = (boardRows * boardCols) - mineCount; // Calculate total safe cells for win condition

    // Generate HTML and update display
    generateBoardHTML();
    updateDisplay();
    
    // Enable/Disable buttons based on game state
    startGameButton.disabled = true;
    cashOutButton.disabled = false; // Cash Out is available once game starts
    setBetButton.disabled = true;
    allInButton.disabled = true;
    mineCountInput.disabled = true;
    document.querySelectorAll('.row-option-button').forEach(button => button.disabled = true);
    
    gameStarted = true;
}

// Reveals a cell and its content (for Casino Mines: either safe or mine)
function revealCell(row, col) {
    const cellElement = minesBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cellElement || cellElement.classList.contains('revealed')) {
        return; // Cell is already revealed or doesn't exist
    }

    // Add 'revealed' class to show it's open
    cellElement.classList.add('revealed');
    
    // Check if the cell contains a mine or is safe
    if (board[row][col] === 1) { // If it's a mine (value 1)
        cellElement.classList.add('mine'); // Add 'mine' class for red background
        cellElement.textContent = '💣'; // Display BOMB EMOJI
        endGame(false); // Game over - player loses
        mineSound.play();
    } else { // It's a safe cell (value 0)
        safeCellsClickedThisRound++; // Increment count of safe cells clicked
        clickSound.play();
        cellElement.textContent = '⭐'; // Display STAR EMOJI for safe cells
        cellElement.classList.add('safe-revealed'); // Add class for gold background

        // --- Multiplier Calculation for Casino Mines Game ---
        // The multiplier increases with each safe click.
        // It's based on the probability of hitting a safe cell at each step.
        // Formula: Product from i=0 to (safeCellsClickedThisRound - 1) of ( (Total_Cells - i) / (Total_Cells - Mines - i) )
        
        let newCalculatedMultiplier = 1;
        const totalCells = boardRows * boardCols;
        for (let i = 0; i < safeCellsClickedThisRound; i++) {
            const cellsNotYetClicked = totalCells - i;
            const safeCellsNotYetClicked = totalSafeCells - i;
            if (safeCellsNotYetClicked > 0) { // Avoid division by zero
                newCalculatedMultiplier *= (cellsNotYetClicked / safeCellsNotYetClicked) * 0.98; // HOUSE EDGE = 2%
            } else {
                // This means all safe cells have been clicked, multiplier is maxed out.
                break;
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
    }
}

// Handles a click on a cell
function handleCellClick(event) {
    if (!gameStarted) {
        resultText.textContent = 'Please start a game first!';
        return; // Only allow clicks if game has started
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

    if (win) {
    let winnings = currentBet * currentMultiplier;
    // Округляем winnings до 2 знаков и преобразуем обратно в число
    winnings = parseFloat(winnings.toFixed(2)); 
    playerBalance = parseFloat((playerBalance + winnings).toFixed(2)); // Теперь к балансу добавляется округленное число
    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
    resultText.textContent = `You cashed out! 🎉 Won ${winnings.toFixed(2)} (${currentMultiplier.toFixed(2)}x)`;
    cashOutSound.play();
    } else {
         // If the player loses, the balance was already deducted at the start of the game.
        // No additional balance change, but we should still save in case the balance went to 0.
        localStorage.setItem('playerBalance', playerBalance.toFixed(2));
        resultText.textContent = `BOOM! You hit a mine. 💥 Lost ${currentBet}.`;
    }

    // Re-enable/disable buttons for next round
    startGameButton.disabled = false;
    cashOutButton.disabled = true; // Cash out disabled until next game starts
    setBetButton.disabled = false;
    allInButton.disabled = false;
    mineCountInput.disabled = false;
    document.querySelectorAll('.row-option-button').forEach(button => button.disabled = false);
    
    updateDisplay(); // Update final balance and UI
}

// --- Event Listeners ---

// Set Bet button
setBetButton.addEventListener('click', () => {
    let newBet = parseFloat(betAmountInput.value); // Используем parseFloat вместо parseInt

    // Округляем введенное значение ставки до 2 знаков после запятой,
    // чтобы избежать проблем с плавающей точкой в будущем и привести к формату "копеек".
    if (!isNaN(newBet)) {
        newBet = parseFloat(newBet.toFixed(2));
    }

    if (isNaN(newBet) || newBet <= 0) {
        resultText.textContent = 'Bet must be a positive number!';
        return;
    }
    // Добавим проверку на минимальную ставку, если хочешь (например, 0.01)
    if (newBet < 0.01) { // Минимальная ставка
        resultText.textContent = 'Minimum bet is 0.01!';
        return;
    }
    if (newBet > playerBalance) {
        resultText.textContent = 'Bet cannot exceed your balance!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    // Display the bet with 2 decimal places
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
    
    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    playerBalance = parseFloat(playerBalance.toFixed(2)); // Убеждаемся, что баланс округлен перед использованием для All In
    currentBet = playerBalance; // Теперь currentBet будет иметь округленное значение
    localStorage.setItem('playerBalance', playerBalance.toFixed(2));

    betAmountInput.value = currentBet.toFixed(2); // Update text with rounded value
    updateDisplay();
    resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`; // Обновляем текст с округленным значением
});

// Board size selection buttons
setRows3x3Button.addEventListener('click', () => { boardRows = 3; boardCols = 3; generateBoardHTML(); updateDisplay(); });
setRows5x5Button.addEventListener('click', () => { boardRows = 5; boardCols = 5; generateBoardHTML(); updateDisplay(); });
setRows7x7Button.addEventListener('click', () => { boardRows = 7; boardCols = 7; generateBoardHTML(); updateDisplay(); });
setRows9x9Button.addEventListener('click', () => { boardRows = 9; boardCols = 9; generateBoardHTML(); updateDisplay(); });

// Start Game button
startGameButton.addEventListener('click', () => {
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }
    // Validate mine count input
    const inputMineCount = parseInt(mineCountInput.value);
    if (isNaN(inputMineCount) || inputMineCount < 1 || inputMineCount >= (boardRows * boardCols)) {
        resultText.textContent = 'Invalid mine count! Must be at least 1 and less than total cells.';
        return;
    }
    mineCount = inputMineCount; // Use parsed value
    playerBalance = parseFloat((playerBalance - currentBet).toFixed(2)); // Deduct bet at the start of the game
    localStorage.setItem('playerBalance', playerBalance.toFixed(2)); // <--- СОХРАНЯЕМ БАЛАНС
    initializeGame(); // Setup and start the game
});

// Cash Out button
cashOutButton.addEventListener('click', () => {
    if (gameStarted && safeCellsClickedThisRound > 0) { // Can only cash out if game started and at least one safe cell revealed
        endGame(true); // Player wins by cashing out
    } else {
        resultText.textContent = 'No active game or no safe cells revealed to cash out from.';
    }
});

// --- Initial Setup on Page Load ---
generateBoardHTML(); // Draw the initial 5x5 board
updateDisplay();     // Update initial balance and bet display
