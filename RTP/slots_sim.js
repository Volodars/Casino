// -----------------  ПАРАМЕТРЫ АППАРАТА  -----------------
const reelCount = 3;          // число барабанов
const symbolsPerReel = 3;     // видимых рядов

// Таблица частот (чем чаще - тем выше шанс)
const reelSymbols = [
  '🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒', // 10
  '🍋','🍋','🍋','🍋','🍋','🍋','🍋',               // 7
  '🔔','🔔','🔔','🔔','🔔',                         // 5
  '🍉','🍉','🍉','🍉',                              // 4
  '7️⃣','7️⃣',                                     // 2
  '⭐'                                              // 1
];

// Множители выплаты за ЛЮБУЮ из 5 линий (гор/диаг) из 3 одинаковых
const symbolMultipliers = { '🍒':1.4, '🍋':3, '🔔':5, '🍉':12, '7️⃣':80, '⭐':700 };

// -----------------  ИГРОВЫЕ ФУНКЦИИ  -----------------
function getRandomSymbol(){
  return reelSymbols[Math.floor(Math.random()*reelSymbols.length)];
}

// возвращает массив 3×3, сгенерированный случайно
function spinOnce(){
  const reels=[];
  for (let c=0;c<reelCount;c++){
    const col=[];
    for (let r=0;r<symbolsPerReel;r++) col.push(getRandomSymbol());
    reels.push(col);
  }
  return reels;
}

// проверяем 3 горизонтали + 2 диагонали
function checkWin(reels){
  const size = reels[0].length;             // =3
  let best = 0;

  // горизонтали
  for (let row=0;row<size;row++){
    const line = reels.map(col=>col[row]);
    if (line.every(s=>s===line[0])) best = Math.max(best, symbolMultipliers[line[0]]);
  }

  // диагональ ↘
  const d1 = [...Array(size)].map((_,i)=>reels[i][i]);
  if (d1.every(s=>s===d1[0])) best = Math.max(best, symbolMultipliers[d1[0]]);

  // диагональ ↙
  const d2 = [...Array(size)].map((_,i)=>reels[i][size-1-i]);
  if (d2.every(s=>s===d2[0])) best = Math.max(best, symbolMultipliers[d2[0]]);

  return best;          // 0 если нет совпадения
}

// -----------------  СИМУЛЯТОР  -----------------
function simulate(totalSpins=1e6, bet=100){
  let wager=0, win=0;
  for (let i=0;i<totalSpins;i++){
    const reels = spinOnce();
    const multiplier = checkWin(reels);
    wager += bet;
    win   += bet * multiplier;
  }
  const rtp = (win/wager)*100;
  console.log(`Spins: ${totalSpins.toLocaleString()}`);
  console.log(`Total wagered: $${wager.toLocaleString()}`);
  console.log(`Total won:     $${win.toLocaleString()}`);
  console.log(`RTP: ${rtp.toFixed(2)} %`);
}

// Запускаем с параметром из CLI: node slots_sim.js 5000000
const spinsArg = parseInt(process.argv[2],10) || 1000000;
simulate(spinsArg);
