/*  roulette-sim.js
    very-quick Monte-Carlo for your roulette logic
    ────────────────────────────────────────────── */

////////////////// 1) Скопировали константы из roulette.js
const ROULETTE_NUMBERS = [
  { num: 0,  color:'green'},
  { num:32, color:'red' }, { num:15, color:'black'}, { num:19, color:'red' },
  { num:4,  color:'black'}, { num:21, color:'red' }, { num:2,  color:'black'},
  { num:25, color:'red' }, { num:17, color:'black'}, { num:34, color:'red' },
  { num:6,  color:'black'}, { num:27, color:'red' }, { num:13, color:'black'},
  { num:36, color:'red' }, { num:11, color:'black'}, { num:30, color:'red' },
  { num:8,  color:'black'}, { num:23, color:'red' }, { num:10, color:'black'},
  { num:5,  color:'red' }, { num:24, color:'black'}, { num:16, color:'red' },
  { num:33, color:'black'}, { num:1,  color:'red' }, { num:20, color:'black'},
  { num:14, color:'red' }, { num:31, color:'black'}, { num:9,  color:'red' },
  { num:22, color:'black'}, { num:18, color:'red' }, { num:29, color:'black'},
  { num:7,  color:'red' }, { num:28, color:'black'}, { num:12, color:'red' },
  { num:35, color:'black'}, { num:3,  color:'red' }, { num:26, color:'black'}
];
const MUL_COLOR = 2;          // red / black
const MUL_GREEN = 35;         // bet on 0   (мы сделали «green» отдельным типом)
const MUL_NUMBER = 35;        // точное число

////////////////// 2) Настройки симуляции
const BET = 1;                // 1 единица на каждый спин
const N   = 10_000_000;       // число спинов (10 млн ≈ 2-3 cек.)
const STRATEGY = 'color-red'; // 'color-red', 'color-black', 'color-green', или 'number-17'

////////////////// 3) Вспомогалка
function randomSector() {
  return ROULETTE_NUMBERS[Math.floor(Math.random()*ROULETTE_NUMBERS.length)];
}

////////////////// 4) Главный цикл
let balanceChange = 0;
for (let i=0;i<N;i++){
  balanceChange -= BET;                 // сразу списали ставку
  const {num,color}=randomSector();     // выпал сектор

  switch(STRATEGY){
    case 'color-red':
      if (color==='red')   balanceChange += BET*MUL_COLOR;
      break;
    case 'color-black':
      if (color==='black') balanceChange += BET*MUL_COLOR;
      break;
    case 'color-green':
      if (color==='green') balanceChange += BET*MUL_GREEN;
      break;
    case 'number-17':      // можно заменить на любой номер
      if (num===17)        balanceChange += BET*MUL_NUMBER;
      break;
  }
}

////////////////// 5) Итоговые цифры
const rtp = 100 * (1 + balanceChange / (BET*N)); // 1 — это 100 % ставки
console.log(`Strategy: ${STRATEGY}`);
console.log(`Spins:    ${N.toLocaleString()}`);
console.log(`Net Δ:    ${balanceChange.toFixed(2)}`);
console.log(`RTP ≈     ${rtp.toFixed(3)} %`);
