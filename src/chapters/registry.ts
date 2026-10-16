import type React from 'react';
import type {ChapterId} from '../film4';
import {Chapter as line} from './line';
import {Chapter as mayasHouse} from './mayasHouse';
import {Chapter as theNo} from './theNo';
import {Chapter as filterMachine} from './filterMachine';
import {Chapter as researchBoard} from './researchBoard';
import {Chapter as nameAndLook} from './nameAndLook';
import {Chapter as engineRoom} from './engineRoom';
import {Chapter as launch} from './launch';
import {Chapter as village} from './village';
import {Chapter as paperToGlass} from './paperToGlass';
import {Chapter as providedFor} from './providedFor';

/** Chapter bodies by id. Chapter owners replace their folder's `Chapter`; this file only wires them. */
export const CHAPTERS: Record<ChapterId, React.FC> = {
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
