# RS3 Shop Tracker

A sleek, automated RuneScape 3 Shop Tracker built specifically for the **Alt1 Toolkit**. This app dynamically tracks your progress toward purchasing shop rewards and automatically updates in real-time by reading your chatbox for currency drops!

## Features
- ⚔️ **Live OCR Integration**: Instantly reads your chatbox for currency gains (Marks of War, Slayer Points, Beans, etc.) using Alt1 and updates your remaining tasks.
- 🎯 **All Major Shops Supported**: Slayer, Reaper, Thaler, Estate Agent, War's Wares, Farmers' Market, Dungeoneering, and Artisans' Workshop.
- 📈 **Dynamic Enrage & Hard Mode Scaling**: Automatically scales Marks of War rewards for Telos, Zamorak, and Arch-Glacor when Enrage is toggled.
- ⚒️ **Burial Armour Calculations**: Automatically calculates massive XP gains for Smithing tasks at the Artisans' Workshop.
- ✨ **Premium Glassmorphism UI**: Beautiful dark mode aesthetics with responsive, animated components.

## How to use in Alt1
Because this app runs entirely as a front-end client, you can use it instantly inside the Alt1 Toolkit!

1. Open your **Alt1 Toolkit**.
2. Click the **Browser** icon.
3. Paste in your hosted GitHub Pages URL (e.g. `https://cook0001.github.io/RS3-shops/`).
4. Select your desired shop and item.
5. Click **Start OCR** and make sure your chatbox is visible on-screen!

## Local Development

If you want to modify the application, the UI logic is written in TypeScript and bundled via Webpack.

### Prerequisites
- Node.js installed on your machine.

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npm run watch
   ```
4. When you are ready for production, compile the minified bundle:
   ```bash
   npm run build
   ```

## Generating Data
The data for all shops is statically generated from the official RuneScape Wiki. If new items or bosses are added to the game, you can simply run the scraper to fetch the latest drops:
```bash
node scrape.js
```
This will automatically generate a fresh `data.js` file with all the newest rates.
