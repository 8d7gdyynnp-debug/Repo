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

let audioCtx = null;

function getAudioContext() {
  if (audioCtx) return audioCtx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioCtx = new AudioContextClass();
  unlockAudioContext(audioCtx);
  return audioCtx;
}

// iOS Safari needs an actual sound (even a silent one) started synchronously
// inside the first user gesture to fully wake up its audio hardware -
// resume() alone isn't always enough.
function unlockAudioContext(ctx) {
  const unlockBuffer = ctx.createBuffer(1, 1, 22050);
  const unlockSource = ctx.createBufferSource();
  unlockSource.buffer = unlockBuffer;
  unlockSource.connect(ctx.destination);
  unlockSource.start(0);
  if (ctx.resume) ctx.resume();
}

function playPlop() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

function playWave() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const duration = 1.6;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.linearRampToValueAtTime(1300, now + duration * 0.4);
  filter.frequency.linearRampToValueAtTime(150, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + duration * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function playBoo() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const duration = 1.1;
  const voiceFreqs = [146, 151, 155, 161];

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.15);
  masterGain.gain.setValueAtTime(0.22, now + duration * 0.55);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  filter.connect(masterGain).connect(ctx.destination);

  voiceFreqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.9 / voiceFreqs.length;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq, now + duration * 0.6);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + duration);

    osc.connect(oscGain).connect(filter);
    osc.start(now);
    osc.stop(now + duration);
  });
}

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
  playPlop();
  checkResult(player);
}

function checkResult(player) {
  if (hasWinner(board, player)) {
    statusText.textContent = `${NAME[player]} wins! 🎉`;
    gameActive = false;
    playWave();
    return;
  }

  if (!board.includes("")) {
    statusText.textContent = "It's a draw! 🌊";
    gameActive = false;
    playBoo();
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
