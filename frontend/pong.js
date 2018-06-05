const difference = require('array-difference');
const Ball = require('./ball.js');
const Computer = require('./players').Computer;
const Player = require('./players').Player;

const animate =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };

const stageWidth = document.body.offsetWidth;
const stageHeight = document.body.offsetHeight;
const paddleWidth = stageWidth * 0.09;
const paddleHeight = 10;
const paddleYPositions = {
  bottom: stageHeight - paddleHeight * 2,
  top: paddleHeight * 2
};

const canvas = document.createElement('canvas');
canvas.width = stageWidth;
canvas.height = stageHeight;
var context = canvas.getContext('2d');
var playing = false;
var playersById = {};
var playersByPosition = { top: null, bottom: null };
var ball = undefined;

var render = function() {
  context.fillStyle = '#383838';
  context.fillRect(0, 0, stageWidth, stageHeight);
  const keys = Object.keys(playersById);
  for (let i = 0; i < keys.length; i++) {
    playersById[keys[i]].render();
  }
  if (ball) {
    ball.render();
  }
};

var update = function() {
  if (
    !playersById[playersByPosition.bottom] ||
    !playersById[playersByPosition.top]
  ) {
    return;
  }
  Object.keys(playersById).forEach(playerId => {
    playersById[playerId].update(stageWidth, stageHeight);
  });
  if (ball) {
    ball.update(
      playersById[playersByPosition.bottom].paddle,
      playersById[playersByPosition.top].paddle,
      stageWidth,
      stageHeight
    );
  }
};

var step = function() {
  render();
  if (playing) {
    animate(step);
  }
};

function setPlaying(value) {
  playing = value;
  if (playing) {
    animate(step);
  }
}

setInterval(() => {
  update();
}, 1000 / 60);

function initBall(incrementFunction) {
  ball = new Ball(
    stageWidth / 2,
    stageHeight / 2,
    context,
    10,
    () => {
      incrementFunction(0);
    },
    () => {
      incrementFunction(1);
    }
  );
}

function allocatePlayerYPosition() {
  if (playersByPosition.top === null) {
    return 'top';
  }
  if (playersByPosition.bottom === null) {
    return 'bottom';
  }
  return false;
}

module.exports = {
  isPlaying: playing,
  init: (canvasContainer, incrementFunction) => {
    canvasContainer.appendChild(canvas);
    initBall(incrementFunction);
  },
  setPlaying: setPlaying,
  addPlayer: id => {
    const availablePosition = allocatePlayerYPosition();
    if (!availablePosition) {
      return false;
    }
    let player = new Player(
      context,
      stageWidth,
      stageHeight,
      paddleWidth,
      paddleHeight,
      paddleYPositions[availablePosition]
      // availablePosition === 'top'
    );
    playersById[id] = player;
    playersByPosition[availablePosition] = id;
    return playersByPosition;
  },
  removePlayer: id => {
    if (!playersById[id]) {
      return;
    }
    delete playersById[id];
    playersByPosition.top === id
      ? (playersByPosition.top = null)
      : (playersByPosition.bottom = null);
    return playersByPosition;
  },
  updatePosition: (id, position) => {
    if (!playersById[id]) {
      console.warn(`received position for unknown player id ${id}`);
      return;
    }
    // if (id === Object.keys(playersById)[0]) {
    //   console.log(position);
    // }

    playersById[id].setXTarget(position, stageWidth);
  }
};
