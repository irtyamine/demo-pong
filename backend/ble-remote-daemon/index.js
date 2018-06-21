var noble = require('noble');
var binary = require('binary');
const EventEmitter = require('events');

const DEVICE_TIMEOUT = 2000;
const MAX_POSITION = 4095;
const DEVICE_CHECK_INTERVAL = 400;

class BLERemoteDaemon extends EventEmitter {
  constructor() {
    super();
    console.log('-- Kuzzle Pong BLE remote daemon --------------');

    this.positions = {};
    this.timers = {};
    noble.on('stateChange', this.onBLEAdapterStateChanged);
    noble.on('discover', this.onBLEDeviceDiscovered.bind(this));
    setInterval(() => {
      this.checkDeviceTimeout();
    }, DEVICE_CHECK_INTERVAL);
  }

  onBLEAdapterStateChanged(state) {
    console.log('BLE Adapter State: ', state);
    if (state === 'poweredOn') {
      noble.startScanning([], true);
    } else {
      noble.stopScanning();
    }
  }

  onBLEDeviceDiscovered(device) {
    if (device.advertisement.manufacturerData) {
      var data = device.advertisement.manufacturerData;
      //    console.log(device.advertisement.manufacturerData);
      var vars = binary
        .parse(data)
        .word16lu('manufacturerID')
        .word16lu('deviceSKU')
        .word8('version.major')
        .word8('version.minor')
        .word8('version.patch')
        .buffer('deviceId', 6)
        .word16lu('position').vars;

      const devId = vars.deviceId.toString('hex');
      // console.log(
      //   `[DEBUG] ManufacturerId: ${
      //     vars.manufacturerID
      //   }, DevId: ${devId}, DevSKU: ${vars.deviceSKU}`
      // );
      if (vars.manufacturerID == 0x6012 && vars.deviceSKU === 2) {
        const pos = vars.position / MAX_POSITION;
        if (typeof this.positions[devId] === 'undefined') {
          this.positions[devId] = pos;
          this.emit('deviceFound', devId);
          console.log(`found device ${devId}`);
        }
        this.positions[devId] = pos;
        // console.log(`position (${devId}) = ${pos}`);
        this.timers[devId] = Date.now();
      }
    }
  }
  checkDeviceTimeout() {
    Object.keys(this.timers).forEach(devId => {
      if (!this.timers[devId]) return;
      if (Date.now() - this.timers[devId] > DEVICE_TIMEOUT) {
        this.emit('deviceLost', devId);
        console.log(`lost device ${devId}`);
        delete this.timers[devId];
        delete this.positions[devId];
      }
    });
  }
}

function precise(x, precision) {
  return Number.parseFloat(x).toPrecision(precision);
}

module.exports = new BLERemoteDaemon();
