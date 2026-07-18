const https = require('https');
https.get('https://runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Reward_shops&cmlimit=500&format=json', { headers: { 'User-Agent': 'ShopTracker/1.0 (contact@example.com)' } }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => console.log(JSON.parse(d).query.categorymembers.map(m=>m.title).join('\n')));
});
