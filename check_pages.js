const https = require('https');
const pages = [
  "War's_Wares", 
  "Farmers'_Market", 
  "Reward_shop_(Dungeoneering)", 
  "Dungeoneering/Rewards", 
  "Artisans'_Workshop_reward_shop", 
  "Burial_armour", 
  "Runecrafting_Guild_tokens", 
  "Shattered_Worlds/Rewards",
  "Oddments_Store",
  "Stealing_Creation_rewards"
];

pages.forEach(p => {
  https.get('https://runescape.wiki/api.php?action=query&titles=' + encodeURIComponent(p) + '&format=json', {headers: {'User-Agent': 'ShopTracker/1.0'}}, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
        const data = JSON.parse(d);
        const pageId = Object.keys(data.query.pages)[0];
        if (pageId === "-1") {
            console.log(p + " DOES NOT EXIST");
        } else {
            console.log(p + " exists!");
        }
    });
  });
});
