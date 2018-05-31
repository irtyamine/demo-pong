const Paddle = require('./paddle.js');
const MAX_ABS_SPEED = 3;

function Computer(context, stageWidth, stageHeight, paddleWidth, paddleHeight) {
  this.paddle = new Paddle(
    stageWidth / 2 - paddleWidth / 2,
    paddleHeight,
    context,
    paddleWidth,
    paddleHeight
  );
  this.score = 0;
}

Computer.prototype.render = function() {
  this.paddle.render();
};

Computer.prototype.update = function(ball, stageWidth, stageHeight) {
  var x_pos = ball.x;
  var diff = -(this.paddle.x + this.paddle.width / 2 - x_pos);
  if (diff < 0 && diff < -4) {
    diff = -5;
  } else if (diff > 0 && diff > 4) {
    diff = 5;
  }
  this.paddle.move(diff, 0, stageWidth, stageHeight);
  if (this.paddle.x < 0) {
    this.paddle.x = 0;
  } else if (this.paddle.x + this.paddle.width > stageWidth) {
    this.paddle.x = stageWidth - this.paddle.width;
  }
};

function Player(
  context,
  stageWidth,
  stageHeight,
  paddleWidth,
  paddleHeight,
  paddleYPosition
) {
  this.paddle = new Paddle(
    stageWidth / 2 - paddleWidth / 2,
    paddleYPosition,
    context,
    paddleWidth,
    paddleHeight
  );
  this.x = stageWidth / 2 - paddleWidth / 2;
}

Player.prototype.render = function() {
  this.paddle.render();
};

Player.prototype.setXPosition = function(position, stageWidth) {
  this.x = position * stageWidth;
  // console.log(`just set player x ${this.x}`);
};

Player.prototype.update = function(stageWidth, stageHeight) {
  const speed = computeSpeed(this.paddle.x, this.x);

  // console.log(`paddle speed is ${speed}`);
  this.paddle.move(speed, 0, stageWidth, stageHeight);
  // for (var key in this.keysDown) {
  //   var value = Number(key);
  //   if (value == 37) {
  //     this.paddle.move(-4, 0, stageWidth, stageHeight);
  //   } else if (value == 39) {
  //     this.paddle.move(4, 0, stageWidth, stageHeight);
  //   } else {
  //     this.paddle.move(0, 0, stageWidth, stageHeight);
  //   }
  // }
};

function computeSpeed(origin, destination) {
  const speed = destination - origin;
  if (speed > MAX_ABS_SPEED) return MAX_ABS_SPEED;
  if (speed < MAX_ABS_SPEED * -1) return MAX_ABS_SPEED * -1;
  return speed;
}

module.exports = { Computer, Player };
