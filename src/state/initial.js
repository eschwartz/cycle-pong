import {Point, Dimensions} from '../geometry/geometries.js';
import _ from 'lodash';

export default {
  isPaused: false,
  gameWidth: 800,
  gameHeight: 600,
  playerAPoints: 0,
  playerBPoints: 0,
  entities: {
    /*playerA: {
      id: 'playerA',
      position: Point(1, 50),
      dimensions: Dimensions(1, 3),
      direction: 0,  // up
      velocity: 1
    },
    playerB: {
      id: 'playerB',
      position: Point(19, 5),
      dimensions: Dimensions(1, 3),
      direction: 180,  // down
      velocity: 1
    },*/
    ball: {
      id: 'ball',
      //position: Point(_.random(100, 700), _.random(100, 500)),
      position: Point(795, 100),
      dimensions: Dimensions(10, 10),
      //velocity: {x: _.random(-1, 1, true), y: _.random(-1, 1, true)}
      velocity: Point(0.5, 0)
    }
  }
};

// velocity = [cos(angle) * speed, sin(angle) * speed]