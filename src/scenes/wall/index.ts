// The wall (1:20-1:31): see Scene.tsx. Public API for the transition and backToDesk below.
export {Scene, WallStage} from './Scene';
export {cues} from './cues';
export {previews} from './previews';
export {deskToFrame, phoneOutlineCentre, riseTopCamera, visibleDeskRect, wallCamera, wallEndFraming} from './camera';
export {centreSlot, gridBounds, gridCentre, PROP_MM, slotOfTile, TILE_CURL, TILE_ROTATION, tileScale, tileSize, WALL_PROPS, wallPxPerMm, wallSlots, type WallSlot} from './grid';
export {dropOf, dropPlan, validateDrops, type DropPlan} from './drops';
export {PhoneOnDesk, pageImage, SheetOnDesk, StaticTile} from './SheetOnDesk';
export {WallFlatProps, WallTallProps} from './WallDeskProps';
export {type ArmReach, exitFromDown, KIT_FOREARM_MM, reachMm} from './armReach';
export {ReachingHand} from './ReachingArm';
export {ReachingPencilHand} from './ReachingPencilHand';
