const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

function fetchWikiHtml(pageTitle) {
    return new Promise((resolve, reject) => {
        const url = `https://runescape.wiki/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&redirects=1&format=json`;
        https.get(url, { headers: { 'User-Agent': 'ShopTracker/1.0 (contact@example.com)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.parse && json.parse.text) {
                    resolve(json.parse.text['*']);
                } else resolve('');
            });
        }).on('error', reject);
    });
}

async function run() {
    console.log('Fetching Beans table...');
    let html = await fetchWikiHtml('Beans');
    let $ = cheerio.load(html);
    
    let options = [];
    $('table.wikitable').each((i, table) => {
        $(table).find('tr').each((j, tr) => {
            let cols = $(tr).find('td');
            if (cols.length >= 3) {
                let name = $(cols[0]).text().trim();
                let adolCost = $(cols[2]).text().trim().replace(/,/g, ''); // 3rd column is usually Adolescent
                let cost = parseInt(adolCost, 10);
                if (name && !isNaN(cost) && cost > 0) {
                    options.push(`      { name: "Adolescent ${name} (${cost} Beans)", rate: ${cost} }`);
                }
            }
        });
    });
    
    console.log(options.join(',\n'));
}

run();
