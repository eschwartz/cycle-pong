import PIXI from 'pixi.js';
import {Observable} from 'rx';
import _ from 'lodash';
import jsondiffpatch from 'jsondiffpatch';

function makePixiDriver(el, width, height) {
  var renderer = PIXI.autoDetectRenderer(width, height);
  var stage = new PIXI.Container();


  stage.interactive = true;

  el.appendChild(renderer.view);

  function pixiDriver($view) {
    // Store of Pixi graphics
    var graphics = {};
    var diffPatch = jsondiffpatch.create({
      objectHash: obj => obj.id
    });

    var $diffs = $view.
      scan({
        view: {graphics: []},
        diff: {}
      }, (prev, current) => ({
        view: current,
        diff: diffPatch.diff(prev.view, current)
      }));

    $diffs.forEach(diff => console.log(JSON.stringify(diff, null, 2)));

    $diffs.forEach(({view, diff}) => {
      var graphicDiffs = _.omit(diff.graphics, '_t');  // _t is a "magic index" for jsondiffpatch
      _.each(graphicDiffs, (diff, index) => {
          var isNewGraphic = _.isArray(diff);

          if (isNewGraphic) {
            let graphic = diff[0];
            graphics[graphic.id] = createCircle(graphic);
            stage.addChild(graphics[graphic.id]);
          }
          else {
            _.each(diff, ([oldVal, newVal], prop) => {
              var graphicId = view.graphics[index].id;
              var circle = graphics[graphicId];
              updateCircle(circle)(prop)(newVal);
            })
          }
        });

      renderer.render(stage);
    });

    $view.
      forEach(view => {
        /*view.graphics.forEach(graphic => {
         var circle = new PIXI.Graphics();
         circle.lineStyle(0);
         circle.beginFill(graphic.fill, graphic.alpha);
         circle.drawCircle(graphic.x, graphic.y, graphic.radius);
         circle.endFill();

         stage.addChild(circle);
         });

         renderer.render(stage);*/
      })
  }


  return pixiDriver;
}

function createCircle(graphic) {
  var circle = new PIXI.Graphics();
  circle.lineStyle(0);
  circle.beginFill(graphic.fill, graphic.alpha);
  circle.drawCircle(graphic.x, graphic.y, graphic.radius);
  circle.moveTo(graphic.x, graphic.y);
  circle.endFill();

  return circle;
}

function updateCircle(circle) {
  return prop => ({
    x: val => {
      circle.clear();
      circle.moveTo(val, circle.position.y)
    },
    y: val => circle.moveTo(circle.position.x, val)
  }[prop])
}

export default makePixiDriver;