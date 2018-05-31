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

const canvas = document.createElement('canvas');
const stageWidth = document.body.offsetWidth;
const stageHeight = document.body.offsetHeight;
canvas.width = stageWidth;
canvas.height = stageHeight;
const paddleWidth = stageWidth * 0.06;
const paddleHeight = 10;
var context = canvas.getContext('2d');

var playing = false;
var playersById = {};
const paddlePositions = [stageHeight - paddleHeight * 2, paddleHeight * 2];
var ball = undefined;

var render = function() {
  context.fillStyle = '#383838';
  context.fillRect(0, 0, stageWidth, stageHeight);
  Object.keys(playersById).forEach(playerId => {
    playersById[playerId].render();
  });
  if (ball) {
    ball.render();
  }
};

var update = function() {
  Object.keys(playersById).forEach(playerId => {
    playersById[playerId].update(stageWidth, stageHeight);
  });
  if (ball) {
    ball.update(
      playersById[Object.keys(playersById)[0]].paddle,
      playersById[Object.keys(playersById)[1]].paddle,
      stageWidth,
      stageHeight
    );
  }
};

var step = function() {
  update();
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

function initBall(incrementFunction) {
  ball = new Ball(
    stageWidth / 2,
    stageHeight / 2,
    context,
    () => {
      incrementFunction(0);
    },
    () => {
      incrementFunction(1);
    }
  );
}

module.exports = {
  isPlaying: playing,
  init: (canvasContainer, incrementFunction) => {
    canvasContainer.appendChild(canvas);
    initBall(incrementFunction);
  },
  setPlaying: setPlaying,
  addPlayer: id => {
    let player = new Player(
      context,
      stageWidth,
      stageHeight,
      paddleWidth,
      paddleHeight,
      paddlePositions[Object.keys(playersById).length]
    );
    playersById[id] = player;
    return Object.keys(playersById);
  },
  removePlayer: id => {},
  updatePosition: (id, position) => {
    if (!playersById[id]) {
      console.warn(`received position for unknown player id ${id}`);
      return;
    }
    // if (id === Object.keys(playersById)[0]) {
    //   console.log(position);
    // }

    playersById[id].setXPosition(position, stageWidth);
  }
};
