import Vue from 'vue';
const ws = new WebSocket('ws://localhost:8080');
const pong = require('./pong.js');

// ws.on('connection', () => {
//   ws.on('playerIn', payload => {});

//   ws.on('playerOut', payload => {});

//   ws.on('position', payload => {});
// });

// pong.addPlayer('lol');
// pong.addPlayer('lulz');
