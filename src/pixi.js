import {Observable} from 'rx';
import {Scheduler} from 'rx-dom';
import {run} from '@cycle/core';
import makePixiDriver from './driver/pixi-driver.js';

function main({pixi}) {
  return {
    pixi: Observable.interval(1 / 60, Scheduler.requestAnimationFrame).
      timestamp().
      map(ts => ({
        graphics: [
          {
            id: 'ball',
            type: 'circle',
            x: 100 + ts.value * 2,
            y: 100 + ts.value * 2,
            radius: 25,
            fill: 0xFF0000,
            alpha: 1
          }
        ]
      }))
  }
}

run(main, {
  pixi: makePixiDriver(document.getElementById('game'), 800, 600)
});