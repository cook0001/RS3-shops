# RS3 Shop Tracker

A sleek, automated RuneScape 3 Shop Tracker built specifically for the **Alt1 Toolkit**. This app dynamically tracks your progress toward purchasing shop rewards and automatically updates in real-time by reading your chatbox for currency drops!

## Features
- 🤖 **Tesseract AI OCR**: Bypasses traditional pixel-matching limitations. Perfectly reads your chatbox regardless of anti-aliasing, interface scaling, or colored chat text!
- 🎯 **AI Auto-Detect Chatbox**: No more drawing boxes manually! The app scans your game window and uses AI bounding box detection to lock onto your chatbox instantly.
- ⏱️ **Timestamp Deduplication**: Flawlessly filters out duplicate messages by tracking exact in-game timestamps. Never miss or double-count a drop again!
- 📊 **All Major Shops Supported**: Slayer, Reaper, Thaler, Estate Agent, War's Wares, Farmers' Market, Dungeoneering, and Artisans' Workshop.
- 📈 **Dynamic Enrage & Hard Mode**: Automatically scales Marks of War rewards for Telos, Zamorak, and Arch-Glacor based on entered Enrage.
- ✨ **Premium Glassmorphism UI**: Beautiful dark mode aesthetics with responsive, animated components.

## How to use in Alt1
Because this app runs entirely as a front-end client, you can use it instantly inside the Alt1 Toolkit!

1. Open this URL in a normal browser: 
   ```text
   https://cook0001.github.io/RS3-shops/
   ```
2. If you have Alt1 Toolkit installed, Alt1 will automatically detect the app configuration. 
3. Alternatively, you can click this direct installation link to prompt Alt1 to install it:
   [Click here to Install App](https://cook0001.github.io/RS3-shops/install.html)
4. Once added, select your desired shop and item.
5. Click **Start OCR** and make sure your chatbox is visible on-screen!

## Local Development

If you want to modify the application, the UI logic is written in TypeScript and bundled via Webpack.

### Prerequisites
- Node.js version 24 or higher installed on your machine.

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
