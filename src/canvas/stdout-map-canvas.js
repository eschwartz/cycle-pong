import _ from 'lodash';
import createArray from '../util/create-array';

var MOVE_LEFT = new Buffer('1b5b3130303044', 'hex').toString();
var MOVE_UP = new Buffer('1b5b3141', 'hex').toString();
var CLEAR_LINE = new Buffer('1b5b304b', 'hex').toString();

class StdoutMapCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.map = this.createMap(this.width, this.height);
    this.sidebar = [];

    createArray(100).forEach(() => this.newLine());

    // Hide the cursor
    this.write('\x1B[?25l');

    this.redraw();
  }

  createMap(width, height) {
    return createArray(height).map(() => this.createRow(width));
  }

  createRow(width, fill = ' ') {
    return createArray(width).map(() => ({
      value: fill,
      zIndex: 0
    }));
  }

  setPoint(point, char, zIndex = 1) {
    var currentCell = this.map[point.y][point.x];

    if (point.x < 0 ||
      point.x > this.width - 1 ||
      point.y < 0 ||
      point.y > this.height - 1) {
      throw new Error('Invalid point: position is outside of canvas dimensions');
    }
    if (char.length !== 1) {
      throw new Error('Unable to draw point: character must be a single ascii character.');
    }


    this.map[point.y][point.x] = zIndex > currentCell.zIndex ? {
      value: char,
      zIndex: zIndex
    } : currentCell;
  }

  clearSidebar() {
    this.sidebar = [];
  }

  addSidebarContent(content) {
    this.sidebar.push(content);
  }

  constrainPoint(point) {
    return {
      x: Math.max(0, Math.min(point.x, this.width - 1)),
      y: Math.max(0, Math.min(point.y, this.height - 1))
    };
  }

  redraw() {
    this.clearCanvas();
    this.map.forEach((row, i) => {
      this.write(row.map(c => c.value).join('  '));
      if (i in this.sidebar) {
        this.write('    ' + this.sidebar[i]);
      }
      this.newLine();
    });
  }

  reset() {
    this.map = this.createMap(this.width, this.height);
  }

  clearCanvas() {
    this.map.forEach(row => {
      process.stdout.write(CLEAR_LINE);
      process.stdout.write(MOVE_UP);
    });
  }

  write(str) {
    process.stdout.write(str);
  }

  newLine() {
    this.write('\n');
  }

  restore() {
    // restore cursor
    this.write('\x1B[?25h');
  }
}

export default StdoutMapCanvas;