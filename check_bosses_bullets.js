const https = require('https');
const cheerio = require('cheerio');

https.get('https://runescape.wiki/api.php?action=parse&page=Marks_of_War&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        let $ = cheerio.load(JSON.parse(d).parse.text['*']);
        let msg = [];
        
        $('ul li').each((i, li) => {
            msg.push($(li).text().trim());
        });
        
        console.log(msg.join('\n'));
    });
});
