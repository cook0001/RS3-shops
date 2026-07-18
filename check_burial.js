const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

https.get('https://runescape.wiki/api.php?action=parse&page=Burial_armour&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0 (contact@example.com)' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        let $ = cheerio.load(JSON.parse(d).parse.text['*']);
        let rates = [];
        $('table.wikitable tr').each((i, tr) => {
            let cols = $(tr).find('td');
            if (cols.length >= 3) {
                let name = $(cols[0]).text().trim();
                if (name === '') name = $(cols[1]).text().trim();
                let xpStr = $(cols[2]).text().trim().replace(/,/g, '');
                let xp = parseFloat(xpStr);
                if (name && !isNaN(xp) && xp > 0) {
                    rates.push({ name, xp });
                }
            }
        });
        console.log(rates.slice(0, 15));
    });
});
