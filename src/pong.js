import {run} from '@cycle/core';
import _ from 'lodash';
import {Observable} from 'rx';
import initialState from './state/initial';
import createArray from './util/create-array';
import makePixiDriver from './driver/pixi-driver.js';
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
  return $state.map(state => {
    return {
      graphics: [
        {
          type: 'circle',
          x: state.entities.ball.position.x,
          y: state.entities.ball.position.y,
          radius: state.entities.ball.dimensions.width / 2,
          fill: 0xFFFFFF, // use parseInt(0xFFFFFF, 16), I think
          alpha: 1
        }
      ]
    }
  });
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
  canvas: makePixiDriver(document.getElementById('game'), 800, 600)
});