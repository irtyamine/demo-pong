const EventEmitter = require('events');

const MAX_POSITION = 4095;
const DEVICE_CHECK_INTERVAL = 400;
const MANUFACTURER_ID = 0x6012;
const DEV_SKU = 2;

/**
 * What we'll do in this demo:
 * 
 * 1. Code the logic that sends the `deviceFound` event and 
 * updates the position on each device frame in the BLE daemon.
 * 2. (If we have the time) code the logic that sends the 
 * `deviceLost` event in the BLE daemon.
 */

class BLEClient extends EventEmitter {}

module.exports = new BLEClient();
