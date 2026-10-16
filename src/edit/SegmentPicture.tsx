// SegmentPicture.tsx — the picture of one EDL segment: its module's scene trimmed to [from, to] with a negative
// <Sequence from>, so inside the scene `useCurrentFrame()` is the module-local frame. A scene folder may export an
// optional `EditableScene` (EditableSceneProps); the player prefers it and falls back to the plain `Scene`.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import type {Edl} from '../edits';
import {COLORS, type FormatName} from '../film';
import {SCENES, type SceneModule} from '../scenes/registry';
import type {EditableScene, EditableSceneProps, PlacedSegment} from './types';

const isComponent = (value: unknown): boolean =>
  typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);

/** The scene module's `EditableScene` export, if it has one (module namespaces carry every export at runtime). */
export const editableSceneOf = (mod: SceneModule): EditableScene | undefined => {
  const candidate: unknown = (mod as SceneModule & {EditableScene?: unknown}).EditableScene;
  return isComponent(candidate) ? (candidate as EditableScene) : undefined;
};

type Props = {placed: PlacedSegment; edlId: Edl['id']; format: FormatName; captioned: boolean};

export const SegmentPicture: React.FC<Props> = ({placed, edlId, format, captioned}) => {
  if (placed.black) return <AbsoluteFill style={{background: COLORS.void}} />;
  const mod = SCENES[placed.module];
  const Editable = editableSceneOf(mod);
  const {segment} = placed;
  const editProps: EditableSceneProps = {
    edlId,
    format,
    segmentIndex: placed.index,
    from: segment.from,
    to: segment.to,
    props: segment.props,
    captioned,
  };
  return (
    <Sequence from={-placed.moduleFromFrame} name={`${placed.module} ${segment.from}-${segment.to}s`}>
      {Editable ? <Editable {...editProps} /> : <mod.Scene />}
    </Sequence>
  );
};
