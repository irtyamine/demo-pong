const express = require('express');
const app = express();
const WebSocket = require('uws');
const bleDaemon = require('./ble-remote-daemon');

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
  intervalId = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (Object.keys(bleDaemon.positions).length > 1) {
      ws.send(
        JSON.stringify({
          event: 'position',
          positions: bleDaemon.positions
        })
      );
    }
  }, 1000 / FRAME_RATE);

  bleDaemon.on('deviceFound', id => {
    ws.send(
      JSON.stringify({
        event: 'playerIn',
        id: id
      })
    );
  });

  bleDaemon.on('deviceLost', id => {
    ws.send(
      JSON.stringify({
        event: 'playerOut',
        id: id
      })
    );
  });

  ws.on('message', data => {
    switch (data) {
      case 'getPlayers':
        Object.keys(bleDaemon.positions).forEach(id => {
          ws.send(
            JSON.stringify({
              event: 'playerIn',
              id
            })
          );
        });
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    bleDaemon.removeAllListeners();
    clearInterval(intervalId);
  });
});
