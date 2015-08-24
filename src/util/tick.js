import {Observable} from 'rx';
import {Scheduler} from 'rx-dom';

export default Observable.interval(1 / 30, Scheduler.requestAnimationFrame);
