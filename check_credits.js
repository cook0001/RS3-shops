const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:\\Users\\danie\\.gemini\\antigravity\\brain\\108db3e6-fbd5-498d-9543-d9a84e4ce737\\.system_generated\\steps\\206\\content.md', 'utf8');
const $ = cheerio.load(html);
$('table.wikitable tr').each((i, tr) => {
    console.log($(tr).find('th, td').map((j, el) => $(el).text().trim()).get().join(' | '));
});
