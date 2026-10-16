// desk — module 0:35-1:20 (shots 5-9). Public API for the integrator, the sound department and the wall module.
export {Scene} from './Scene';
export {cues} from './cues';
export {cameraAt, deskEndCamera, wideCamera, workCamera} from './camera';
export {sheetsAt, stackPose, workPose, type SheetPose, type SheetState} from './sheets';
export {handAAt, pageRig, type HandAState} from './pencilA';
export {handBAt, type HandBState} from './handB';
export {V1_NOTE} from './V1Sheet';
export {DESK_END, type DeskEndState} from './end';
