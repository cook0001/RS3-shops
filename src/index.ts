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
let reader: ChatBoxReader | null = null;
let ocrInterval: NodeJS.Timeout | null = null;
let isOcrRunning = false;

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
    btnOcr.addEventListener('click', toggleOCR);
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
        
        // Find chatbox
        reader.find();
        if (!reader.pos) {
            ocrStatus.textContent = "Error: Chatbox not found. Make sure it's visible, not 100% transparent, and active.";
            return;
        }

        isOcrRunning = true;
        btnOcr.textContent = "Stop OCR";
        btnOcr.classList.add('active');
        ocrStatus.textContent = "Scanning chatbox for currency drops...";

        ocrInterval = setInterval(() => {
            if (!reader || !reader.pos) return;
            const lines = reader.read() || [];
            
            lines.forEach(line => {
                const text = line.text.toLowerCase();
                
                // Check for currency gain messages based on selected shop
                let gained = 0;
                
                // Regex patterns for different currencies
                if (selectedShop === "Slayer" && text.includes("slayer point")) {
                    const match = text.match(/(\d+)\s+slayer points?/);
                    if (match) gained = parseInt(match[1]);
                } else if (selectedShop === "War's Wares" && text.includes("marks of war")) {
                    const match = text.match(/awarded (\d+)\s+marks of war/);
                    if (match) gained = parseInt(match[1]);
                } else if (selectedShop === "Reaper" && text.includes("reaper point")) {
                    const match = text.match(/(\d+)\s+reaper points?/);
                    if (match) gained = parseInt(match[1]);
                } else if (selectedShop === "Estate Agent" && text.includes("contract credit")) {
                    const match = text.match(/(\d+)\s+contract credits?/);
                    if (match) gained = parseInt(match[1]);
                } else if (selectedShop === "Thaler" && text.includes("thaler")) {
                    const match = text.match(/awarded (\d+)\s+thaler/);
                    if (match) gained = parseInt(match[1]);
                } else if (selectedShop === "Dungeoneering" && text.includes("tokens")) {
                    const match = text.match(/tokens?:\s*(\d+)/);
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
