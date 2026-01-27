let validWords = [];
let secretWord = "";
let currentRow = 0;
let currentCol = 0;
let gameOver = false;

const grid = document.getElementById("grid");
const message = document.getElementById("message");
const keyboard = document.getElementById("keyboard");

const letters = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

async function loadDictionary() {
  const res = await fetch("palavras.dic");
  const text = await res.text();

  validWords = text
    .split("\n")
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length === 7);

  newGame();
}

function initGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.onclick = () => {
        if (gameOver) return;
        if (i !== currentRow) return; // só permite editar a linha atual
        selectCell(j);
      };
      row.appendChild(cell);
    }

    grid.appendChild(row);
  }
}

function initKeyboard() {
  keyboard.innerHTML = "";

  // letras
  letters.forEach(l => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.type = "button";
    btn.textContent = l;
    btn.onclick = () => insertLetter(l);
    keyboard.appendChild(btn);
  });

  // apagar
  const back = document.createElement("button");
  back.className = "key";
  back.type = "button";
  back.textContent = "⌫";
  back.onclick = backspace;
  keyboard.appendChild(back);

  // avançar
  const next = document.createElement("button");
  next.className = "key";
  next.type = "button";
  next.textContent = "→";
  next.onclick = () => {
    if (gameOver) return;
    if (currentCol < 6) {
      currentCol++;
      updateActiveCell();
    }
  };
  keyboard.appendChild(next);
}

function selectCell(col) {
  currentCol = col;
  updateActiveCell();
}

function updateActiveCell() {
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("active"));
  const row = grid.children[currentRow];
  if (!row) return;
  const cell = row.children[currentCol];
  if (!cell) return;
  cell.classList.add("active");
}

function insertLetter(letter) {
  if (gameOver) return;

  const row = grid.children[currentRow];
  if (!row) return;

  const cell = row.children[currentCol];
  if (!cell) return;

  cell.textContent = letter;

  if (currentCol < 6) {
    currentCol++;
    updateActiveCell();
  }
}

function backspace() {
  if (gameOver) return;

  const row = grid.children[currentRow];
  if (!row) return;

  // se a célula atual estiver vazia, volta uma antes
  if (row.children[currentCol].textContent === "" && currentCol > 0) {
    currentCol--;
  }

  row.children[currentCol].textContent = "";
  updateActiveCell();
}

/**
 * Retorna a palavra da linha atual OU null se faltar alguma letra.
 */
function getCurrentGuess() {
  const row = grid.children[currentRow];
  if (!row) return null;

  const cells = [...row.children];
  const lettersRow = cells.map(c => c.textContent);

  if (lettersRow.some(l => l === "")) return null;

  return lettersRow.join("");
}

function markKeyWrong(letter) {
  document.querySelectorAll(".key").forEach(k => {
    if (k.textContent === letter) {
      // não rebaixa se já foi marcado como "boa"
      if (!k.classList.contains("used-good")) {
        k.classList.add("used-wrong");
      }
    }
  });
}

function markKeyGood(letter) {
  document.querySelectorAll(".key").forEach(k => {
    if (k.textContent === letter) {
      k.classList.remove("used-wrong");
      k.classList.add("used-good");
    }
  });
}

function checkGuess() {
  if (gameOver) return;

  const guess = getCurrentGuess();

  if (!guess) {
    message.textContent = "Preencha todas as 7 letras.";
    return;
  }

  if (!validWords.includes(guess)) {
    message.textContent = "Palavra não existe no banco de dados.";
    return;
  }

  message.textContent = "";

  const row = grid.children[currentRow];
  const secretArray = secretWord.split("");
  const guessArray = guess.split("");

  // limpa classes antigas da linha (caso revalide)
  [...row.children].forEach(c => c.classList.remove("correct", "present"));

  // PASSO 1: acertos exatos
  guessArray.forEach((letter, i) => {
    const cell = row.children[i];
    if (letter === secretArray[i]) {
      cell.classList.add("correct");
      secretArray[i] = null;
      markKeyGood(letter);
    }
  });

  // PASSO 2: presentes fora da posição / ausentes
  guessArray.forEach((letter, i) => {
    const cell = row.children[i];

    if (!cell.classList.contains("correct")) {
      const index = secretArray.indexOf(letter);
      if (index !== -1) {
        cell.classList.add("present");
        secretArray[index] = null;
        markKeyGood(letter);
      } else {
        markKeyWrong(letter);
      }
    }
  });

  // vitória
  if (guess === secretWord) {
    message.textContent = "Parabéns! Você acertou.";
    launchConfetti();
    gameOver = true;
    return;
  }

  // próxima tentativa
  currentRow++;
  currentCol = 0;

  if (currentRow >= 6) {
    message.textContent = `A palavra era ${secretWord}.`;
    gameOver = true;
    return;
  }

  updateActiveCell();
}

function newGame() {
  if (!validWords.length) return;

  secretWord = validWords[Math.floor(Math.random() * validWords.length)];
  currentRow = 0;
  currentCol = 0;
  gameOver = false;

  message.textContent = "";
  initGrid();
  initKeyboard();
  updateActiveCell();

  // limpa confetti
  const canvas = document.getElementById("confetti");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function launchConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 4,
    dy: Math.random() * 4 + 2
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    pieces.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.dy;
    });
    requestAnimationFrame(draw);
  }

  draw();
}

document.getElementById("confirmBtn").onclick = checkGuess;
document.getElementById("newWordBtn").onclick = newGame;

loadDictionary();
