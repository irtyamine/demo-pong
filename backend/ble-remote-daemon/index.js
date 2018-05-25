var noble = require('noble');
var binary = require('binary');
const EventEmitter = require('events');
const DEVICE_TIMEOUT = 2000;

class BLERemoteDaemon extends EventEmitter {
  constructor() {
    console.log('-- Kuzzle Pong BLE remote daemon --------------');

    this.devicesList = {};
    noble.on('stateChange', this.onBLEAdapterStateChanged);
    noble.on('discover', this.onBLEDeviceDiscovered);
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

      const devId = 'lol';
      if (vars.manufacturerID == 0x6012) {
        if (!this.devicesList[devId]) {
          this.emit('deviceFound', devId);
        } else {
          if (this.devicesList[devId].position != vars.position) {
            this.devicesList[devId].position = vars.position;
            this.emit('position', {
              deviceId: devId,
              value: vars.position
            });
          }
        }
        // TODO handle device disconnection
      }
    }
  }
}

module.exports = new BLERemoteDaemon();
