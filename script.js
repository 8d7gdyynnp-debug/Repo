const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const resetButton = document.getElementById("reset");
const modeInputs = document.querySelectorAll('input[name="mode"]');

const HUMAN = "X";
const COMPUTER = "O";
const SYMBOL = { X: "🌴", O: "🌺" };
const NAME = { X: "Palm Tree", O: "Hibiscus" };

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = HUMAN;
let gameActive = true;
let mode = "2player"; // "2player" or "computer"

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function hasWinner(testBoard, player) {
  return winningCombos.some(([a, b, c]) =>
    testBoard[a] === player && testBoard[b] === player && testBoard[c] === player
  );
}

function handleCellClick(event) {
  const cell = event.target;
  const index = Number(cell.getAttribute("data-index"));

  if (board[index] !== "" || !gameActive) {
    return;
  }
  if (mode === "computer" && currentPlayer !== HUMAN) {
    return;
  }

  makeMove(index, currentPlayer);

  if (gameActive && mode === "computer" && currentPlayer === COMPUTER) {
    statusText.textContent = `${NAME[COMPUTER]} is thinking...`;
    setTimeout(computerMove, 500);
  }
}

function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = SYMBOL[player];
  cell.disabled = true;
  checkResult(player);
}

function checkResult(player) {
  if (hasWinner(board, player)) {
    statusText.textContent = `${NAME[player]} wins! 🎉`;
    gameActive = false;
    return;
  }

  if (!board.includes("")) {
    statusText.textContent = "It's a draw! 🌊";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === HUMAN ? COMPUTER : HUMAN;
  statusText.textContent = `${NAME[currentPlayer]}'s turn`;
}

function computerMove() {
  if (!gameActive) return;
  const { index } = bestMove();
  makeMove(index, COMPUTER);
}

// Unbeatable computer opponent using the minimax algorithm.
function bestMove(testBoard = board) {
  return minimax(testBoard, COMPUTER);
}

function minimax(testBoard, player) {
  const emptySpots = testBoard
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);

  if (hasWinner(testBoard, HUMAN)) return { score: -10 };
  if (hasWinner(testBoard, COMPUTER)) return { score: 10 };
  if (emptySpots.length === 0) return { score: 0 };

  const moves = emptySpots.map((index) => {
    testBoard[index] = player;
    const nextPlayer = player === COMPUTER ? HUMAN : COMPUTER;
    const result = minimax(testBoard, nextPlayer);
    testBoard[index] = "";
    return { index, score: result.score };
  });

  return player === COMPUTER
    ? moves.reduce((best, m) => (m.score > best.score ? m : best))
    : moves.reduce((best, m) => (m.score < best.score ? m : best));
}

function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = HUMAN;
  gameActive = true;
  statusText.textContent = `${NAME[HUMAN]}'s turn`;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.disabled = false;
  });
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
resetButton.addEventListener("click", resetGame);
modeInputs.forEach((input) =>
  input.addEventListener("change", (event) => {
    mode = event.target.value;
    resetGame();
  })
);
