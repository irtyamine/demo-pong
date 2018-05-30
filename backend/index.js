const express = require('express');
const app = express();
const WebSocket = require('ws');
const bleDaemon = require('./ble-remote-daemon');

const HTTP_PORT = 1234;
const WS_PORT = 8080;

const wss = new WebSocket.Server({ port: WS_PORT });
app.use(express.static('frontend/dist'));

app.listen(HTTP_PORT, () =>
  console.log(
    `Pong app listening on port ${HTTP_PORT} (WebSocket listening on port ${WS_PORT})`
  )
);

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

  setInterval(() => {
    ws.send(
      JSON.stringify({
        event: 'playerIn',
        id: 'LOL'
      })
    );
  }, 5000);
});
