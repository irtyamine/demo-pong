var noble = require('noble');
var binary = require('binary')


function onBLEAdapterStateChanged(state) {
  console.log("BLE Adapter State: ", state)
  if (state === 'poweredOn') {
    noble.startScanning([], true);
  } else {
    noble.stopScanning();
  }
}

function onBLEDeviceDiscovered(device) {

  if (device.advertisement.manufacturerData) {
    var data = device.advertisement.manufacturerData
//    console.log(device.advertisement.manufacturerData);
    var vars = binary.parse(data)
    .word16lu('manufacturerID')
    .word16lu('deviceSKU')
    .word8('version.major')
      .word8('version.minor')
      .word8('version.patch')
      .buffer('deviceId', 6)
      .word16lu('position')
      .vars

    if (vars.manufacturerID == 0x6012)
      console.dir(vars.position);
  }
}

console.log("-- Kuzzle Pong BLE remote daemon --------------")


noble.on('stateChange', onBLEAdapterStateChanged);
noble.on('discover', onBLEDeviceDiscovered);