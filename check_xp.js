const https = require('https');
const cheerio = require('cheerio');
['Elder rune platebody', 'Elder rune burial platebody'].forEach(item => {
    https.get('https://runescape.wiki/api.php?action=parse&page=' + encodeURIComponent(item) + '&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
        let d = '';
        res.on('data', c => d+=c);
        res.on('end', () => {
            let $ = cheerio.load(JSON.parse(d).parse.text['*']);
            let xpStr = $('th:contains("Experience")').next('td').text();
            console.log(item + ': ' + xpStr);
        });
    });
});
