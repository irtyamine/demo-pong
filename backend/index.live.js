const express = require('express');
const app = express();
const WebSocket = require('uws');
const bleClient = require('./ble-remote-daemon/index.live');

const HTTP_PORT = 1234;
const WS_PORT = 8080;
const FRAME_RATE = 120;

var positionInterval;

/**
 * Web Server
 */
const wss = new WebSocket.Server({ port: WS_PORT });
app.use(express.static('frontend/dist'));
app.listen(HTTP_PORT, () =>
  console.log(
    `Pong app listening on port ${HTTP_PORT} (WebSocket listening on port ${WS_PORT})`
  )
);

/**
 * Web Socket Connection
 */
wss.on('connection', function connection(ws) {
  console.log('Frontend connected');

  /**
   * Pad Wheel Position
   */
  positionInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN || !bleClient.positions) {
      return;
    }
    ws.send(
      JSON.stringify({
        event: 'position',
        positions: bleClient.positions
      })
    );
  }, 1000 / FRAME_RATE);

  /**
   * Device Found Event
   */
  bleClient.on('deviceFound', id => {
    ws.send(
      JSON.stringify({
        event: 'playerIn',
        id: id
      })
    );
  });

  /**
   * Device Lost Event
   */
  bleClient.on('deviceLost', id => {
    ws.send(
      JSON.stringify({
        event: 'playerOut',
        id: id
      })
    );
  });

  /**
   * Client Messages
   */
  ws.on('message', data => {
    switch (data) {
      case 'getPlayers':
        if (!bleClient.positions) {
          return;
        }
        Object.keys(bleClient.positions).forEach(id => {
          ws.send(
            JSON.stringify({
              event: 'playerIn',
              id
            })
          );
        });
        break;

      default:
        console.warn(`Received unknown ${data} message`);
        break;
    }
  });

  /**
   * Connection Closed
   */
  ws.on('close', () => {
    bleClient.removeAllListeners();
    clearInterval(bleClient.positionInterval);
  });
});
