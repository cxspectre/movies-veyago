// footage.ts — screen sources for <ScreenOnPaper>, read from public/footage/manifest.json and
// public/footage4/manifest4.json (CONTRACT 12.2: the manifests are the truth; nothing here re-types a file name or a size).
import manifestJson from '../../public/footage/manifest.json';
import manifest4Json from '../../public/footage4/manifest4.json';

type Entry = {
  id: string;
  file: string;
  poster?: string;
  width: number;
  height: number;
  fps?: number | null;
  durationSec?: number | null;
  hotStart?: number | null;
  hotEnd?: number | null;
};

/** What a screen shows: a clip (decoded only when near; its poster otherwise) or a still. Paths are under public/. */
export type ScreenSource =
  | {readonly kind: 'video'; readonly id: string; readonly src: string; readonly poster: string; readonly width: number; readonly height: number; readonly hotStart: number; readonly hotEnd: number | null}
  | {readonly kind: 'still'; readonly id: string; readonly src: string; readonly width: number; readonly height: number};

/** Clips that must never reach the film (CONTRACT 12.1: the ask-about-mom clip shows a real phone number). */
const BANNED_IDS: readonly string[] = ['ask-about-mom'];

const ENTRIES: readonly {dir: string; e: Entry}[] = [
  ...(manifestJson as readonly Entry[]).map((e) => ({dir: 'footage', e})),
  ...((manifest4Json as {clips: readonly Entry[]}).clips ?? []).map((e) => ({dir: 'footage4', e})),
];

const find = (id: string): {dir: string; e: Entry} => {
  if (BANNED_IDS.includes(id)) throw new Error(`kit: footage "${id}" must not be used (CONTRACT 12.1)`);
  const hit = ENTRIES.find((x) => x.e.id === id);
  if (!hit) throw new Error(`kit: no footage "${id}" in manifest.json or manifest4.json`);
  return hit;
};

/** A manifest clip by id: plays from its hot window when near, its poster otherwise. */
export const footageClip = (id: string): ScreenSource => {
  const {dir, e} = find(id);
  if (!e.file.endsWith('.mp4')) throw new Error(`kit: footage "${id}" is not a video; use footageStill`);
  return {
    kind: 'video',
    id,
    src: `${dir}/${e.file}`,
    poster: `${dir}/${e.poster ?? e.file.replace(/\.mp4$/, '.png')}`,
    width: e.width,
    height: e.height,
    hotStart: e.hotStart ?? 0,
    hotEnd: e.hotEnd ?? null,
  };
};

/** A manifest entry's poster (or a still entry's image) as a still screen. */
export const footageStill = (id: string): ScreenSource => {
  const {dir, e} = find(id);
  const file = e.file.endsWith('.mp4') ? (e.poster ?? e.file.replace(/\.mp4$/, '.png')) : e.file;
  return {kind: 'still', id, src: `${dir}/${file}`, width: e.width, height: e.height};
};

/** Any image under public/ (a drawn-and-exported screen, a capture the manifest does not list yet). */
export const stillSource = (src: string, width: number, height: number): ScreenSource => ({kind: 'still', id: src, src, width, height});
