const Paddle = require('./paddle.js');
const SPEED_FACTOR = 2;
const INERTIA = 0.2;
const MAX_ABS_SPEED = 15;

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
  paddleYPosition,
  debug = false
) {
  this.paddle = new Paddle(
    stageWidth / 2 - paddleWidth / 2,
    paddleYPosition,
    context,
    paddleWidth,
    paddleHeight
  );
  this.xTarget = stageWidth / 2 - paddleWidth / 2;
  this.y = paddleYPosition;
  this.xAcceleration = 0;
  this.debug = debug;
}

Player.prototype.render = function() {
  this.paddle.render();
};

Player.prototype.setXTarget = function(absolutePosition, stageWidth) {
  this.xTarget = (1 - absolutePosition) * (stageWidth - this.paddle.width);
};

Player.prototype.update = function(stageWidth, stageHeight) {
  this.xAcceleration = computeAcceleration(
    this.paddle.x,
    this.xTarget,
    this.paddle.x_speed
  );
  var speed = computeSpeed(this.paddle.x_speed, this.xAcceleration);
  // const speed = computeSpeed(this.paddle.x, this.xTarget);
  if (this.debug) {
    console.log(`t: ${this.xTarget}, p: ${this.paddle.x}, s: ${speed}`);
  }
  this.paddle.x_speed = speed;
  this.paddle.update(stageWidth, stageHeight);
};

function computeAcceleration(origin, destination, currentSpeed) {
  const distance = destination - origin;
  return distance - currentSpeed;
}

function computeSpeed(currentSpeed, currentAcceleration) {
  const speed = (currentSpeed + currentAcceleration) * INERTIA;
  if (speed >= MAX_ABS_SPEED) return MAX_ABS_SPEED;
  if (speed <= MAX_ABS_SPEED * -1) return MAX_ABS_SPEED * -1;
  return speed;
}

// function computeSpeed(pos, target) {
//   const abs = Math.abs;
//   const delta = target - pos;
//   const sign = delta === 0 ? 1 : delta / abs(delta);
//   const speed = SPEED_FACTOR * Math.log2(abs(delta) + 1) * sign;
//   return speed;
// }

module.exports = { Computer, Player };
