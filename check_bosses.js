const https = require('https');
const cheerio = require('cheerio');

https.get('https://runescape.wiki/api.php?action=parse&page=Marks_of_War&redirects=1&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        let $ = cheerio.load(JSON.parse(d).parse.text['*']);
        let msg = [];
        $('table.wikitable').each((i, table) => {
            $(table).find('tr').each((j, tr) => {
                let cols = $(tr).find('td');
                if (cols.length >= 2) {
                    let boss = $(cols[0]).text().trim();
                    let marks = $(cols[1]).text().trim();
                    if (boss) {
                        msg.push(`Boss: ${boss} | Marks: ${marks}`);
                    }
                }
            });
        });
        console.log(msg.join('\n'));
    });
});
