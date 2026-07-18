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

async function test() {
    let items = ['Elder rune platebody', 'Elder rune platebody +1', 'Elder rune platebody +5', 'Elder rune burial platebody'];
    for (let item of items) {
        let html = await fetchWikiHtml(item);
        let $ = cheerio.load(html);
        let xpStr = $('th:contains("Experience")').next('td').text().trim();
        console.log(item + ' XP: ' + xpStr);
    }
}
test();
