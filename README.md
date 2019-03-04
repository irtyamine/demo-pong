# BLE Pong Live Coding demo

**Warning** Compatible with node v8.15.0

## TODO

1. Code the logic that sends the `deviceFound` event and updates the position on
each device frame in the BLE daemon.
2. (if we have the time) Code the logic that sends the `deviceLost` event in the
BLE daemon.

## The tools

- [Noble](https://github.com/noble/noble)
- [Binary](https://github.com/substack/node-binary)

## The structure of a BLE advertisment frame

- [W16LU] `manufacturerID`
- [W16LU] `deviceSKU`
- [W8] `version.major`
- [W8] `version.minor`
- [W8] `version.patch`
- [BUF6] `deviceId`
- [W16LU] `position`

## BLE pads data

* `manufacturerID`: 0x6012
* `deviceSKU`: 2
* Position range: 4095