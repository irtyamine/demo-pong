function Ball(x, y, context, onBallOutBottom, onBallOutTop) {
  this.context = context;
  this.x = x;
  this.y = y;
  this.x_speed = 0;
  this.y_speed = 3;
  this.onBallOutBottom = onBallOutBottom;
  this.onBallOutTop = onBallOutTop;
}

Ball.prototype.render = function() {
  this.context.beginPath();
  this.context.arc(this.x, this.y, 5, 2 * Math.PI, false);
  this.context.fillStyle = '#FFFFFF';
  this.context.fill();
};

Ball.prototype.update = function(paddle1, paddle2, stageWidth, stageHeight) {
  this.x += this.x_speed;
  this.y += this.y_speed;
  var top_x = this.x - 5;
  var top_y = this.y - 5;
  var bottom_x = this.x + 5;
  var bottom_y = this.y + 5;

  if (this.x - 5 < 0) {
    this.x = 5;
    this.x_speed = -this.x_speed;
  } else if (this.x + 5 > stageWidth) {
    this.x = stageWidth - 5;
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
      this.y_speed = -3;
      // console.log(`just hit paddle 1 (speed ${paddle1.x_speed})`);
      this.x_speed += paddle1.x_speed / 2;
      this.y += this.y_speed;
    }
  } else {
    if (
      top_y < paddle2.y + paddle2.height &&
      bottom_y > paddle2.y &&
      top_x < paddle2.x + paddle2.width &&
      bottom_x > paddle2.x
    ) {
      this.y_speed = 3;
      // console.log(`just hit paddle 2 (speed ${paddle2.x_speed})`);
      this.x_speed += paddle2.x_speed / 2;
      this.y += this.y_speed;
    }
  }
};

Ball.prototype.resetBall = function(stageWidth, stageHeight) {
  this.x_speed = 0;
  this.y_speed = 3;
  this.x = stageWidth / 2;
  this.y = stageHeight / 2;
};

module.exports = Ball;