const EventEmitter = require('events');

class BLEClient extends EventEmitter {}

module.exports = new BLEClient();
