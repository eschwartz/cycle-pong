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


export var toRadians = degrees => degrees * (Math.PI / 180);
