// index.ts — the pop-up paper component's public API. Import from 'src/popup'.
export {PopUp, type PopUpProps} from './PopUp';
export {angleAt, evaluate, foldKeys, type PanelState} from './fold';
export {faceOverlay, shadowShapes, toLamp} from './light';
export * from './types';
export {Box, Drawing, Hatch, Ink, Line, Ring, Scribble, Window} from './art';
export {houseSpec, HouseArt, MAYAS_HOUSE, villageHouse, type HouseData} from './presets/house';
export {crumpleSpec, CRUMPLE_LETTER, EngineArt, LetterArt, type CrumpleData} from './presets/crumple';
export {FILTER_MACHINE, MachineArt, machineSpec, type MachineData} from './presets/machine';
export {ROCKET, RocketArt, rocketSpec, type RocketData} from './presets/rocket';
