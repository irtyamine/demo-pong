var noble = require('noble');
var binary = require('binary');
const EventEmitter = require('events');

const DEVICE_TIMEOUT = 2000;
const MAX_POSITION = 4095;
class BLERemoteDaemon extends EventEmitter {
  constructor() {
    super();
    console.log('-- Kuzzle Pong BLE remote daemon --------------');

    this.positions = {};
    noble.on('stateChange', this.onBLEAdapterStateChanged);
    noble.on('discover', this.onBLEDeviceDiscovered.bind(this));
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
      if (vars.manufacturerID == 0x6012 && vars.deviceSKU === 2) {
        const pos = vars.position / MAX_POSITION;
        if (typeof this.positions[devId] === 'undefined') {
          this.positions[devId] = {
            position: pos,
            timeoutId: null
          };
          this.emit('deviceFound', devId);
        } else {
          if (this.positions[devId].position != pos) {
            this.positions[devId].position = pos;
            this.emit('position', devId, pos);
            // if (devId === Object.keys(this.positions)[0]) {
            // console.log(`position (${devId}) = ${pos}`);
            // }
          }
        }
        this.resetDeviceTimeout(devId);
        // TODO handle device disconnection
      }
    }
  }
  resetDeviceTimeout(devId) {
    if (this.positions[devId].timeoutId) {
      clearTimeout(this.positions[devId].timeoutId);
    }
    this.positions[devId].timeoutId = setTimeout(() => {
      delete this.positions[devId];
      this.emit('deviceLost', devId);
    }, DEVICE_TIMEOUT);
  }
}

function precise(x, precision) {
  return Number.parseFloat(x).toPrecision(precision);
}

module.exports = new BLERemoteDaemon();
