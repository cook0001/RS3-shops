const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// We have to mock DOM/browser APIs for Alt1
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') return createCanvas(1, 1);
        return {};
    }
};

// We just need the OCR module
const ocr = require('./node_modules/@alt1/ocr/dist/index.bundle.js');
const font12 = require('./node_modules/@alt1/chatbox/fonts/12pt.fontmeta.json');
const font10 = require('./node_modules/@alt1/chatbox/fonts/10pt.fontmeta.json');
const font14 = require('./node_modules/@alt1/chatbox/fonts/14pt.fontmeta.json');
const font16 = require('./node_modules/@alt1/chatbox/fonts/16pt.fontmeta.json');

// Mix color function manually
function mixColor(r, g, b) {
    return (b << 16) | (g << 8) | r;
}

const colors = [
    mixColor(255, 255, 255), // White
    mixColor(127, 169, 255), // Light Blue
    mixColor(255, 128, 0), // Orange
    mixColor(0, 255, 0), // Green
];

async function run() {
    const imgPath = 'C:/Users/danie/.gemini/antigravity/brain/108db3e6-fbd5-498d-9543-d9a84e4ce737/.user_uploaded/media__1784444190423.png';
    const image = await loadImage(imgPath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // Mock ImageData structure required by Alt1
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imgData.getPixel = function(x, y) {
        let i = (y * this.width + x) * 4;
        return [this.data[i], this.data[i+1], this.data[i+2], this.data[i+3]];
    };
    imgData.pixelCompare = function(img2, x, y, max = Infinity) { return Infinity; }; // Stub

    console.log("Image loaded:", image.width, "x", image.height);

    const fonts = [
        {name: "10pt", def: font10},
        {name: "12pt", def: font12},
        {name: "14pt", def: font14},
        {name: "16pt", def: font16}
    ];

    for (let f of fonts) {
        console.log(`\n--- TRYING ${f.name} ---`);
        for (let y = 0; y < Math.min(100, image.height); y++) {
            // We just try x = 0 to 50
            for (let x = 0; x < 50; x++) {
                let text = ocr.readLine(imgData, f.def, colors, x, y, true, false);
                if (text && text.text && text.text.length > 5) {
                    console.log(`[${f.name}] y=${y}, x=${x} -> ${text.text}`);
                }
            }
        }
    }
}

run().catch(console.error);
