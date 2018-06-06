const express = require('express');
const app = express();
const WebSocket = require('uws');
const bleServer = require('./ble-remote-daemon/index.live');

const HTTP_PORT = 1234;
const WS_PORT = 8080;
const FRAME_RATE = 120;

var intervalId;
const wss = new WebSocket.Server({ port: WS_PORT });
app.use(express.static('frontend/dist'));

app.listen(HTTP_PORT, () =>
  console.log(
    `Pong app listening on port ${HTTP_PORT} (WebSocket listening on port ${WS_PORT})`
  )
);

wss.on('connection', function connection(ws) {
  console.log('Frontend connected');
  intervalId = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    // TODO Send 'position' event
  }, 1000 / FRAME_RATE);

  // TODO Send 'playerIn' event on BLE 'deviceFound'
  
  // TODO Send 'playerOut' event on BLE 'deviceLost'

  ws.on('message', data => {
    switch (data) {
      case 'getPlayers':
        // TODO Send 'playerIn' events
        break;

      default:
        console.warn(`Received unknown ${data} message`);
        break;
    }
  });

  ws.on('close', () => {
    // TODO remove all the listeners on the BLE server
    clearInterval(intervalId);
  });
});
