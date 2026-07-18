const https = require('https');
const cheerio = require('cheerio');
https.get('https://runescape.wiki/api.php?action=parse&page=Slayer_points&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        let $ = cheerio.load(JSON.parse(d).parse.text['*']);
        $('table.wikitable').each((i, table) => {
            console.log('TABLE ' + i);
            let headers = $(table).find('th').map((j, el) => $(el).text().trim()).get();
            console.log('HEADERS: ' + headers.join(', '));
            
            $(table).find('tr').slice(1, 3).each((j, tr) => {
                let row = $(tr).find('td').map((k, el) => $(el).text().trim().substring(0,20)).get();
                console.log('ROW: ' + row.join(' | '));
            });
        });
    });
});
