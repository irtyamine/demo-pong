const EventEmitter = require('events');

const MAX_POSITION = 4095;
const DEVICE_CHECK_INTERVAL = 400;
const MANUFACTURER_ID = 0x6012;
const DEV_SKU = 2;

class BLEClient extends EventEmitter {}

module.exports = new BLEClient();
