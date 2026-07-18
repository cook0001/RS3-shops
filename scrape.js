const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

function fetchWikiHtml(pageTitle) {
    return new Promise((resolve, reject) => {
        const url = `https://runescape.wiki/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&redirects=1&format=json`;
        https.get(url, { headers: { 'User-Agent': 'ShopTracker/1.0 (contact@example.com)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.parse && json.parse.text) {
                        resolve(json.parse.text['*']);
                    } else {
                        reject(new Error(`Failed to parse HTML for ${pageTitle}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function cleanNumber(str) {
    if (!str) return NaN;
    // Replace commas and extract first number
    const match = str.replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : NaN;
}

function parseTable($, tableEl) {
    let items = [];
    let nameIdx = -1;
    let costIdx = -1;
    
    // Find headers
    const headers = $(tableEl).find('tr').first().find('th');
    headers.each((i, th) => {
        const text = $(th).text().toLowerCase().trim();
        // Match name
        if ((text.includes('item') || text.includes('reward') || text.includes('name') || text.includes('product') || text.includes('unlock')) && nameIdx === -1) {
            if (!text.includes('description') && !text.includes('notes')) {
                nameIdx = i;
            }
        }
        // Match cost
        if ((text.includes('price') || text.includes('cost') || text.includes('points') || text.includes('respect') || text.includes('tokens') || text.includes('beans') || text.includes('marks')) && costIdx === -1) {
            if (!text.includes('ge price') && !text.includes('sell price')) {
                costIdx = i;
            }
        }
    });
    
    // If we didn't clearly find both an Item column and a Cost column, this is probably not a shop table!
    if (nameIdx === -1 || costIdx === -1) {
        return items; // return empty
    }

    $(tableEl).find('tr').each((i, tr) => {
        const cols = $(tr).find('td');
        if (cols.length > Math.max(nameIdx, costIdx)) {
            // Some wikis use the first column for the image, making td indexing offset by 1
            // if the th had an empty column.
            let adjustedNameIdx = $(cols[0]).text().trim() === '' && cols.length > nameIdx + 1 ? nameIdx + 1 : nameIdx;
            let adjustedCostIdx = $(cols[0]).text().trim() === '' && cols.length > costIdx + 1 ? costIdx + 1 : costIdx;

            // Fallback for tricky tables
            if (adjustedCostIdx >= cols.length) adjustedCostIdx = cols.length - 1;
            if (adjustedNameIdx >= cols.length) adjustedNameIdx = 0;

            let name = $(cols[adjustedNameIdx]).text().trim().replace(/\n/g, ' ');
            let cost = cleanNumber($(cols[adjustedCostIdx]).text());
            
            // If cost is still NaN, try adjacent column
            if (isNaN(cost)) {
                cost = cleanNumber($(cols[adjustedCostIdx - 1]).text());
            }
            if (isNaN(cost)) {
                cost = cleanNumber($(cols[adjustedCostIdx + 1]).text());
            }

            if (name && !isNaN(cost) && cost > 0) {
                name = name.split('(')[0].trim();
                if (name.length < 50 && name.length > 2) {
                    items.push({ name, cost });
                }
            }
        }
    });
    return items;
}

async function scrapeShop() {
    try {
        const shops = {};
        
        const pages = [
            { shop: 'Slayer', page: 'Slayer_points' },
            { shop: 'Reaper', page: 'Death\'s_Store' },
            { shop: 'Thaler', page: 'Stanley_Limelight_Traders' },
            { shop: 'Estate Agent', page: 'Estate_Agents_Shop' },
            { shop: 'War\'s Wares', page: 'War\'s_Wares' },
            { shop: 'Farmers\' Market', page: 'Farmers\'_Market' },
            { shop: 'Dungeoneering', page: 'Dungeoneering/Rewards' },
            { shop: 'Artisans\' Workshop', page: 'Artisans\'_Workshop' }
        ];

        for (const p of pages) {
            console.log(`Scraping ${p.shop}...`);
            const html = await fetchWikiHtml(p.page);
            const $ = cheerio.load(html);
            let shopItems = [];
            
            $('table.wikitable').each((i, table) => {
                shopItems = shopItems.concat(parseTable($, table));
            });
            
            shops[p.shop] = shopItems;
        }

        // Clean and deduplicate
        for (const shop in shops) {
            const unique = [];
            const seen = new Set();
            for (const item of shops[shop]) {
                if (!seen.has(item.name)) {
                    seen.add(item.name);
                    unique.push(item);
                }
            }
            shops[shop] = unique;
            console.log(`- ${shop}: ${unique.length} items found`);
        }

        console.log('Generating ALL Smithing options for Artisans Workshop...');
        
        const metals = [
            { name: 'Bronze', xpPerBar: 10, maxUpgrade: 2 },
            { name: 'Iron', xpPerBar: 20, maxUpgrade: 2 },
            { name: 'Steel', xpPerBar: 35, maxUpgrade: 2 },
            { name: 'Mithril', xpPerBar: 50, maxUpgrade: 3 },
            { name: 'Adamant', xpPerBar: 75, maxUpgrade: 3 },
            { name: 'Rune', xpPerBar: 100, maxUpgrade: 4 },
            { name: 'Orikalkum', xpPerBar: 150, maxUpgrade: 4 },
            { name: 'Necronium', xpPerBar: 200, maxUpgrade: 4 },
            { name: 'Bane', xpPerBar: 300, maxUpgrade: 4 },
            { name: 'Elder rune', xpPerBar: 400, maxUpgrade: 5 }
        ];

        const itemTypes = [
            { name: 'dagger', bars: 1 },
            { name: 'hatchet', bars: 1 },
            { name: 'mace', bars: 1 },
            { name: 'sword', bars: 1 },
            { name: 'claws', bars: 1 },
            { name: 'scimitar', bars: 2 },
            { name: 'longsword', bars: 2 },
            { name: 'pickaxe', bars: 2 },
            { name: 'boots', bars: 2 },
            { name: 'gauntlets', bars: 2 },
            { name: 'warhammer', bars: 3 },
            { name: 'battleaxe', bars: 3 },
            { name: 'helm', bars: 3 },
            { name: '2h sword', bars: 4 },
            { name: 'shield', bars: 4 },
            { name: 'platelegs', bars: 4 },
            { name: 'plateskirt', bars: 4 },
            { name: 'platebody', bars: 5 }
        ];

        const upgradeMultipliers = [1, 1, 2, 4, 8, 16]; // Base, +1, +2, +3, +4, +5

        let artisansOptions = [];

        metals.forEach(metal => {
            itemTypes.forEach(item => {
                for (let level = 0; level <= metal.maxUpgrade; level++) {
                    let suffix = level === 0 ? '' : ' +' + level;
                    let itemName = `${metal.name} ${item.name}${suffix}`;
                    let barsRequired = item.bars * upgradeMultipliers[level];
                    let xp = barsRequired * metal.xpPerBar;
                    let respect = xp / 10000;
                    
                    // Burial armour is only available for the max upgrade level, and only for armours (helm, body, legs, boots, gauntlets, shield)
                    // But we'll just allow the burial rate to fall back to the max upgrade XP for simplicity, which is mathematically identical.
                    let isArmour = ['boots', 'gauntlets', 'helm', 'shield', 'platelegs', 'plateskirt', 'platebody'].includes(item.name);
                    let burialXp = 0;
                    if (isArmour) {
                        let maxBars = item.bars * upgradeMultipliers[metal.maxUpgrade];
                        burialXp = maxBars * metal.xpPerBar;
                    }
                    
                    artisansOptions.push({
                        name: itemName,
                        rate: respect,
                        rateBurial: burialXp > 0 ? (burialXp / 10000) : respect
                    });
                }
            });
        });

        const out = `const shopData = ${JSON.stringify(shops, null, 2)};

// Detailed exact task rates for accurate calculations
const taskRates = {
  "Slayer": {
    label: "Slayer Master",
    options: [
      { name: "Jacquelyn (1 pt)", rate: 1 },
      { name: "Vannaka (2 pts)", rate: 2 },
      { name: "Mazchna (4 pts)", rate: 4 },
      { name: "Chaeldar (10 pts)", rate: 10 },
      { name: "Sumona (12 pts)", rate: 12 },
      { name: "Duradel / Lapalok (15 pts)", rate: 15 },
      { name: "Kuradal (18 pts)", rate: 18 },
      { name: "Morvran (20 pts)", rate: 20 },
      { name: "Laniakea / Mandrith (22 pts)", rate: 22 }
    ]
  },
  "Reaper": {
    label: "Reaper Boss",
    options: [
      { name: "Amascut, the Devourer (Normal)", rate: 24 },
      { name: "Amascut, the Devourer (Hard)", rate: 29 },
      { name: "The Ambassador", rate: 23 },
      { name: "Araxxi", rate: 20 },
      { name: "Arch-Glacor (Normal)", rate: 15 },
      { name: "Arch-Glacor (Hard)", rate: 20 },
      { name: "Barrows Brothers", rate: 9 },
      { name: "Barrows: Rise of the Six", rate: 20 },
      { name: "Black stone dragon", rate: 23 },
      { name: "Chaos Elemental", rate: 7 },
      { name: "Commander Zilyana / General Graardor / K'ril / Kree'arra", rate: 12 },
      { name: "Corporeal Beast", rate: 15 },
      { name: "Croesus", rate: 8 },
      { name: "Dagannoth Kings", rate: 15 },
      { name: "Giant Mole", rate: 7 },
      { name: "Gregorovic / Helwyr / Twin Furies / Vindicta", rate: 18 },
      { name: "Har-Aken", rate: 15 },
      { name: "Hermod", rate: 15 },
      { name: "Kerapac (Normal)", rate: 21 },
      { name: "Kerapac (Hard)", rate: 28 },
      { name: "Legiones", rate: 15 },
      { name: "The Magister", rate: 15 },
      { name: "Nex", rate: 18 },
      { name: "Raksha", rate: 22 },
      { name: "Rasial", rate: 21 },
      { name: "Seiryu", rate: 23 },
      { name: "Solak", rate: 27 },
      { name: "Telos", rate: 23 },
      { name: "Zamorak (Group)", rate: 23 },
      { name: "Zamorak (Solo)", rate: 27 },
      { name: "Zemouregal & Vorkath", rate: 22 }
    ]
  },
  "Thaler": {
    label: "Minigame",
    options: [
      { name: "Standard (1 Thaler/min)", rate: 1 },
      { name: "Spotlighted (5 Thaler/min)", rate: 5 }
    ]
  },
  "Estate Agent": {
    label: "Plank Type",
    options: [
      { name: "Regular Plank (1 pt)", rate: 1 },
      { name: "Oak Plank (2 pts)", rate: 2 },
      { name: "Teak Plank (3 pts)", rate: 3 },
      { name: "Mahogany Plank (5 pts)", rate: 5 }
    ]
  },
  "War's Wares": {
    label: "Boss Killed",
    options: [
      { name: "Giant Mole (40 Marks)", rate: 40 },
      { name: "King Black Dragon (40 Marks)", rate: 40 },
      { name: "Barrows Chest (40 Marks)", rate: 40 },
      { name: "Chaos Elemental (40 Marks)", rate: 40 },
      { name: "Kalphite Queen (40 Marks)", rate: 40 },
      { name: "Dagannoth Kings (40 Marks)", rate: 40 },
      { name: "God Wars Dungeon 1 (40 Marks)", rate: 40 },
      { name: "Queen Black Dragon (60 Marks)", rate: 60 },
      { name: "Corporeal Beast (60 Marks)", rate: 60 },
      { name: "God Wars Dungeon 2 (60 Marks)", rate: 60 },
      { name: "Rex Matriarchs (60 Marks)", rate: 60 },
      { name: "Legiones (80 Marks)", rate: 80 },
      { name: "Nex (80 Marks)", rate: 80 },
      { name: "Kalphite King (80 Marks)", rate: 80 },
      { name: "The Magister (80 Marks)", rate: 80 },
      { name: "Raksha (80 Marks)", rate: 80 },
      { name: "Kerapac (80/100 HM)", rate: 80, rateHard: 100 },
      { name: "Hermod (80 Marks)", rate: 80 },
      { name: "Vorkath (80 Marks)", rate: 80 },
      { name: "Araxxor (100 Marks)", rate: 100 },
      { name: "Vorago (100 Marks)", rate: 100 },
      { name: "Nex: Angel of Death (100 Marks)", rate: 100 },
      { name: "Solak (100 Marks)", rate: 100 },
      { name: "Elite Dungeon Bosses (100 Marks)", rate: 100 },
      { name: "Telos (80 / 100 at 100%+)", rate: 80, rateHard: 100 },
      { name: "Zamorak (80 / 100 at 100%+)", rate: 80, rateHard: 100 },
      { name: "Arch-Glacor (80 / 100 at 100%+)", rate: 80, rateHard: 100 },
      { name: "Rasial (100 Marks)", rate: 100 },
      { name: "TzKal-Zuk (930/1,230 HM)", rate: 930, rateHard: 1230 },
      { name: "Liberation of Mazcab (1,000 Marks)", rate: 1000 }
    ]
  },
  "Farmers' Market": {
    label: "Animal Sold",
    options: [
      { name: "Adolescent Rabbit (25 Beans)", rate: 25 },
      { name: "Adolescent Chicken (40 Beans)", rate: 40 },
      { name: "Adolescent Frog (110 Beans)", rate: 110 },
      { name: "Adolescent Sheep (80 Beans)", rate: 80 },
      { name: "Adolescent Cow (170 Beans)", rate: 170 },
      { name: "Adolescent Spider (250 Beans)", rate: 250 },
      { name: "Adolescent Chinchompa (250 Beans)", rate: 250 },
      { name: "Adolescent Salamander (363 Beans)", rate: 363 },
      { name: "Adolescent Jadinko (650 Beans)", rate: 650 },
      { name: "Adolescent Yak (750 Beans)", rate: 750 },
      { name: "Adolescent Zygomite (850 Beans)", rate: 850 },
      { name: "Adolescent Varanusaur (1,260 Beans)", rate: 1260 },
      { name: "Adolescent Arcane apoterrasaur (1,936 Beans)", rate: 1936 },
      { name: "Adolescent Dragon (2,000 Beans)", rate: 2000 },
      { name: "Adolescent Brutish dinosaur (2,070 Beans)", rate: 2070 },
      { name: "Adolescent Bagrada rex (2,216 Beans)", rate: 2216 },
      { name: "Adolescent Spicati apoterrasaur (2,296 Beans)", rate: 2296 },
      { name: "Adolescent Scimitops (2,500 Beans)", rate: 2500 },
      { name: "Adolescent Asciatops (2,520 Beans)", rate: 2520 },
      { name: "Adolescent Corbicula rex (2,736 Beans)", rate: 2736 },
      { name: "Adolescent Oculi apoterrasaur (3,016 Beans)", rate: 3016 },
      { name: "Adolescent Malletops (3,276 Beans)", rate: 3276 },
      { name: "Adolescent Pavosaurus rex (3,600 Beans)", rate: 3600 },
      { name: "Adolescent Oseacarus rex (4,000 Beans)", rate: 4000 }
    ]
  },
  "Dungeoneering": {
    label: "Floor Type",
    options: [
      { name: "Small Floor (~1,000 Tokens)", rate: 1000 },
      { name: "Medium Floor (~3,000 Tokens)", rate: 3000 },
      { name: "Large Floor (~10,000 Tokens)", rate: 10000 }
    ]
  },
  "Artisans' Workshop": {
    label: "Burial Armour Forged",
    options: ${JSON.stringify(artisansOptions, null, 6)}
  }
};
`;
        fs.writeFileSync('data.js', out);
        console.log('Saved scraped data to data.js');
    } catch (e) {
        console.error(e);
    }
}

scrapeShop();
