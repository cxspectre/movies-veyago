import type React from 'react';
import type {ModuleCues} from '../audio/cues';
import type {ModuleId} from '../film';
import type {PreviewSpec} from '../previewTypes';
import * as coldOpen from './coldOpen';
import * as desk from './desk';
import * as wall from './wall';
import * as transition from './transition';
import * as familyOfDevices from './familyOfDevices';
import * as title from './title';
import * as realThing from './realThing';
import * as pair from './pair';
import * as backToDesk from './backToDesk';
import * as endCard from './endCard';

/** What a scene folder exports: the component, the module's COMPLETE foley cue list (module-local seconds), previews. */
export type SceneModule = {
  Scene: React.FC;
  cues?: ModuleCues;
  previews?: readonly PreviewSpec[];
};

export const SCENES: Record<ModuleId, SceneModule> = {
  coldOpen,
  desk,
  wall,
  transition,
  familyOfDevices,
  title,
  realThing,
  pair,
  backToDesk,
  endCard,
};
