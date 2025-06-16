const [, , carArg = '1', betArg = '100', roundsArg = '1000000', payoutArg] =
      process.argv;

const CHOSEN_CAR = +carArg;              // машина игрока
const BET        = +betArg;              // ставка
const ROUNDS     = +roundsArg;           // количество прогонов
const PAYOUT     = payoutArg ? +payoutArg : 2.9;   // множитель выигрыша

if (![1, 2, 3].includes(CHOSEN_CAR) || BET <= 0 || ROUNDS <= 0 || PAYOUT <= 0) {
  console.error('Пример: node race_sim.js 2 50 500000');
  process.exit(1);
}

/* --- параметры, 1-в-1 с racing.js ---------------------------------------- */
const RACE_LENGTH_PERCENT   = 90;
const BASE_SPEED            = 0.5;
const SPEED_VARIATION       = 0.3;
const NUM_SPEED_ZONES       = 3;
const SPEED_CHANGE_MAGNITUDE= 0.2;
/* ------------------------------------------------------------------------- */

// утилита ограничения скорости
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// один забег, возвращает id победителя (1..3)
function runRace() {
  // позиции и скорости
  const pos   = [0, 0, 0, 0]; // индексация с 1
  const speed = [0, 0, 0, 0];

  // генерируем стартовые скорости
  for (let c = 1; c <= 3; c++) {
    speed[c] = BASE_SPEED + (Math.random() * SPEED_VARIATION * 2 - SPEED_VARIATION);
  }

  // генерируем скоростные зоны
  const zones = {};
  for (let c = 1; c <= 3; c++) {
    zones[c] = [];
    for (let i = 0; i < NUM_SPEED_ZONES; i++) {
      const position = Math.random() * (RACE_LENGTH_PERCENT - 10) + 5; // 5-85 %
      const type     = Math.random() > 0.5 ? 1 : -1;                  // ускор / тормоз
      zones[c].push({ position, type, trig: false });
    }
    zones[c].sort((a, b) => a.position - b.position); // не обязательно, но удобно
  }

  /* пошаговая симуляция – шагаем, пока кто-то не пересёк 90 % */

  let winner = null;
  while (winner === null) {
    for (let c = 1; c <= 3; c++) {
      // проверяем зоны
      for (const z of zones[c]) {
        if (!z.trig && pos[c] >= z.position) {
          speed[c] = clamp(
            speed[c] + z.type * SPEED_CHANGE_MAGNITUDE,
            0.1,
            BASE_SPEED + SPEED_VARIATION * 2
          );
          z.trig = true;
        }
      }

      // двигаем машину
      if (pos[c] < RACE_LENGTH_PERCENT) {
        pos[c] += speed[c];
        if (pos[c] >= RACE_LENGTH_PERCENT && winner === null) {
          winner = c; // первый, кто пересёк, становится победителем
        }
      }
    }
  }
  return winner;
}

/* ---------------- главная симуляция ---------------- */

let balanceChange = 0;

for (let i = 0; i < ROUNDS; i++) {
  balanceChange -= BET; // списываем ставку

  const winner = runRace();
  if (winner === CHOSEN_CAR) {
    balanceChange += BET * PAYOUT;
  }
}

const totalWagered = BET * ROUNDS;
const RTP = ((totalWagered + balanceChange) / totalWagered) * 100;

console.log(`>>> car=${CHOSEN_CAR}, bet=${BET}, rounds=${ROUNDS}, payout=${PAYOUT}`);
console.log(`Player's total profit: ${balanceChange.toFixed(2)}`);
console.log(`RTP: ${RTP.toFixed(4)} %`);
