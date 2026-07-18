const fs = require('fs');
const cheerio = require('cheerio');

function cleanNumber(str) {
    if (!str) return NaN;
    return parseInt(str.replace(/,/g, '').trim(), 10);
}

function processSlayer() {
    let d = JSON.parse(fs.readFileSync('Slayer_points.json'));
    let $ = cheerio.load(d.parse.text['*']);
    let items = [];
    $('table.wikitable tr').each((i, tr) => {
        let cols = $(tr).find('td');
        if (cols.length >= 3) {
            let name = $(cols[0]).text().trim().replace(/\n/g, ' ');
            // Some have "Pricesold at" in column 2, others in column 1 depending on table format
            // Try to find the cost
            let cost = cleanNumber($(cols[2]).text());
            if (isNaN(cost)) cost = cleanNumber($(cols[1]).text());
            
            if (name && !isNaN(cost)) {
                // filter out junk
                if (name.length < 50) {
                    items.push({ name: name.split('(')[0].trim(), cost });
                }
            }
        }
    });
    return items;
}

function processReaper() {
    let d = JSON.parse(fs.readFileSync('Deaths_Store.json'));
    let $ = cheerio.load(d.parse.text['*']);
    let items = [];
    $('table.wikitable tr').each((i, tr) => {
        let cols = $(tr).find('td');
        if (cols.length >= 2) {
            let name = $(cols[0]).text().trim();
            let cost = cleanNumber($(cols[1]).text());
            if (name && !isNaN(cost)) {
                items.push({ name: name.split('(')[0].trim(), cost });
            }
        }
    });
    return items;
}

function processThaler() {
    let d = JSON.parse(fs.readFileSync('Stanley_Limelight_Traders.json'));
    let $ = cheerio.load(d.parse.text['*']);
    let items = [];
    $('table.wikitable tr').each((i, tr) => {
        let cols = $(tr).find('td');
        if (cols.length >= 3) {
            let name = $(cols[0]).text().trim();
            let cost = cleanNumber($(cols[2]).text());
            if (isNaN(cost)) cost = cleanNumber($(cols[1]).text());
            
            if (name && !isNaN(cost) && cost > 0) {
                items.push({ name: name.split('(')[0].trim(), cost });
            }
        }
    });
    return items;
}

function processEstateAgent() {
    let d = JSON.parse(fs.readFileSync('Estate_Agents_Shop.json'));
    let $ = cheerio.load(d.parse.text['*']);
    let items = [];
    $('table.wikitable tr').each((i, tr) => {
        let cols = $(tr).find('td');
        if (cols.length >= 2) {
            let name = $(cols[0]).text().trim();
            let cost = cleanNumber($(cols[1]).text());
            if (name && !isNaN(cost) && cost > 0) {
                items.push({ name: name.split('(')[0].trim(), cost });
            }
        }
    });
    return items;
}

let shops = {
    "Slayer": processSlayer(),
    "Reaper": processReaper(),
    "Thaler": processThaler(),
    "Estate Agent": processEstateAgent()
};

// Deduplicate
for (const shop in shops) {
    const unique = [];
    const seen = new Set();
    for (const item of shops[shop]) {
        if (!seen.has(item.name) && item.cost > 0) {
            seen.add(item.name);
            unique.push(item);
        }
    }
    shops[shop] = unique;
}

let out = `const shopData = ${JSON.stringify(shops, null, 2)};

// Rates (average currency per task for calculation)
const taskRates = {
  "Slayer": { label: "Slayer tasks", rate: 15 }, // average points per task
  "Reaper": { label: "Boss kills (Reaper)", rate: 15 }, // average per reaper task
  "Thaler": { label: "Minutes of Minigames", rate: 1 }, // 1 thaler per minute
  "Estate Agent": { label: "Contracts", rate: 4 } // approx points per contract
};
`;

fs.writeFileSync('data.js', out);
console.log('data.js generated successfully with exact Wiki items and prices!');
