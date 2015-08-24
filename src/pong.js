import {run} from '@cycle/core';
import _ from 'lodash';
import {Observable, BehaviorSubject} from 'rx';
import initialState from './state/initial';
import createArray from './util/create-array';
import makePixiDriver from './driver/pixi-driver.js';
import {Point} from './geometry/geometries';
import $tick from './util/tick';
import {move, addPoints} from './geometry/util';


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
      position: Point(_.random(100, state.gameWidth - 100), _.random(100, state.gameHeight - 100)),
      velocity: {x: _.random(-1, 1, true), y: _.random(-1, 1, true)}
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

function model(actions) {
  var operations = new BehaviorSubject(x => x);
  var $state = operations.
    sample($tick).
    scan(initialState, (state, operation) => {
      return operation(state);
    }).
    startWith(initialState);


  actions.$advanceEntities.subscribe(operations);

  var $wallTopCollisions = $state.
    filter(state => state.entities.ball.position.y <= 0);
  var $wallBottomCollisions = $state.
    filter(state => state.entities.ball.position.y >= state.gameHeight);

  var $playerAGoalCollision = $state.
    filter(state => state.entities.ball.position.x <= 0);
  var $playerBGoalCollision = $state.
    filter(state => state.entities.ball.position.x >= state.gameWidth);

  $wallTopCollisions.
    map(() => Actions.BounceDown).
    subscribe(operations);
  $wallBottomCollisions.
    map(() => Actions.BounceUp).
    subscribe(operations);

  $playerAGoalCollision.
    map(() => Actions.ScorePlayerB).
    subscribe(operations);

  $playerBGoalCollision.
    map(() => Actions.ScorePlayerA).
    subscribe(operations);

  Observable.merge($playerAGoalCollision, $playerBGoalCollision).
    map(() => Actions.ResetBall).
    subscribe(operations);

  return $state;
}

function view($state) {
  $state.forEach(state => {
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