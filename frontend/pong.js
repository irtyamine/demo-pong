var stageWidth = document.body.offsetWidth;
var stageHeight = document.body.offsetHeight;
const paddleWidth = 50;
const paddleHeight = 10;
var playing = false;

var animate =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
var canvas = document.createElement("canvas");
canvas.width = stageWidth;
canvas.height = stageHeight;
var context = canvas.getContext("2d");
var player = new Player();
var computer = new Computer();
var ball = new Ball(stageWidth / 2, stageHeight / 2);

var keysDown = {};

var render = function() {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, stageWidth, stageHeight);
  player.render();
  computer.render();
  ball.render();
};

var update = function() {
  player.update();
  computer.update(ball);
  ball.update(player.paddle, computer.paddle);
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
    animate(step)
  }
}

function Paddle(x, y, stageWidth, stageHeight) {
  this.x = x;
  this.y = y;
  this.width = stageWidth;
  this.height = stageHeight;
  this.x_speed = 0;
  this.y_speed = 0;
}

Paddle.prototype.render = function() {
  context.fillStyle = "#FFFFFF";
  context.fillRect(this.x, this.y, this.width, this.height);
};

Paddle.prototype.move = function(x, y) {
  this.x += x;
  this.y += y;
  this.x_speed = x;
  this.y_speed = y;
  if (this.x < 0) {
    this.x = 0;
    this.x_speed = 0;
  } else if (this.x + this.width > stageWidth) {
    this.x = stageWidth - this.width;
    this.x_speed = 0;
  }
};

function Computer() {

  this.paddle = new Paddle(
    stageWidth / 2 - paddleWidth / 2,
    paddleHeight,
    paddleWidth,
    paddleHeight
  );
}

Computer.prototype.render = function() {
  this.paddle.render();
};

Computer.prototype.update = function(ball) {
  var x_pos = ball.x;
  var diff = -(this.paddle.x + this.paddle.width / 2 - x_pos);
  if (diff < 0 && diff < -4) {
    diff = -5;
  } else if (diff > 0 && diff > 4) {
    diff = 5;
  }
  this.paddle.move(diff, 0);
  if (this.paddle.x < 0) {
    this.paddle.x = 0;
  } else if (this.paddle.x + this.paddle.width > stageWidth) {
    this.paddle.x = stageWidth - this.paddle.width;
  }
};

function Player() {
  this.paddle = new Paddle(
    stageWidth / 2 - paddleWidth / 2,
    stageHeight - paddleHeight * 2,
    paddleWidth,
    paddleHeight
  );
}

Player.prototype.render = function() {
  this.paddle.render();
};

Player.prototype.update = function() {
  for (var key in keysDown) {
    var value = Number(key);
    if (value == 37) {
      this.paddle.move(-4, 0);
    } else if (value == 39) {
      this.paddle.move(4, 0);
    } else {
      this.paddle.move(0, 0);
    }
  }
};

function Ball(x, y) {
  this.x = x;
  this.y = y;
  this.x_speed = 0;
  this.y_speed = 3;
}

Ball.prototype.render = function() {
  context.beginPath();
  context.arc(this.x, this.y, 5, 2 * Math.PI, false);
  context.fillStyle = "#FFFFFF";
  context.fill();
};

Ball.prototype.update = function(paddle1, paddle2) {
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

  if (this.y < 0 || this.y > stageHeight) {
    this.x_speed = 0;
    this.y_speed = 3;
    this.x = stageWidth / 2;
    this.y = stageHeight / 2;
  }

  if (top_y > stageHeight / 2) {
    if (
      top_y < paddle1.y + paddle1.height &&
      bottom_y > paddle1.y &&
      top_x < paddle1.x + paddle1.width &&
      bottom_x > paddle1.x
    ) {
      this.y_speed = -3;
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
      this.x_speed += paddle2.x_speed / 2;
      this.y += this.y_speed;
    }
  }
};

document.body.appendChild(canvas);
animate(step);

window.addEventListener("keydown", function(event) {
  if (event.keyCode === 32) {
      togglePlaying()
  }
  keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function(event) {
  delete keysDown[event.keyCode];
});
