const Ball = require('./ball.js');
const Computer = require('./players').Computer;
const Player = require('./players').Player;

var stageWidth = document.body.offsetWidth;
var stageHeight = document.body.offsetHeight;
const paddleWidth = 50;
const paddleHeight = 10;
var playing = false;
var score = [0, 0];

var animate =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
var canvas = document.createElement('canvas');
canvas.width = stageWidth;
canvas.height = stageHeight;
var context = canvas.getContext('2d');
var player = new Player(
  context,
  stageWidth,
  stageHeight,
  paddleWidth,
  paddleHeight
);
var computer = new Computer(
  context,
  stageWidth,
  stageHeight,
  paddleWidth,
  paddleHeight
);
var ball = new Ball(
  stageWidth / 2,
  stageHeight / 2,
  context,
  () => {
    computer.score++;
    console.log(`Computer: ${computer.score}`);
    document.getElementById('score-player-1').innerHTML = computer.score;
  },
  () => {
    player.score++;
    console.log(`Player: ${player.score}`);
    document.getElementById('score-player-2').innerHTML = player.score;
  }
);

var render = function() {
  context.fillStyle = '#383838';
  context.fillRect(0, 0, stageWidth, stageHeight);
  player.render();
  computer.render();
  ball.render();
};

var update = function() {
  player.update(stageWidth, stageHeight);
  computer.update(ball, stageWidth, stageHeight);
  ball.update(player.paddle, computer.paddle, stageWidth, stageHeight);
};

var step = function() {
  update();
  render();
  if (playing) {
    animate(step);
  }
};

function togglePlaying() {
  playing = !playing;
  if (playing) {
    document.getElementsByClassName('splash')[0].style.visibility = 'hidden';
    animate(step);
  } else {
    document.getElementsByClassName('splash')[0].style.visibility = 'visible';
  }
}

document.getElementsByClassName('pong-container')[0].appendChild(canvas);
document.getElementById('score-player-1').innerHTML = computer.score;
document.getElementById('score-player-2').innerHTML = player.score;

animate(step);

window.addEventListener('keydown', function(event) {
  if (event.keyCode === 32) {
    togglePlaying();
  }
});

if (module.hot) {
  module.hot.dispose(function() {
    document.getElementsByClassName('pong-container')[0].innerHTML = '';
  });

  module.hot.accept(function() {
    // module or one of its dependencies was just updated
  });
}
