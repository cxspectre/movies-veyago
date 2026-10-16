// textures.ts — the pre-rendered textures in public/tex (made by tools/makeTextures.ts) and their logical sizes.
// Texel density is 2 per logical px, i.e. one texel per device pixel at the 4K (--scale=2) render.
import {staticFile} from 'remotion';

export const TEXTURES = {
  /** Grayscale paper tooth (height): graphite catches on the white peaks first. Tileable. */
  tooth: {file: 'tex/paper-tooth.png', logical: 512},
  /** Warm off-white paper colour with fibre, mottle and tooth relief lit from the upper left. Tileable. */
  paper: {file: 'tex/paper-albedo.webp', logical: 1024},
  /** Pale, matte, white-oiled oak desktop; grain runs left-right. Tileable. */
  desk: {file: 'tex/desk-oak.webp', logical: 2048},
} as const;

export type TextureName = keyof typeof TEXTURES;

export const textureUrl = (name: TextureName): string => staticFile(TEXTURES[name].file);

const images = new Map<TextureName, Promise<HTMLImageElement>>();

/** Load (once per tab) a texture as a decoded image for canvas use. */
export const loadTexture = (name: TextureName): Promise<HTMLImageElement> => {
  const hit = images.get(name);
  if (hit) return hit;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img
        .decode()
        .then(() => resolve(img))
        .catch(() => resolve(img));
    };
    img.onerror = () => reject(new Error(`Paper engine: texture ${TEXTURES[name].file} failed to load`));
    img.src = textureUrl(name);
  });
  images.set(name, promise);
  return promise;
};
