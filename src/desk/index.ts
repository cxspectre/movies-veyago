// index.ts — the desk kit's public API (hands and props). Import from 'src/desk'.

// Palette, lamp and the bible's shadow table
export {blurDeviation, boxShadowOf, DESK_LAMP, DESK_LAMP_WARM, DESK_PALETTE, dropShadowOf, liftedShadow, REACH_PER_PX, SHADOW_DIR, SHADOWS, shadowRgba, SKETCH_PX_PER_MM, type ShadowClass, type ShadowEntry, type ShadowLift} from './palette';

// Layouts (BIBLE §2.10) and the stage
export {DESK_LAYOUT, DESK_PROP_IDS, finishedPagePlacement, rulerPxPerMm, type DeskLayout, type DeskPoint, type DeskPropId, type FinishedPagesSlot, type PropSlot, type RulerSlot, type SheetSlot, type StackSlot} from './layout';
export {DeskStage, SheetAt, type DeskCamera, type DeskStageProps} from './DeskStage';

// Props
export {Placed, PropSvg, type PlacedProps} from './props/Placed';
export {Pencil, PencilBody, PENCIL_END_COLOURS, type PencilProps, type PencilShadowMode} from './props/Pencil';
export {PENCIL_GEOMETRY, pencilArt, type PencilArt, type PencilGeometry, type PencilKind} from './props/pencilArt';
export {PencilCup, type PencilCupProps} from './props/PencilCup';
export {CoffeeCup, cupSetDownState, type CoffeeCupProps, type CupSetDownState} from './props/CoffeeCup';
export {Eraser, FaceDownPhone, StickyPad} from './props/SmallProps';
export {Ruler, type RulerProps} from './props/Ruler';
export {BlankSheetStack, type BlankSheetStackProps} from './props/BlankSheetStack';

// Hands
export {HANDS_MODE, type HandsMode} from './hands/mode';
export {Hand, PAIR_SIZE, resolvePose, type HandPair, type HandProps} from './hands/Hand';
export {PencilHand, pencilSeamMm, type PencilHandProps} from './hands/PencilHand';
export {followPencil, handRotationForYaw, staticRig, type FollowOptions, type PencilRig} from './hands/follow';
export {HandDrawing, handAnchorPx, handDirectionPx, type HandDrawingProps, type Handedness, type HandPlacement} from './hands/HandDrawing';
export {CUP_HOLD, CUP_MUG_RADIUS_MM, cupGripAnchor, cupHandleAngle, digit, digitFrom, flatPose, GRIP, LOWER, MCP, POINT, POSES, REACH, REST, SEGMENTS, WIDTHS, type DigitName, type DigitPose, type HandPose, type PoseName, type WebSpec} from './hands/poses';
export {edgeDirection, inFrame, presenceAt, presenceOffset, type FrameEdge, type PresenceSpec} from './hands/presence';
export {type Pt} from './hands/geometry';
