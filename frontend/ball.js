const SPEED_FACTOR = 1;
const INITIAL_SPEED = 5;
const PADDLE_SPEED_DIVIDEND = 14;
const MAX_ABS_SPEED = 20;

function Ball(x, y, context, radius, onBallOutBottom, onBallOutTop) {
  this.context = context;
  this.x = x;
  this.y = y;
  this.x_speed = 0;
  this.y_speed = INITIAL_SPEED;
  this.radius = radius;
  this.onBallOutBottom = onBallOutBottom;
  this.onBallOutTop = onBallOutTop;
}

Ball.prototype.render = function() {
  this.context.beginPath();
  this.context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
  this.context.fillStyle = '#FFFFFF';
  this.context.fill();
};

Ball.prototype.update = function(paddle1, paddle2, stageWidth, stageHeight) {
  this.x += this.x_speed;
  this.y += this.y_speed;
  var top_x = this.x - this.radius;
  var top_y = this.y - this.radius;
  var bottom_x = this.x + this.radius;
  var bottom_y = this.y + this.radius;

  if (this.x - this.radius < 0) {
    this.x = this.radius;
    this.x_speed = -this.x_speed;
  } else if (this.x + this.radius > stageWidth) {
    this.x = stageWidth - this.radius;
    this.x_speed = -this.x_speed;
  }

  if (this.y < 0) {
    this.resetBall(stageWidth, stageHeight);
    if (this.onBallOutTop) {
      this.onBallOutTop();
    }
  }

  if (this.y > stageHeight) {
    this.resetBall(stageWidth, stageHeight);
    if (this.onBallOutBottom) {
      this.onBallOutBottom();
    }
  }

  if (top_y > stageHeight / 2) {
    if (
      top_y < paddle1.y + paddle1.height &&
      bottom_y > paddle1.y &&
      top_x < paddle1.x + paddle1.width &&
      bottom_x > paddle1.x
    ) {
      this.y_speed *= this.computeSpeedFactor(paddle1.x_speed);
      this.x_speed += paddle1.x_speed / 2 + Math.random();
      this.y += this.y_speed;
    }
  } else {
    if (
      top_y < paddle2.y + paddle2.height &&
      bottom_y > paddle2.y &&
      top_x < paddle2.x + paddle2.width &&
      bottom_x > paddle2.x
    ) {
      this.y_speed *= this.computeSpeedFactor(paddle2.x_speed);
      this.x_speed += paddle2.x_speed / 2 + Math.random();
      this.y += this.y_speed;
    }
  }
  this.y_speed = this.capSpeed(this.y_speed);
};

Ball.prototype.computeSpeedFactor = function(paddleSpeed) {
  return -(SPEED_FACTOR + Math.abs(paddleSpeed) / PADDLE_SPEED_DIVIDEND);
};

Ball.prototype.capSpeed = function(speed) {
  if (speed >= MAX_ABS_SPEED) return MAX_ABS_SPEED;
  if (speed <= MAX_ABS_SPEED * -1) return MAX_ABS_SPEED * -1;
  return speed;
};

Ball.prototype.resetBall = function(stageWidth, stageHeight) {
  this.x_speed = 0;
  this.y_speed = INITIAL_SPEED;
  this.x = stageWidth / 2;
  this.y = stageHeight / 2;
};

module.exports = Ball;
