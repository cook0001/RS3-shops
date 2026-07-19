const fs = require('fs');
const Tesseract = require('tesseract.js');

async function testOCR() {
    const imgPath = 'C:/Users/danie/.gemini/antigravity/brain/108db3e6-fbd5-498d-9543-d9a84e4ce737/.user_uploaded/media__1784467062402.png';
    console.log("Starting Tesseract test on:", imgPath);
    
    try {
        const { data: { text } } = await Tesseract.recognize(
            imgPath,
            'eng',
            { logger: m => {} } // hide noisy logger
        );
        console.log("--- OCR RESULT ---");
        console.log(text);
    } catch (e) {
        console.error("OCR Failed:", e);
    }
}

testOCR();
