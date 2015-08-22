var state = {
  walls: [
    {position: [0, 0]},
    // ... probably want a factory for creating these
  ],
  entities: {
    isPaused: false,
    playerA: {
      position: [0, 50],
      direction: 180,  // up
      velocity: 1,
    },
    playerB: {
      position: [100, 50],
      direction: 270,  // down
      velocity: 1
    },
    ball: {
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
    $tick: AnimationDriver.animationFrame()
  }
}

function Model(intent) {
  var $state = Observable.
    startWith(initialState).
    merge(
      intent.$changePlayerADirection.map(Actions.ChangeDirection('playerA')),
      intent.$changePlayerBDirection.map(Actions.ChangeDirection('playerB')),
      intent.$togglePause.map(() => Actions.TogglePause),
      intent.$tick.map(() => Actions.MoveAllEntities)
    ).
    scan((state, action) => action(state));

  var $collisions = $state.
    // flatMap, to remove empty values
    flatMap(state => {
      var ball = state.entities.ball;
      var collidableEntities = state.walls.concat(state.entities.playerA, state.entities.playerB);
      var collidedEntity = _.find(collidableEntities,
        // this will need to be changed to account for entity width/height
        entity => entity.position.x === ball.position.x && entity.position.y === ball.position.y);

      if (collidedEntity) {
        return Observable.from(collidableEntities);
      }
    });

  return $state.
    combineLatest($collisions, (state, collision) => {
      return Actions.Bounce(state.entities.ball)(state);
    })
}

var move = position => direction => velocity => {
  // TODO: math
  return newPosition;
}
var reflect = direction => {
  // TODO: math
  return reflectedDirection;
}