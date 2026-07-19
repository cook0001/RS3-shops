import * as a1lib from '@alt1/base';
const ChatBoxModule = require('@alt1/chatbox');
const ChatBoxReader = ChatBoxModule.default || ChatBoxModule;

// Declare globals loaded from data.js
declare var shopData: any;
declare var taskRates: any;

// Elements
const shopSelect = document.getElementById('shop-select') as HTMLSelectElement;
const itemSelect = document.getElementById('item-select') as HTMLSelectElement;
const rateSelect = document.getElementById('rate-select') as HTMLSelectElement;
const rateLabel = document.getElementById('rate-label') as HTMLElement;
const itemCostInput = document.getElementById('item-cost') as HTMLInputElement;
const quantityInput = document.getElementById('item-quantity') as HTMLInputElement;
const currentCurrencyInput = document.getElementById('current-currency') as HTMLInputElement;
const tasksNeededEl = document.getElementById('tasks-needed') as HTMLElement;
const taskLabelEl = document.getElementById('task-label') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const remainingText = document.getElementById('remaining-currency-text') as HTMLElement;
const btnOcr = document.getElementById('btn-ocr') as HTMLButtonElement;
const ocrStatus = document.getElementById('ocr-status') as HTMLElement;
const burialContainer = document.getElementById('burial-container') as HTMLElement;
const burialCheckbox = document.getElementById('burial-checkbox') as HTMLInputElement;
const hardmodeContainer = document.getElementById('hardmode-container') as HTMLElement;
const hardmodeCheckbox = document.getElementById('hardmode-checkbox') as HTMLInputElement;
const enrageInputContainer = document.getElementById('enrage-input-container') as HTMLElement;
const enrageInput = document.getElementById('enrage-input') as HTMLInputElement;

// State
let selectedShop: string | null = null;
let selectedItem: string | null = null;

// Alt1 OCR State
let reader: any = null;
let ocrInterval: NodeJS.Timeout | null = null;
let isOcrRunning = false;
let lastCurrencyDrop = 0;
let processedLines = new Set<string>();

let manualStep = 0;
let manualX1 = 0;
let manualY1 = 0;

function initReader() {
    if (!reader) {
        reader = new ChatBoxReader();
        reader.readargs.colors = [
            a1lib.mixColor(255, 255, 255), // White
            a1lib.mixColor(127, 169, 255), // Light Blue
            a1lib.mixColor(0, 255, 0),     // Green (Drops)
            a1lib.mixColor(255, 127, 0),   // Orange
            a1lib.mixColor(255, 255, 0),   // Yellow
            a1lib.mixColor(255, 0, 0)      // Red
        ];
    }
}

// Initialize App
function init() {
    // Populate shop dropdown
    Object.keys(shopData).forEach(shopName => {
        const option = document.createElement('option');
        option.value = shopName;
        option.textContent = shopName;
        shopSelect.appendChild(option);
    });

    // Check Alt1 Status
    if (window.alt1) {
        alt1.identifyAppUrl("./config.json");
        ocrStatus.textContent = "Alt1 active - Press Start OCR to read chatbox";
        ocrStatus.className = "status-text active";
        btnOcr.textContent = "Start OCR";
        btnOcr.disabled = false;
    } else {
        ocrStatus.textContent = "Alt1 not detected - Manual entry only";
        btnOcr.disabled = false; // Allow click to show warning
    }

    // Event Listeners
    shopSelect.addEventListener('change', handleShopChange);
    itemSelect.addEventListener('change', handleItemChange);
    rateSelect.addEventListener('change', calculate);
    quantityInput.addEventListener('input', calculate);
    burialCheckbox.addEventListener('change', calculate);
    hardmodeCheckbox.addEventListener('change', calculate);
    enrageInput.addEventListener('input', calculate);
    currentCurrencyInput.addEventListener('input', calculate);
    
    const btnManualChatbox = document.getElementById('btn-manual-chatbox') as HTMLButtonElement;
    
    // Set initial alt1 state
    if (window.alt1) {
        ocrStatus.textContent = "Alt1 detected - Ready to scan";
        ocrStatus.style.color = "#4ade80"; // Green
    }

    btnOcr.addEventListener('click', toggleOCR);

    btnManualChatbox.addEventListener('click', () => {
        if (!window.alt1) {
            ocrStatus.textContent = "Error: Alt1 not detected. Open this in Alt1 Toolkit.";
            return;
        }

        if (isOcrRunning) {
            toggleOCR(); // Stop OCR first
        }

        if (manualStep === 0) {
            manualStep = 1;
            ocrStatus.textContent = "Hover your mouse over the TOP-LEFT corner of the chat text and press Alt+1";
            ocrStatus.style.color = "#fbbf24"; // Yellow
            btnManualChatbox.innerHTML = '<span class="icon">❌</span> Cancel Setup';
            btnManualChatbox.style.background = "rgba(239, 68, 68, 0.2)";
            btnManualChatbox.style.borderColor = "rgba(239, 68, 68, 0.4)";
            
            a1lib.on('alt1pressed', handleManualAlt1Press);
        } else {
            cancelManualSetup();
        }
    });

    function cancelManualSetup() {
        manualStep = 0;
        ocrStatus.textContent = "Manual setup cancelled. Ready.";
        ocrStatus.style.color = "#4ade80"; // Green
        btnManualChatbox.innerHTML = '<span class="icon">🎯</span> Manual Chatbox';
        btnManualChatbox.style.background = "rgba(255, 255, 255, 0.05)";
        btnManualChatbox.style.borderColor = "rgba(255, 255, 255, 0.1)";
        // In @alt1/base, removeListener is standard, but some versions use off or removeListener. Try/catch to be safe.
        try { a1lib.removeListener('alt1pressed', handleManualAlt1Press); } catch(e) {}
    }

    function handleManualAlt1Press() {
        let pos = a1lib.getMousePosition();
        if (!pos) return;

        if (manualStep === 1) {
            manualX1 = pos.x;
            manualY1 = pos.y;
            manualStep = 2;
            ocrStatus.textContent = "Great! Now hover over the BOTTOM-RIGHT corner of the chat text and press Alt+1";
        } else if (manualStep === 2) {
            let x2 = pos.x;
            let y2 = pos.y;

            let x = Math.min(manualX1, x2);
            let y = Math.min(manualY1, y2);
            let w = Math.abs(x2 - manualX1);
            let h = Math.abs(y2 - manualY1);

            if (w < 50 || h < 20) {
                cancelManualSetup();
                ocrStatus.textContent = "Error: Bounding box too small. Try Manual Setup again.";
                ocrStatus.style.color = "#ef4444";
                return;
            }

            initReader();
            
            // Hardcode the position using the AFKWarden style
            reader.pos = {
                mainbox: {
                    rect: new a1lib.Rect(x, y, w, h),
                    line0x: 0,
                    line0y: h - 15,
                    timestamp: false,
                    leftfound: true
                },
                boxes: []
            };

            cancelManualSetup();
            ocrStatus.textContent = "Chatbox manually locked! Click 'Read Screen (OCR)' to start scanning.";
        }
    }
}

function toggleOCR() {
    try {
        if (!window.alt1) {
            alert("Alt1 Toolkit is required to read the screen. Please use manual entry.");
            return;
        }

        if (isOcrRunning) {
            // Stop OCR
            if (ocrInterval) clearInterval(ocrInterval);
            isOcrRunning = false;
            btnOcr.textContent = "Start OCR";
            btnOcr.classList.remove('active');
            ocrStatus.textContent = "OCR Stopped. Press Start to resume.";
            return;
        }

        // Start OCR
        if (!window.alt1.permissionPixel) {
            const configUrl = new URL('./config.json', document.location.href).href;
            ocrStatus.innerHTML = `Permission denied! <a href="alt1://addapp/${configUrl}">Click here to Install App</a>`;
            return;
        }

        if (!reader) {
            reader = new ChatBoxReader();
        }
        
        if (!window.alt1.rsWidth || !window.alt1.rsHeight) {
            ocrStatus.textContent = "Error: RuneScape window not detected by Alt1! Open Alt1 Settings -> Capture -> Change Capture Method until it detects the game.";
            return;
        }
        
        // Don't fail immediately if not found. Let the interval retry!
        try {
            const img = a1lib.captureHoldFullRs();
            if (img) reader.find(img);
        } catch (e: any) {
            if (e.message && e.message.includes("capturehold")) {
                ocrStatus.textContent = "Error: Cannot capture RuneScape screen. Ensure the game is open and not minimized.";
                return;
            }
            throw e;
        }

        isOcrRunning = true;
        btnOcr.textContent = "Stop OCR";
        btnOcr.classList.add('active');
        ocrStatus.textContent = "Scanning for chatbox...";

        ocrInterval = setInterval(() => {
            try {
                initReader();
                
                if (!reader.pos) {
                    reader.find();
                    if (!reader.pos) {
                        ocrStatus.textContent = "Searching for Chatbox... Please ensure it is visible, or use Manual Setup.";
                        return;
                    } else {
                        ocrStatus.textContent = "Chatbox auto-detected! Scanning for currency drops...";
                    }
                } else if (ocrStatus.textContent === "Scanning for chatbox...") {
                    ocrStatus.textContent = "Scanning chatbox for currency drops...";
                }

                const lines = reader.read() || [];
                const debugLog = document.getElementById('debug-log');
                
                lines.forEach(line => {
                    const text = line.text.toLowerCase().trim();
                    
                    // Display all raw OCR reads in the debug log for troubleshooting
                    if (debugLog && text.length > 2 && !processedLines.has(text)) {
                        const div = document.createElement('div');
                        div.textContent = `[${new Date().toLocaleTimeString()}] ${line.text}`;
                        debugLog.appendChild(div);
                        debugLog.scrollTop = debugLog.scrollHeight;
                        if (debugLog.children.length > 20) debugLog.removeChild(debugLog.children[1]);
                    }

                    if (processedLines.has(text)) return;
                    processedLines.add(text);
                    if (processedLines.size > 100) {
                        // Clear the set to prevent memory leak, keep the last few
                        const arr = Array.from(processedLines).slice(-20);
                        processedLines = new Set(arr);
                    }
                    
                    // Check for currency gain messages based on selected shop
                    let gained = 0;
                    
                    // Regex patterns for different currencies
                    // VERY permissive regexes to account for OCR spelling mistakes
                    if (selectedShop === "Slayer" && (text.includes("slayer") && text.includes("point"))) {
                        const match = text.match(/(\d+)\s+slayer/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "War's Wares" && (text.includes("war") || text.includes("marks"))) {
                        const match = text.match(/awarded\s+(\d+)/) || text.match(/(\d+)\s+marks/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Reaper" && (text.includes("reaper") && text.includes("point"))) {
                        const match = text.match(/(\d+)\s+reaper/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Estate Agent" && text.includes("contract")) {
                        const match = text.match(/(\d+)\s+contract/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Thaler" && text.includes("thaler")) {
                        const match = text.match(/awarded\s+(\d+)/) || text.match(/(\d+)\s+thaler/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Dungeoneering" && text.includes("token")) {
                        const match = text.match(/tokens?:\s*(\d+)/) || text.match(/(\d+)\s+dungeoneering token/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Artisans' Workshop" && text.includes("respect")) {
                        const match = text.match(/(\d+)%\s+respect/);
                        if (match) gained = parseInt(match[1]);
                    } else if (selectedShop === "Farmers' Market" && text.includes("beans")) {
                        const match = text.match(/(\d+)\s+beans/);
                        if (match) gained = parseInt(match[1]);
                    }
                    
                    if (gained > 0) {
                        // Flash input green and add points
                        const current = parseInt(currentCurrencyInput.value, 10) || 0;
                        currentCurrencyInput.value = (current + gained).toString();
                        
                        currentCurrencyInput.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        setTimeout(() => currentCurrencyInput.style.backgroundColor = '', 500);
                        
                        ocrStatus.textContent = `Detected +${gained} ${selectedShop} currency!`;
                        calculate();
                    }
                });
            } catch (err: any) {
                // Usually "capturehold failed" when game is minimized
                if (err.message && err.message.includes("capturehold")) {
                    ocrStatus.textContent = "Waiting for RuneScape window...";
                } else {
                    ocrStatus.textContent = "OCR Error: " + err.message;
                }
            }
        }, 600); // Polling interval
    } catch (err: any) {
        ocrStatus.textContent = "Crash: " + err.message;
        console.error(err);
    }
}

function handleShopChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    selectedShop = target.value;
    
    // Reset and enable item select
    itemSelect.innerHTML = '<option value="" disabled selected>Choose an item...</option>';
    itemSelect.disabled = false;
    
    // Populate items
    shopData[selectedShop].forEach((item: any) => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = `${item.name} (${item.cost})`;
        option.dataset.cost = item.cost;
        itemSelect.appendChild(option);
    });

    // Reset and enable rate select
    const rateData = taskRates[selectedShop];
    rateLabel.textContent = rateData.label;
    rateSelect.innerHTML = '';
    rateSelect.disabled = false;
    
    rateData.options.forEach((opt: any, index: number) => {
        const option = document.createElement('option');
        option.value = opt.rate;
        option.dataset.rateBurial = opt.rateBurial || opt.rate; // Fallback to normal rate if no burial rate
        option.dataset.rateHard = opt.rateHard || opt.rate; // Fallback to normal rate if no hard mode rate
        option.textContent = opt.name;
        if (index === rateData.options.length - 1) option.selected = true; // default to best
        rateSelect.appendChild(option);
    });
    
    if (selectedShop === "Artisans' Workshop") {
        burialContainer.style.display = 'flex';
    } else {
        burialContainer.style.display = 'none';
        burialCheckbox.checked = false;
    }
    
    if (selectedShop === "War's Wares") {
        hardmodeContainer.style.display = 'flex';
    } else {
        hardmodeContainer.style.display = 'none';
        hardmodeCheckbox.checked = false;
        enrageInputContainer.style.display = 'none';
    }
    
    // Update labels
    let unitLabel = "Tasks";
    switch(selectedShop) {
        case "Thaler": unitLabel = "Minutes"; break;
        case "Estate Agent": unitLabel = "Contracts"; break;
        case "War's Wares": unitLabel = "Boss Kills"; break;
        case "Farmers' Market": unitLabel = "Animals"; break;
        case "Dungeoneering": unitLabel = "Floors"; break;
        case "Artisans' Workshop": unitLabel = "Armours"; break;
        case "Reaper": unitLabel = "Kills"; break;
    }
    taskLabelEl.textContent = unitLabel + " Needed";
    
    // Reset values
    quantityInput.value = '1';
    itemCostInput.value = '';
    selectedItem = null;
    calculate();
}

function handleItemChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const selectedOption = target.options[target.selectedIndex];
    selectedItem = selectedOption.value;
    itemCostInput.value = selectedOption.dataset.cost || '';
    quantityInput.value = '1';
    calculate();
}

function calculate() {
    if (!selectedShop) return;
    
    const selectedItemName = itemSelect.value;
    const itemData = shopData[selectedShop].find((i: any) => i.name === selectedItemName);
    if (!itemData) {
        tasksNeededEl.textContent = "0";
        progressBar.style.width = "0%";
        remainingText.textContent = "0 currency needed";
        return;
    }
    
    const quantity = Math.max(1, parseInt(quantityInput.value, 10) || 1);
    const totalCost = itemData.cost * quantity;
    const current = parseInt(currentCurrencyInput.value, 10) || 0;
    
    // Update cost UI to reflect total cost
    itemCostInput.value = totalCost.toString();
    currentCurrencyInput.placeholder = '0 / ' + totalCost;
    
    const remaining = Math.max(0, totalCost - current);
    let rate = parseFloat(rateSelect.value) || 1;
    
    if (selectedShop === "Artisans' Workshop" && burialCheckbox.checked) {
        const selectedOption = rateSelect.options[rateSelect.selectedIndex];
        rate = parseFloat(selectedOption.dataset.rateBurial || rate.toString());
    } else if (selectedShop === "War's Wares" && hardmodeCheckbox.checked) {
        const selectedOption = rateSelect.options[rateSelect.selectedIndex];
        enrageInputContainer.style.display = 'block';
        
        const bossName = selectedOption.textContent || '';
        const enrage = parseInt(enrageInput.value) || 0;
        
        // If it's Telos, Zamorak, or Arch-Glacor, 100%+ enrage gives the rateHard value (100). Otherwise base value (80).
        if (bossName.includes('Telos') || bossName.includes('Zamorak') || bossName.includes('Arch-Glacor')) {
            if (enrage >= 100) {
                rate = parseFloat(selectedOption.dataset.rateHard || rate.toString());
            } else {
                rate = parseFloat(selectedOption.value);
            }
        } else {
            // For bosses like Zuk, Kerapac where Hard Mode is static
            rate = parseFloat(selectedOption.dataset.rateHard || rate.toString());
        }
    } else {
        enrageInputContainer.style.display = 'none';
    }
    
    const tasks = Math.ceil(remaining / rate);
    
    // Animate tasks number
    animateValue(tasksNeededEl, parseInt(tasksNeededEl.textContent || '0') || 0, tasks, 400);
    
    // Update progress bar
    const progress = totalCost === 0 ? 0 : Math.min(100, (current / totalCost) * 100);
    progressBar.style.width = `${progress}%`;
    
    // Update text
    remainingText.textContent = remaining > 0 ? 
        `${remaining.toLocaleString()} currency needed` : 
        "You have enough currency!";
}

function animateValue(obj: HTMLElement, start: number, end: number, duration: number) {
    if (start === end) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toString();
        }
    };
    window.requestAnimationFrame(step);
}

// Start
document.addEventListener('DOMContentLoaded', init);
