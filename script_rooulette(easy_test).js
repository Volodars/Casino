const canvas = document.getElementById('slotCanvas');
const ctx = canvas.getContext('2d');

const reelCount = 3;
const reelSymbols = ['🍒', '🍋', '🔔', '🍉', '7️⃣', '⭐'];
const reelWidth = canvas.width / reelCount;
const reelHeight = canvas.height;

function drawReels(symbols) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Нарисуем фон для барабанов (полупрозрачный)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for(let i = 0; i < reelCount; i++) {
    ctx.fillRect(reelWidth * i, 0, reelWidth, reelHeight);
  }

  // Нарисуем разделительные линии между барабанами
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for(let i = 1; i < reelCount; i++) {
    ctx.beginPath();
    ctx.moveTo(reelWidth * i, 0);
    ctx.lineTo(reelWidth * i, reelHeight);
    ctx.stroke();
  }

  // Нарисуем символы по центру каждого барабана
  ctx.font = '80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';

  for(let i = 0; i < reelCount; i++) {
    ctx.fillText(symbols[i], reelWidth * i + reelWidth / 2, reelHeight / 2);
  }
}

// При старте показываем случайные символы
const initialSymbols = Array.from({length: reelCount}, () => {
  return reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
});
drawReels(initialSymbols);

const spinButton = document.getElementById('spinButton');
const resultText = document.getElementById('resultText');

spinButton.addEventListener('click', () => {
  spinButton.disabled = true; // Блокируем кнопку пока крутится
  resultText.textContent = '';

  let spinCount = 0;
  const maxSpins = 20;  // сколько "кадров" прокрутки будет

  // Анимация прокрутки
  const spinInterval = setInterval(() => {
    // Генерируем новые случайные символы для анимации
    currentSymbols = Array.from({length: reelCount}, () => {
      return reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
    });

    drawReels(currentSymbols);
    spinCount++;

    if(spinCount >= maxSpins) {
      clearInterval(spinInterval);

      // Финальные символы — новые случайные
      currentSymbols = Array.from({length: reelCount}, () => {
        return reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
      });

      drawReels(currentSymbols);

      // Проверка выигрыша
      const isWin = currentSymbols.every(s => s === currentSymbols[0]);
      resultText.textContent = isWin ? 'You win! 🎉' : 'Try again!';

      spinButton.disabled = false; // Включаем кнопку обратно
    }
  }, 50); // обновлять каждые 100 мс
});

