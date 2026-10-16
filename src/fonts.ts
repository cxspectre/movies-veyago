import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

// Veyago house style: DM Sans for supers, Cambria for the closing line (Caladea is the
// metric-compatible open stand-in; drop a licensed Cambria into public/fonts to swap it).
// Hand-lettering faces carry the margin notes and sticky notes.
const FACES = [
  {family: 'DM Sans', file: 'dm-sans-latin-400-normal.woff2', weight: '400'},
  {family: 'DM Sans', file: 'dm-sans-latin-500-normal.woff2', weight: '500'},
  {family: 'DM Sans', file: 'dm-sans-latin-700-normal.woff2', weight: '700'},
  {family: 'Caladea', file: 'caladea-latin-400-normal.woff2', weight: '400'},
  {family: 'Caladea', file: 'caladea-latin-400-italic.woff2', weight: '400', style: 'italic'},
  {family: 'Caladea', file: 'caladea-latin-700-normal.woff2', weight: '700'},
  {family: 'Caveat', file: 'caveat-latin-500-normal.woff2', weight: '500'},
  {family: 'Caveat', file: 'caveat-latin-700-normal.woff2', weight: '700'},
  {family: 'Reenie Beanie', file: 'reenie-beanie-latin-400-normal.woff2', weight: '400'},
  {family: 'Kalam', file: 'kalam-latin-400-normal.woff2', weight: '400'},
  {family: 'Kalam', file: 'kalam-latin-700-normal.woff2', weight: '700'},
  {family: 'Patrick Hand', file: 'patrick-hand-latin-400-normal.woff2', weight: '400'},
] as const;

export const loadFilmFonts = (): Promise<void[]> =>
  Promise.all(
    FACES.map((f) =>
      loadFont({
        family: f.family,
        url: staticFile(`fonts/${f.file}`),
        weight: f.weight,
        style: 'style' in f ? f.style : 'normal',
      }),
    ),
  );
