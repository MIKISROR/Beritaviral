const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const urlMap = {
  kompas: 'https://www.kompas.com',
  google: 'https://www.google.com',
  // tambah id lainnya di sini
};

app.get('/:id/set', async (req, res) => {
  const id = req.params.id;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const destination = urlMap[id] || 'https://example.com';

  let geo = {};
  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    geo = await geoRes.json();
  } catch {
    geo = { city: 'Unknown', region: 'Unknown', country_name: 'Unknown' };
  }

  const logEntry = {
    id,
    ip,
    location: `${geo.city}, ${geo.region}, ${geo.country_name}`,
    time: new Date().toISOString(),
    destination
  };

  fs.readFile('logs.json', (err, data) => {
    let logs = [];
    if (!err && data.length > 0) {
      try { logs = JSON.parse(data); } catch {}
    }
    logs.push(logEntry);
    fs.writeFile('logs.json', JSON.stringify(logs, null, 2), () => {});
  });

  res.redirect(destination);
});

app.get('/tracker/logs', (req, res) => {
  fs.readFile('logs.json', (err, data) => {
    if (err) return res.send('Error reading log');
    let logs = [];
    try {
      logs = JSON.parse(data);
    } catch {}

    let html = `
      <h2>Tracking Logs</h2>
      <table border="1" cellpadding="5">
        <tr><th>ID</th><th>IP</th><th>Location</th><th>Time</th><th>Destination</th></tr>
        ${logs.map(log => `
          <tr>
            <td>${log.id}</td>
            <td>${log.ip}</td>
            <td>${log.location}</td>
            <td>${log.time}</td>
            <td><a href="${log.destination}" target="_blank">${log.destination}</a></td>
          </tr>
        `).join('')}
      </table>
    `;
    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
