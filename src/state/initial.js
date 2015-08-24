import {Point, Dimensions} from '../geometry/geometries.js';
import _ from 'lodash';

export default {
  isPaused: false,
  entities: {
    /*wallTop: {
      id: 'wallTop',
      position: Point(0, 0),     // position is location of top-left corder
      dimensions: Dimensions(20, 1)
    },
    wallBottom: {
      id: 'wallBottom',
      position: Point(0, 20),
      dimensions: Dimensions(20, 1)
    },
    goalPlayerA: {
      id: 'goalPlayerA',
      position: Point(0, 1),
      dimensions: Dimensions(1, 18)
    },
    goalPlayerB: {
      id: 'goalPlayerB',
      position: Point(20, 1),
      dimensions: Dimensions(1, 18),
      width: 1,
      height: 20
    },
    playerA: {
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
      position: Point(_.random(100, 700), _.random(100, 500)),
      direction: _.random(0, 359), // Degrees, where `0` is moving right
      dimensions: Dimensions(10, 10),
      velocity: {x: _.random(-1, 1, true), y: _.random(-1, 1, true)}
    }
  }
};

