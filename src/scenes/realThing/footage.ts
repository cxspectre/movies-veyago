// footage.ts — the realThing's view of public/footage/manifest.json (CONTRACT 12.2: the manifest is the truth).
// beats.ts names footage by the bible's REQUESTED keys; the manifest records them as `requestedAs`, so a key resolves
// to an entry by its id or by its requestedAs. Nothing here re-types a file name.
import manifestJson from '../../../public/footage/manifest.json';

export type FootageEntry = {
  id: string;
  file: string;
  width: number;
  height: number;
  fps: number | null;
  durationSec: number | null;
  appearance: string;
  hotStart: number | null;
  hotEnd: number | null;
  requestedAs?: string;
};

/** A video entry: everything a cut needs to play it. */
export type FootageClip = FootageEntry & {fps: number; durationSec: number};

/** Clips that must never reach the film (CONTRACT 12.1: the ask-about-mom clip shows a real phone number). */
const BANNED_IDS: readonly string[] = ['ask-about-mom'];

const MANIFEST: readonly FootageEntry[] = manifestJson as readonly FootageEntry[];

const isVideo = (e: FootageEntry): e is FootageClip => e.fps !== null && e.durationSec !== null && e.file.endsWith('.mp4');

/** The manifest's video entry for a requested key (beats.ts `footage`) or a manifest id. Throws if none or banned. */
export const footageFor = (key: string): FootageClip => {
  const entry = MANIFEST.find((e) => e.id === key) ?? MANIFEST.find((e) => e.requestedAs === key);
  if (!entry) throw new Error(`realThing: no footage in manifest.json for "${key}"`);
  if (BANNED_IDS.includes(entry.id)) throw new Error(`realThing: footage "${entry.id}" must not be used (CONTRACT 12.1)`);
  if (!isVideo(entry)) throw new Error(`realThing: footage "${entry.id}" is not a video clip`);
  return entry;
};

/** Path under public/ for staticFile / the rigs' ScreenSource. */
export const footagePath = (clip: FootageEntry): string => `footage/${clip.file}`;
