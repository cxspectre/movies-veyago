// Scene.tsx — the wall (1:20-1:31, shots 10-11): both pairs of hands lay the finished pages and the redesign into a
// 15-slot grid, two sheets per half-second, the phone face down last; the camera rises over the whole grid, then
// pushes into the centre tile while pair A draws the chips, and stops on the transition's opening framing.
// Performance: every tile is an image; only the centre sheet runs the pencil engine (CONTRACT §12.6).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {DESK_LAMP, DeskStage, type DeskPropId} from '../../desk';
import {FPS, type FormatName} from '../../film';
import {useFormat} from '../../useFormat';
import {wallCamera} from './camera';
import {CentreSheet, CentreSheetHand, engineZoom} from './CentreSheet';
import {dropPlan, type DropPlan} from './drops';
import {sheetFlight, type SheetFlight} from './flight';
import {TILE_CURL, tileScale, wallPxPerMm} from './grid';
import {LayingHands} from './LayingHands';
import {PhoneOnDesk, StaticTile} from './SheetOnDesk';
import {WallFlatProps, WallTallProps} from './WallDeskProps';

/** The stage's own props are laid out for the work area; the wall draws its own, off the grid. */
const NO_STAGE_PROPS: Partial<Record<DeskPropId, boolean>> = {pencilCup: false, coffeeCup: false, eraser: false, ruler: false, stickyPad: false, phone: false, blankStack: false};

type Laid = {readonly drop: DropPlan; readonly flight: SheetFlight};

const LaidItem: React.FC<{readonly format: FormatName; readonly item: Laid; readonly zoom: number; readonly frame: number}> = ({format, item, zoom, frame}) => {
  const {drop, flight} = item;
  if (drop.tile === 'phone') return <PhoneOnDesk centre={flight.centre} rotation={flight.rotation} pxPerMm={wallPxPerMm(format)} height={flight.height} />;
  if (drop.tile === 'binder-home-v2') return <CentreSheet format={format} flight={flight} zoom={zoom} frame={frame} />;
  return <StaticTile tile={drop.tile} centre={flight.centre} rotation={flight.rotation} scale={tileScale(format)} height={flight.height} curl={TILE_CURL[drop.tile] ?? 0} lamp={DESK_LAMP} />;
};

export const WallStage: React.FC<{readonly format: FormatName; readonly frame: number}> = ({format, frame}) => {
  const t = frame / FPS;
  const cam = wallCamera(format, t);
  const zoom = engineZoom(format, cam);
  const drops = dropPlan(format);
  const items = drops.map((drop) => ({drop, flight: sheetFlight(format, drop, t)})).filter((i) => i.flight.visible);
  const landed = items.filter((i) => i.flight.landed);
  // Sheets still in the air are drawn over the landed ones, the latest on top.
  const carried = items.filter((i) => !i.flight.landed);
  return (
    <DeskStage
      format={format}
      camera={cam}
      show={NO_STAGE_PROPS}
      above={
        <>
          {carried.map((i) => (
            <LaidItem key={i.drop.tile} format={format} item={i} zoom={zoom} frame={frame} />
          ))}
          <LayingHands format={format} drops={drops} t={t} />
          <CentreSheetHand format={format} frame={frame} />
        </>
      }
    >
      <WallFlatProps format={format} />
      {landed.map((i) => (
        <LaidItem key={i.drop.tile} format={format} item={i} zoom={zoom} frame={frame} />
      ))}
      <WallTallProps format={format} />
    </DeskStage>
  );
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  return <WallStage format={format} frame={frame} />;
};
