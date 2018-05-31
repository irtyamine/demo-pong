function Paddle(x, y, context, stageWidth, stageHeight) {
  this.x = x;
  this.y = y;
  this.width = stageWidth;
  this.height = stageHeight;
  this.x_speed = 0;
  this.y_speed = 0;
  this.context = context;
}

Paddle.prototype.render = function() {
  this.context.fillStyle = '#FFFFFF';
  this.context.fillRect(this.x, this.y, this.width, this.height);
};

Paddle.prototype.setXPosition = function(pos, stageWidth) {
  this.x = pos * stageWidth;
};

Paddle.prototype.move = function(x, y, stageWidth, stageHeight) {
  this.x += x;
  this.y += y;
  // this.x_speed = x;
  // this.y_speed = y;
  if (this.x < 0) {
    this.x = 0;
    this.x_speed = 0;
  } else if (this.x + this.width > stageWidth) {
    this.x = stageWidth - this.width;
    this.x_speed = 0;
  }
};

module.exports = Paddle;
