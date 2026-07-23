const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'api.github.com',
  path: '/search/code?q=repo:tauri-apps/tauri+filename:installer.nsi',
  headers: {
    'User-Agent': 'Node.js'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(json.items.map(i => i.html_url));
      
      if (json.items && json.items.length > 0) {
        // Fetch the raw content of the first match
        const rawUrl = json.items[0].html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        https.get(rawUrl, (res2) => {
          let nsi = '';
          res2.on('data', (c) => { nsi += c; });
          res2.on('end', () => {
            fs.writeFileSync('installer.nsi', nsi);
            console.log('Saved installer.nsi');
          });
        });
      }
    } catch(e) {
      console.error(e);
    }
  });
});
