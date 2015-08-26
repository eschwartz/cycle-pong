import _ from 'lodash';

//http://math.stackexchange.com/questions/143932/calculate-point-given-x-y-angle-and-distance
export var move = ({x, y}) => ({dx, dy}) => speed => {
  return {
    x: x + speed * (dx / dy),
    y: y + speed * (dy / dx)
  };
};

export var addPoints = (pointA, pointB) => ({
  x: pointA.x + pointB.x,
  y: pointA.y + pointB.y
});

export function randomVelocity(speed) {
  var randomDir;
  var isTooVertical = dir => (
    (dir > radians(0.4) && dir < radians(0.6)) ||
    (dir > radians(1.4) && dir < radians(1.6))
  );

  do {
    randomDir = _.random(0, Math.PI * 2);
  } while (isTooVertical(randomDir));

  return velocity(randomDir, speed);
}

export function velocity(radians, speed) {
  return {
    x: Math.cos(radians) * speed,
    y: Math.sin(radians) * speed
  }
}

export function radians(radians) {
  return Math.PI * radians;
}

export function randomSign() {
  return Math.random() >= 0.5 ? 1 : -1;
}


export var toRadians = degrees => degrees * (Math.PI / 180);
