import {Point, Dimensions} from '../geometry/geometries.js';
import _ from 'lodash';


var gameWidth = 800;
var gameHeight = 600;

export default {
  isPaused: false,
  gameWidth: gameWidth,
  gameHeight: gameHeight,
  playerAPoints: 0,
  playerBPoints: 0,
  entities: {
    playerA: {
      id: 'playerA',
      position: Point(20, gameHeight / 2),
      dimensions: Dimensions(10, 60),
      velocity: Point(0, 0)
    },
    playerB: {
      id: 'playerB',
      position: Point(gameWidth - 20, gameHeight / 2),
      dimensions: Dimensions(10, 60),
      velocity: Point(0, 0)
    },
    ball: {
      id: 'ball',
      position: Point(795, 100),
      dimensions: Dimensions(10, 10),
      velocity: Point(0.5, 0)
    },/*
    wallTop: {
      position: Point(1, 0),
      dimensions: Dimensions(gameWidth - 2, 1)
    },
    wallBottom: {
      position: Point(1, gameHeight),
      dimensions: Dimensions(gameWidth - 1, 1)
    },
    wallLeft: {
      position: Point(0, 0),
      dimensions: Dimensions(1, gameHeight)
    },
    wallRight: {
      position: Point(gameWidth, 0),
      dimensions: Dimensions(1, gameHeight)
    }*/
  }
};

// velocity = [cos(angle) * speed, sin(angle) * speed]