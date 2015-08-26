import {Observable} from 'rx';
import {Scheduler} from 'rx-dom';

var fps = 60;
export default Observable.interval(1000 / fps, Scheduler.requestAnimationFrame);
