import {run} from '@cycle/core';
import _ from 'lodash';
import Rx from 'rx';
import initialState from './state/initial';
import createArray from './util/create-array';
import makePixiDriver from './driver/pixi-driver.js';
import {Point} from './geometry/geometries';
import $tick from './util/tick';
import {move, addPoints, randomVelocity} from './geometry/util';
import {Scheduler} from 'rx-dom';

var {Observable, Subject} = Rx;

Rx.config.longStackSupport = true;

Observable.prototype.applyTo = function(seed) {
  return this.scan(seed, (seedVal, operation) => operation(seedVal)).startWith(seed);
};

var Actions = {
  AdvanceEntity: entityId => state => {
    var entity = state.entities[entityId];
    entity.position = addPoints(entity.position, entity.velocity);
    return state;
  },
  AdvanceAllEntities: state => _.keys(state.entities).
    reduce((state, entityId) => Actions.AdvanceEntity(entityId)(state), state),
  BounceDown: state => {
    state.entities.ball.velocity.y = Math.abs(state.entities.ball.velocity.y);
    return state;
  },
  BounceUp: state => {
    state.entities.ball.velocity.y = Math.abs(state.entities.ball.velocity.y) * -1;
    return state;
  },
  ScorePlayerA: state => _.extend(state, { playerAPoints: state.playerAPoints + 1}),
  ScorePlayerB: state => _.extend(state, { playerBPoints: state.playerBPoints + 1}),
  ResetBall: state => {
    _.extend(state.entities.ball, {
      position: Point(_.random(200, state.gameWidth - 200), _.random(200, state.gameHeight - 200)),
      velocity: randomVelocity(5)
    });
    return state;
  }
};

function intent(DOM) {
  return {
    $advanceEntities: $tick.
      map(() => Actions.AdvanceAllEntities)
  };
}


/**
 * Returns a stream of events
 * defined by a predicate.
 * Each event will only emit once, while the predicate is satisfied.
 *
 * eg.
 *
 * event(Observable.from([1, -1, -2, -3, 4, 5])(x => x > 0)).
 *  subscribe(x => console.log('event', x)
 *
 *  // event, 1
 *  // event, 4
 */
function event($source) {
  return isEvent => $source.
    map(item => ({
      val: item,
      isEvent: isEvent(item)
    })).
    // Only return a single collision event
    distinctUntilChanged(x => x.isEvent).
    filter(x => x.val).
    map(x => x.val);
}

function model(actions) {
  var operations = new Subject();
  var $state = operations.
    scan(initialState, (state, operation) => operation(state)).
    // Share makes it so that this stream only runs once
    // for each subscription
    share();


  actions.$advanceEntities.
    subscribe(operations);

  var collisionEvent = event($state);
  var $goalACollision = collisionEvent(state => state.entities.ball.position.x <= 0);
  var $goalBCollision = collisionEvent(state => state.entities.ball.position.x >= state.gameWidth);
  var $wallTopCollision = collisionEvent(state => state.entities.ball.position.y <= 0);
  var $wallBottomCollision = collisionEvent(state => state.entities.ball.position.y >= state.gameHeight);

  $goalACollision.
    map(() => Actions.ScorePlayerB).
    subscribe(operations);

  $goalBCollision.
    map(() => Actions.ScorePlayerA).
    subscribe(operations);

  $wallTopCollision.
    map(() => Actions.BounceDown).
    subscribe(operations);

  $wallBottomCollision.
    map(() => Actions.BounceUp).
    subscribe(operations);

  Observable.merge($goalACollision, $goalBCollision).
    map(() => Actions.ResetBall).
    subscribe(operations);

  // Start out with the ball in a random location
  operations.onNext(Actions.ResetBall);

  return $state;
}

function view($state) {
  $state.
    startWith(initialState).
    forEach(state => {
      document.getElementById('playerAScore').innerText = state.playerAPoints;
      document.getElementById('playerBScore').innerText = state.playerBPoints;
    });

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

function Log(msg) {
  return function() { console.log(msg, ...arguments) };
}