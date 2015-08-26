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
  BounceRight: state => {
    state.entities.ball.velocity.x = Math.abs(state.entities.ball.velocity.x);
    return state;
  },
  BounceLeft: state => {
    state.entities.ball.velocity.x = Math.abs(state.entities.ball.velocity.x) * -1;
    return state;
  },
  ScorePlayerA: state => _.extend(state, {playerAPoints: state.playerAPoints + 1}),
  ScorePlayerB: state => _.extend(state, {playerBPoints: state.playerBPoints + 1}),
  ResetBall: state => {
    _.extend(state.entities.ball, {
      position: Point(_.random(200, state.gameWidth - 200), _.random(200, state.gameHeight - 200)),
      velocity: randomVelocity(5)
    });
    return state;
  },
  ChangeVelocity: entityId => velocity => state => {
    state.entities[entityId].velocity = velocity;
    return state
  },
  AddBallDy: dy => state => {
    state.entities.ball.velocity.y += dy;
    return state;
  }
};

const Keys = {
  DOWN: 40,
  UP: 38,
  w: 87,
  s: 83,
  a: 65,
  d: 68
};

function intent() {
  var keyDown$ = key => Observable.fromEvent(document, 'keydown').
    filter(evt => evt.which === key);
  var keyUp$ = key => Observable.fromEvent(document, 'keyup').
    filter(evt => evt.which === key);
  var playerSpeed = 8;

  return {
    $advanceEntities: $tick.
      map(() => Actions.AdvanceAllEntities),
    $playerBMoveDown: keyDown$(Keys.DOWN).
      map(() => Actions.ChangeVelocity('playerB')(Point(0, playerSpeed))),
    $playerBMoveUp: keyDown$(Keys.UP).
      map(() => Actions.ChangeVelocity('playerB')(Point(0, playerSpeed * -1))),
    $stopPlayerB: Observable.merge(keyUp$(Keys.UP), keyUp$(Keys.DOWN)).
      map(() => Actions.ChangeVelocity('playerB')(Point(0, 0))),
    $playerAMoveDown: keyDown$(Keys.s).
      map(() => Actions.ChangeVelocity('playerA')(Point(0, playerSpeed))),
    $playerAMoveUp: keyDown$(Keys.w).
      map(() => Actions.ChangeVelocity('playerA')(Point(0, playerSpeed * -1))),
    $stopPlayerA: Observable.merge(keyUp$(Keys.s), keyUp$(Keys.w)).
      map(() => Actions.ChangeVelocity('playerA')(Point(0, 0)))
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
    filter(x => x.isEvent).
    map(x => x.val);
}

function boxCollision(entityA, entityB) {
  return (
    entityA.position.x < entityB.position.x + entityB.dimensions.width &&
    entityA.position.x + entityA.dimensions.width > entityB.position.x &&
    entityA.position.y < entityB.position.y + entityB.dimensions.height &&
    entityA.dimensions.height + entityA.position.y > entityB.position.y
  )
}

function model(actions) {
  var operations = new Subject();
  var $state = operations.
    scan(initialState, (state, operation) => operation(state)).
    // Share makes it so that this stream only runs once
    // for each subscription
    share();

  Observable.merge(_.values(actions)).subscribe(operations);
  /*actions.$advanceEntities.subscribe(operations);
  actions.$playerAMoveDown.
    subscribe(operations, null, Log('move down complete'));*/

  var collisionEvent = event($state);
  var $goalACollision = collisionEvent(state => state.entities.ball.position.x <= 0);
  var $goalBCollision = collisionEvent(state => state.entities.ball.position.x >= state.gameWidth);
  var $wallTopCollision = collisionEvent(state => state.entities.ball.position.y <= 0);
  var $wallBottomCollision = collisionEvent(state => state.entities.ball.position.y >= state.gameHeight);

  var $playerACollision = collisionEvent(state => boxCollision(state.entities.playerA, state.entities.ball));
  var $playerBCollision = collisionEvent(state => boxCollision(state.entities.playerB, state.entities.ball));

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

  $playerACollision.
    map(() => Actions.BounceRight).
    subscribe(operations);

  $playerBCollision.
    map(() => Actions.BounceLeft).
    subscribe(operations);

  var collisionOffset$ = ($collision, playerId) => {
    return $collision.
      map(state => {
      var player = state.entities[playerId];
      var ball = state.entities.ball;
      var paddleMidpoint = player.position.y + (player.dimensions.height / 2);
      return ball.position.y - paddleMidpoint;
    });
  };

  // Change ball direction, from paddle offset
  collisionOffset$($playerACollision, 'playerA').
    map(offsetY => Actions.AddBallDy(offsetY / 10)).
    subscribe(operations);

  collisionOffset$($playerBCollision, 'playerB').
    map(offsetY => Actions.AddBallDy(offsetY / 10)).
    subscribe(operations);

  // Reset ball after goal
  Observable.merge($goalACollision, $goalBCollision).
    map(() => Actions.ResetBall).
    subscribe(operations);

  /*
  // wip: trying to keep paddles within game board

  event($state)(state => boxCollision(state.entities.playerA, state.entities.wallTop)).
    map(() => state => {
      state.entities.playerA.velocity = Point(0, 0);
      return state;
    }).
    subscribe(operations);*/

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
    var {ball, playerA, playerB} = state.entities;
    return {
      graphics: [
        {
          id: 'ball',
          type: 'circle',
          x: ball.position.x,
          y: ball.position.y,
          radius: state.entities.ball.dimensions.width / 2,
          fill: 0xFFFFFF,
          alpha: 1
        },
        {
          id: 'playerA',
          type: 'rectangle',
          x: playerA.position.x,
          y: playerA.position.y,
          width: playerA.dimensions.width,
          height: playerA.dimensions.height,
          fill: 0xFFFFFF,
          alpha: 1
        },
        {
          id: 'playerB',
          type: 'rectangle',
          x: playerB.position.x,
          y: playerB.position.y,
          width: playerB.dimensions.width,
          height: playerA.dimensions.height,
          fill: 0xFFFFFF,
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
  return function() {
    console.log(msg, ...arguments)
  };
}