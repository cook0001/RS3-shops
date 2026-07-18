const https = require('https');
const cheerio = require('cheerio');

https.get('https://runescape.wiki/api.php?action=parse&page=Arch-Glacor&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        let $ = cheerio.load(JSON.parse(d).parse.text['*']);
        let msg = [];
        $('p, li').each((i, el) => {
            let t = $(el).text();
            if (t.toLowerCase().includes('marks of war')) {
                msg.push(t);
            }
        });
        console.log(msg.join('\n'));
    });
});
