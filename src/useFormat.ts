import {useVideoConfig} from 'remotion';
import type {FormatName} from './film';

/** Which canvas the scene is rendering into. Scenes lay themselves out from this; never hard-code 1920x1080. */
export const useFormat = (): {format: FormatName; isTall: boolean; width: number; height: number} => {
  const {width, height} = useVideoConfig();
  const isTall = height > width;
  return {format: isTall ? 'tall' : 'wide', isTall, width, height};
};
