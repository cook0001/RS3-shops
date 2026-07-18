const https = require('https');
const cheerio = require('cheerio');
const pages = ['Slayer_points', 'Marks_of_War', 'Thaler', 'Dungeoneering_token', 'Artisans_Workshop', 'Beans'];

pages.forEach(p => {
    https.get(`https://runescape.wiki/api.php?action=parse&page=${encodeURIComponent(p)}&redirects=1&format=json`, { headers: { 'User-Agent': 'ShopTracker/1.0' } }, res => {
        let d = '';
        res.on('data', c => d+=c);
        res.on('end', () => {
            if (d) {
                let json = JSON.parse(d);
                if(json.parse) {
                    let $ = cheerio.load(json.parse.text['*']);
                    let msgs = [];
                    // Look for standard game messages
                    $('p, li, td, th').each((i, el) => {
                        let text = $(el).text();
                        if (text.match(/message|chatbox|chat/i) || text.match(/You [\w\s]+ \d+/i)) {
                            let matches = text.match(/You .*?\d+.*?\./g);
                            if (matches) {
                                matches.forEach(m => {
                                    if (m.length < 100 && !msgs.includes(m) && (m.toLowerCase().includes('point') || m.toLowerCase().includes('mark') || m.toLowerCase().includes('thaler') || m.toLowerCase().includes('token') || m.toLowerCase().includes('respect') || m.toLowerCase().includes('bean'))) {
                                        msgs.push(m);
                                    }
                                });
                            }
                        }
                    });
                    console.log(`\n=== ${p} ===`);
                    console.log(msgs.slice(0, 10).join('\n'));
                }
            }
        });
    });
});
