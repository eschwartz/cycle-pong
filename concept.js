var state = {
  isPaused: false,
  entities: {
    wallTop: {
      id: 'wallTop',
      position: [0, 0],     // position is location of top-left corder
      width: 100,
      height: 1
    },
    wallBottom: {
      id: 'wallBottom',
      position: [0, 100],
      width: 100,
      height: 1
    },
    goalPlayerA: {
      id: 'goalPlayerA',
      position: [0, 1],
      width: 1,
      height: 98
    },
    goalPlayerB: {
      id: 'goalPlayerB',
      position: [100, 1],
      width: 1,
      height: 98
    },
    playerA: {
      id: 'playerA',
      position: [1, 50],
      width: 1,
      height: 10,
      direction: 180,  // up
      velocity: 1,
    },
    playerB: {
      id: 'playerB',
      position: [99, 50],
      width: 1,
      height: 10,
      direction: 270,  // down
      velocity: 1
    },
    ball: {
      id: 'ball',
      position: [x, y],
      direction: 48, // Degrees
    }
  }
};


var Actions = {
  ChangeDirection: entity => direction => state => {
    // just pretend this is immutable...
    state.entities[entity].direction = direction;
    return state;
  },
  // Moves an entity in the direction it is headed
  MoveEntity: entity => state => {
    var entityState = state.entities[entity];
    entityState.position = move(entityState.position)(entityState.direction)(entityState.velocity);
  },
  MoveAllEntities: state => {
    state.entities = _.keys(state.entities).
      reduce((entityStates, name) => _.extend(entityStates, {
        [name]: Actions.MoveEntity(name)(state.entities[name])
      }), {});

    return state;
  },
  Bounce: entity => state => {
    state.entities[entity].direction = reflect(state.entities[entity].direction);
  },
  TogglePause: state => {
    state.isPaused = !state.isPaused;
    return state;
  }
}

function Intent({CanvasDriver, AnimationDriver}) {
  return {
    $changePlayerADirection: CanvasDriver.get('keypress').
      filter(() => evt.char === 'w' || evt.char === 's').
      map(evt => {
        return {
          up: 180,
          down: 270,
        }[evt.char];
      }),
    $changePlayerBDirection: CanvasDriver.get('keypress').
      filter(evt => evt.char === 'up' || evt.char === 'down').
      map(evt => {
        return {
          w: 180,
          s: 270,
        }[evt.char];
      }),
    $togglePause: CanvasDriver.get('keypress').
      filter(evt => evt.char === 'space').
      map(() => null),
    $tick: Rx.Observable.interval(100)
  }
}

function Model(intent) {
  var $state = Observable.
    merge(
      intent.$changePlayerADirection.map(Actions.ChangeDirection('playerA')),
      intent.$changePlayerBDirection.map(Actions.ChangeDirection('playerB')),
      intent.$togglePause.map(() => Actions.TogglePause),
      intent.$tick.map(() => Actions.MoveAllEntities)
    ).
    scan((state, action) => action(state), initialState);


  var $ballCollisions = $state.
    // flatMap, to remove empty values
    flatMap(state => {
      var ball = state.entities.ball;
      var collidableEntities = state.walls.concat(state.entities.playerA, state.entities.playerB);
      var collidedEntity = _.find(collidableEntities,
        // this will need to be changed to account for entity width/height
        entity => entity.position.x === ball.position.x && entity.position.y === ball.position.y);

      if (collidedEntity) {
        return Observable.from(collidedEntity);
      }
    });

  var $playerAGoals = $ballCollisions.filter(entity => entity.id === 'playerBGoal');
  var $playerBGoals = $ballCollisions.filter(entity => entity.id === 'playerAGoal');
  var $hardObjectCollisions = $ballCollisions.filter(entity => _.contains(['wallTop', 'wallBottom', 'playerA', 'playerB'], entity.id));

  return $state.
    combineLatest($ballCollisions, (state, collision) => {
      return Observable.merge(
        $playerAGoals.map(Actions.PointFor(state.entities.playerA)),
        $playerBGoals.map(Actions.PointFor(state.entities.playerB)),
        $hardObjectCollisions.map(Actions.Bounce(state.entities.ball))
      ).
        scan((state, actions) => actions(state), state);   // or something like that
    }).
    sample(intent.$tick);
}

var move = position => direction => velocity => {
  // TODO: math
  return newPosition;
}
var reflect = direction => {
  // TODO: math
  return reflectedDirection;
}