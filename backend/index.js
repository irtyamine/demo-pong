const express = require('express');
const app = express();
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const bleDaemon = require('./ble-remote-daemon');
app.use(express.static('frontend/dist'));

app.listen(3000, () => console.log('Pong app listening on port 3000'));

wss.on('connection', function connection(ws) {
  bleDaemon.on('position', payload => {
    ws.send('position', payload);
  });

  bleDaemon.on('deviceFound', payload => {
    ws.send('playerIn', payload);
  });

  bleDaemon.on('deviceLost', payload => {
    ws.send('playerOut', payload);
  });
});
