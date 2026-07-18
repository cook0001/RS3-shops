const cheerio = require('cheerio');
const https = require('https');

function fetchWikiHtml(pageTitle) {
    return new Promise((resolve, reject) => {
        const url = `https://runescape.wiki/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json`;
        https.get(url, { headers: { 'User-Agent': 'ShopTracker/1.0 (contact@example.com)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.parse && json.parse.text) {
                        resolve(json.parse.text['*']);
                    } else {
                        resolve('');
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

async function debug() {
    let html = await fetchWikiHtml('Slayer_reward_points');
    let $ = cheerio.load(html);
    $('table.wikitable').each((i, el) => {
        console.log('--- Table', i);
        $(el).find('tr').slice(0, 3).each((j, tr) => {
            console.log($(tr).text().replace(/\n+/g, ' | '));
        });
    });
}
debug();
