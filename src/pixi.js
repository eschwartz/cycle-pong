import {Observable} from 'rx';
import {Scheduler} from 'rx-dom';
import {run} from '@cycle/core';
import makePixiDriver from './driver/pixi-driver.js';

function main({pixi}) {
  return {
    pixi: Observable.interval(1000, Scheduler.requestAnimationFrame).
      timestamp().
      take(10).
      map(ts => ({
        graphics: [
          {
            id: 'ball',
            type: 'circle',
            x: 100 + ts.value * 10,
            y: 100 + ts.value * 10,
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