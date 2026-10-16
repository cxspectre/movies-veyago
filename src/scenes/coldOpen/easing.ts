// easing.ts — beats.ts easing names as Remotion easing functions.
import {Easing} from 'remotion';
import {EASING, type EasingName} from '../../beats';

export const easingOf = (name: EasingName): ((t: number) => number) => {
  const [a, b, c, d] = EASING[name];
  return Easing.bezier(a, b, c, d);
};
