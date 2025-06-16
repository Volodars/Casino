// mines-sim.js
//---------------------------------------------------------------
// Настройки симуляции
const RUNS          = 1_000_000;  // сколько раз повторяем каждый сценарий
const HOUSE_EDGE    = 0.98;       // такой же, как в твоём front-end коде
const BET_AMOUNT    = 100;        // фиксированная ставка

//---------------------------------------------------------------
// Подсчёт теоретического мультипликатора (как в mines.js)
function calcMultiplier(totalCells, mines, safeClicks, houseEdge = HOUSE_EDGE) {
  let probProduct = 1.0;
  for (let i = 0; i < safeClicks; i++) {
    const cellsLeft      = totalCells - i;
    const safeCellsLeft  = (totalCells - mines) - i;
    probProduct *= safeCellsLeft / cellsLeft;
  }
  return houseEdge / probProduct;      // «обратная вероятность» с учётом house edge
}

//---------------------------------------------------------------
// Симуляция одной партии.  Возвращает выплату (0 или bet*mult)
function simulateRound(rows, cols, mines, safeClicks, bet) {
  const totalCells = rows * cols;

  // --- Расставляем мины -----------------------------------------------------
  const mineSet = new Set();
  while (mineSet.size < mines) {
    mineSet.add(Math.floor(Math.random() * totalCells)); // индекс клетки 0..N-1
  }

  // --- Игрок кликает safeClicks клеток --------------------------------------
  const opened = new Set();
  for (let click = 0; click < safeClicks; click++) {
    let cell;
    // выбираем случайную НЕКЛИКНУТУЮ клетку
    do { cell = Math.floor(Math.random() * totalCells); }
    while (opened.has(cell));
    opened.add(cell);

    if (mineSet.has(cell)) {         // взорвался
      return 0;
    }
  }

  // --- Выжил -> кэшаут -------------------------------------------------------
  const mult = calcMultiplier(totalCells, mines, safeClicks);
  return bet * mult;
}

//---------------------------------------------------------------
// Универсальная функция для серии симуляций
function runSimulation({ rows, cols, mines, safeClicks, runs = RUNS, bet = BET_AMOUNT }) {
  let totalPayout = 0;
  for (let i = 0; i < runs; i++) {
    totalPayout += simulateRound(rows, cols, mines, safeClicks, bet);
  }

  const totalBet = runs * bet;
  const rtp      = (totalPayout / totalBet) * 100;
  const avgMult  = totalPayout / (runs * bet);
  const winProb  = avgMult / calcMultiplier(rows * cols, mines, safeClicks); // приближённо

  return {
    rows, cols, mines, safeClicks, runs,
    rtp, avgMult, winProb
  };
}

//---------------------------------------------------------------
// Сценарии, которые нужно протестировать
const scenarios = [
  { rows: 3, cols: 3, mines: 4, safeClicks: 4 },
  { rows: 5, cols: 5, mines: 4, safeClicks: 4 },
  { rows: 9, cols: 9, mines: 4, safeClicks: 4 },
];

//---------------------------------------------------------------

for (const sc of scenarios) {
  const res = runSimulation(sc);
  console.log(
    `${sc.rows}x${sc.cols}, mines=${sc.mines}, opens=${sc.safeClicks}`.padEnd(25),
    `| RTP ≈ ${res.rtp.toFixed(2)}%`,
    `| Avg mult: ${res.avgMult.toFixed(3)}x`,
    `| Win prob: ${(res.winProb * 100).toFixed(2)}%`
  );
}

console.log('\nDone.');
