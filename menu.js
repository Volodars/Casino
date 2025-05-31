// Script to load player balance from localStorage or set default
        document.addEventListener('DOMContentLoaded', () => {
            const balanceAmountSpan = document.getElementById('balanceAmount');
            let playerBalance = localStorage.getItem('playerBalance');
            if (playerBalance) {
                // Ensure balance is displayed with two decimal places
                balanceAmountSpan.textContent = parseFloat(playerBalance).toFixed(2);
            } else {
                // If balance not found, set default value and save it
                playerBalance = 0;
                localStorage.setItem('playerBalance', playerBalance.toFixed(2));
                balanceAmountSpan.textContent = playerBalance.toFixed(2);
            }
        });
