import {run} from '@cycle/core';
import _ from 'lodash';
import {Observable} from 'rx';
import initialState from './state/initial';
import createArray from './util/create-array';
import makeStdoutCanvasDriver from './driver/stdout-canvas-driver';
import {Point} from './geometry/geometries';

Observable.prototype.applyTo = function(seed) {
  return this.scan(seed, (seedVal, operation) => operation(seedVal)).startWith(seed);
};

function intent(DOM) {
  return {};
}

function model(actions) {
  return Observable.from([initialState]);
}

function view($state) {
  return $state.map(state => ({
    graphics: [
      {
        type: 'circle',
        x: state.entities.ball.dimensions.x,
        y: state.entities.dimensions.y,
        radius: 5,
        fill: 0xFFFFFF, // use parseInt(0xFFFFFF, 16), I thinkg
        alpha: 1
      }
    ]
  }));
}

function entityPoints(entity) {
  var row = y => createArray(entity.dimensions.width).
    map((x, i) => Point(entity.position.x + i, y));

  var rows = createArray(entity.dimensions.height).
    map((x, i) => row(i));

  // Flatten by one dimension, so we have a list of points
  return _.flatten(rows, true);
}


function main({canvas}) {
  return {
    canvas: view(model(intent(canvas)))
      .catch((err) => {
        console.error(err.stack);
        debugger;
      })
  }
}

run(main, {
  canvas: makeStdoutCanvasDriver(20, 15)
});