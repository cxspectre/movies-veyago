import type React from 'react';
import type {ModuleCues} from '../audio/cues';
import type {PreviewSpec} from '../previewTypes';
import type {SketchProps, SketchSpec} from '../paper/types';

import * as v1Home from './v1-home';
import * as familyTabs from './family-tabs';
import * as watchWallet from './watch-wallet';
import * as pillBottle from './pill-bottle';
import * as shareCard from './share-card';
import * as scamLetter from './scam-letter';
import * as passport from './passport';
import * as sharedCosts from './shared-costs';
import * as whereIsIt from './where-is-it';
import * as visitRecording from './visit-recording';
import * as europeMap from './europe-map';
import * as speechBubbles from './speech-bubbles';
import * as formToChat from './form-to-chat';
import * as binderHomeV2 from './binder-home-v2';

export type SketchId =
  | 'v1-home'
  | 'family-tabs'
  | 'watch-wallet'
  | 'pill-bottle'
  | 'share-card'
  | 'scam-letter'
  | 'passport'
  | 'shared-costs'
  | 'where-is-it'
  | 'visit-recording'
  | 'europe-map'
  | 'speech-bubbles'
  | 'form-to-chat'
  | 'binder-home-v2';

export const SKETCH_IDS: readonly SketchId[] = ['v1-home', 'family-tabs', 'watch-wallet', 'pill-bottle', 'share-card', 'scam-letter', 'passport', 'shared-costs', 'where-is-it', 'visit-recording', 'europe-map', 'speech-bubbles', 'form-to-chat', 'binder-home-v2', ];

/** What a sketch folder exports: the component, plus its data and sound for reuse. */
export type SketchModule = {
  Sketch: React.FC<SketchProps>;
  spec?: SketchSpec;
  cues?: (drawFrames: number) => ModuleCues;
  previews?: readonly PreviewSpec[];
};

export const SKETCHES: Record<SketchId, SketchModule> = {
  'v1-home': v1Home,
  'family-tabs': familyTabs,
  'watch-wallet': watchWallet,
  'pill-bottle': pillBottle,
  'share-card': shareCard,
  'scam-letter': scamLetter,
  'passport': passport,
  'shared-costs': sharedCosts,
  'where-is-it': whereIsIt,
  'visit-recording': visitRecording,
  'europe-map': europeMap,
  'speech-bubbles': speechBubbles,
  'form-to-chat': formToChat,
  'binder-home-v2': binderHomeV2,
};
