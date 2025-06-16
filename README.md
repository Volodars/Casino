# [Casino Project](https://volodars.github.io/Casino/Menu.html)
### 🎰 Casino Web Application

This repository hosts a personal web application project, "Casino," developed using vanilla HTML, CSS, and JavaScript. The application provides users with several popular casino games, integrated with a balance system, promo code redemption functionality, and game progress saving features.


### ✨ Key Features

* **Multi-Game Functionality:**
    * **Blackjack:** The classic "21" card game against a dealer.
    * **Casino War:** A simple card comparison game.
    * **Heads or Tails:** A simple coin flip game of chance.
    * **Dice (Cubs):** A dice rolling game.
    * **Fortune Wheel:** A Wheel of Fortune for balance bonuses.
    * **Mines:** A strategic game where players uncover tiles while avoiding hidden mines.
    * **Poker:** A Poker card game.
    * **Races:** An exciting racing game with dynamic car speed changes.
    * **Roulette:** European roulette with standard betting options.
    * **Slot Machine:** A classic slot machine experience.
* **Player Balance System:** A unified balance that persists across different game pages and sessions.
* **Promo Code System:** Allows users to redeem one-time or recurring promo codes to receive balance bonuses.
* **Sound Effects:** Engaging audio feedback for various in-game actions enhances the user experience.
* **Responsive Design:** The user interface is optimized for various screen sizes, including desktop, tablets, and mobile devices.
* **Game State Persistence:** Progress in the Mines game is saved, enabling users to resume their game after navigating away or closing the page.
* **Dynamic Card Imagery:** Blackjack and Casino War utilize pre-loaded card images, contributing to visually appealing gameplay.


### 🚀 Technologies Used

* **HTML5:** For structuring the web pages.
* **CSS3:** For styling the application and implementing responsive layouts.
* **JavaScript:** For all interactive game logic, balance management, and promo code functionality.


### 📈 RTP and Game Fairness

Each game is carefully tuned with **theoretical Return to Player (RTP)** values based on game mechanics, simulations, and risk models. These values ensure fairness while maintaining a reasonable house edge.

| Game               | RTP Estimate   | Notes                                                                 |
|--------------------|----------------|-----------------------------------------------------------------------|
| 🎰 Slot Machine     | ~96.5 %        | Based on symbol probabilities and multipliers                        |
| 🎲 Dice             | ~95.7 – 98.1 % | Varies by chosen condition (equal, less, greater)                    |
| 🧨 Mines            | ~97.4 %        | Depends on number of mines and revealed tiles                        |
| 🃏 Blackjack         | ~94.5 – 99 %   | Based on dealer behavior and player's strategy (no advanced options)|
| 🎮 Casino War        | ~97.8 %        | With pure chance-based outcomes and adjusted payouts                 |
| 💰 Heads or Tails   | ~95.8 – 98.1 % | Includes rare "Edge" with high payout                                |
| 🎯 Roulette          | ~97.2 %        | Based on European-style single zero format                           |
| 🐎 Races             | ~96.66 %       | Equal odds with slight randomness via speed zones                    |
| 🂡 Poker             | ~98.04 %       | Based on simplified one-round rules and payouts                      |
| 🎡 Wheel of Fortune | ~100 %         | No cost to spin, fully bonus-based                                   |

> All odds and RTPs are based on test simulations and may vary slightly. [The example of simulation](RTP/RTP.png)
> See full payout breakdowns in [`Rules.html`](Rules.html).


### 📁 Project Structure


│   Menu.html
│   README.md
│   Rules.html
│
├───Games
│       Blackjack.html
│       Casino\_War.html
│       Coin.html
│       Cubs.html
│       Fortune.html
│       Mines.html
│       Poker.html
│       Racing.html
│       Roulette.html
│       Slots.html
│
├───Images
│   │   \[various game previews, backgrounds, icons]
│   ├───Anime\_cards
│   │       \[full deck assets for Blackjack and Poker]
│   └───Mobile\_fons
│           \[mobile-optimized backgrounds for each game]
│
├───JavaScript
│       \[one file per game + promo system and menu handler]
│
├───Music
│       \[sound effects for cards, races, spinning, etc.]
│
├───RTP
│       \[simulation files for each game]
│
└───Styles
backgrounds.css
styles.css


### 💡 Future Enhancements & Ideas

* **Additional Games:** Expanding the game library.
* **User Account System:** Implementing user registration, login, and server-side progress saving.
* **Enhanced Graphics & Animations:** Further refining the UI/UX with more advanced animations and visual effects.
* **Advanced Blackjack Mechanics:** Adding features like Double Down, Split, and Insurance.
* **Mines Board Themes:** Introducing different visual themes for the Mines game.
* **Interactive Balance Management:** Allowing direct deposit and withdrawal of balance within the application interface (currently limited to promo codes).
```
