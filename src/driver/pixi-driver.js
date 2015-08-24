import PIXI from 'pixi.js';
import {Observable} from 'rx';
import _ from 'lodash';
import jsondiffpatch from 'jsondiffpatch';

function makePixiDriver(el, width, height) {
  var renderer = PIXI.autoDetectRenderer(width, height);
  var stage = new PIXI.Container();
  // Store of Pixi graphics, by id
  var views = {};

  stage.interactive = true;

  el.appendChild(renderer.view);

  function pixiDriver($view) {

    $view.
      forEach(view => {
        view.graphics.forEach(graphic => {
          if (!views[graphic.id]) {
            views[graphic.id] = new PIXI.Graphics();
            stage.addChild(views[graphic.id]);
          }
          else {
            views[graphic.id].clear();
          }
          let circle = views[graphic.id];

          circle.lineStyle(0);
          circle.beginFill(graphic.fill, graphic.alpha);
          circle.drawCircle(
            Math.round(graphic.x),
            Math.round(graphic.y),
            Math.round(graphic.radius)
          );
          circle.endFill();

        });

        renderer.render(stage);
      })
  }


  return pixiDriver;
}

export default makePixiDriver;