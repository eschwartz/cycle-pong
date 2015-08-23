import StdOutCanvas from '../canvas/stdout-map-canvas';

export default function makeStdOutCanvasDriver(width, height) {
  var canvas = new StdOutCanvas(width, height);

  return function stdOutDriver($points) {
    $points.forEach(pointSets => {
      canvas.reset();

      pointSets.forEach(({points, char}) =>
        points.forEach(point => canvas.setPoint(point, char)));

      canvas.redraw();
    });
  }
}