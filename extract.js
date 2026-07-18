const fs = require('fs');
const cheerio = require('cheerio');
let out = '';
['Slayer_points', 'Soul_Reaper', 'Stanley_Limelight_Traders', 'Estate_Agents_Shop'].forEach(p => {
    let d = JSON.parse(fs.readFileSync(p + '.json'));
    let $ = cheerio.load(d.parse.text['*']);
    out += '\n\n=== ' + p + ' ===\n';
    $('table.wikitable tr').each((i, tr) => {
        out += $(tr).find('th, td').map((j, td) => $(td).text().trim()).get().join(' | ') + '\n';
    });
});
fs.writeFileSync('tables.txt', out);
