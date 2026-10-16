import type React from 'react';
import type {ModuleCues} from '../audio/cues';
import type {ChapterId} from '../film4';
import type {PreviewSpec} from '../previewTypes';
import * as line from './line';
import * as mayasHouse from './mayasHouse';
import * as theNo from './theNo';
import * as filterMachine from './filterMachine';
import * as researchBoard from './researchBoard';
import * as nameAndLook from './nameAndLook';
import * as engineRoom from './engineRoom';
import * as launch from './launch';
import * as village from './village';
import * as paperToGlass from './paperToGlass';
import * as providedFor from './providedFor';

/** What a chapter folder exports: the component, its COMPLETE foley cue list (module-local seconds) and extra previews. */
export type ChapterModule = {
  Chapter: React.FC;
  cues?: ModuleCues;
  previews?: readonly PreviewSpec[];
};

/** Chapter modules by id. Chapter owners replace their own folder only; this file just wires them. */
export const CHAPTER_MODULES: Record<ChapterId, ChapterModule> = {
  line,
  mayasHouse,
  theNo,
  filterMachine,
  researchBoard,
  nameAndLook,
  engineRoom,
  launch,
  village,
  paperToGlass,
  providedFor,
};

/** Chapter bodies by id. */
export const CHAPTERS = Object.fromEntries(
  Object.entries(CHAPTER_MODULES).map(([id, module]) => [id, module.Chapter]),
) as Record<ChapterId, React.FC>;
