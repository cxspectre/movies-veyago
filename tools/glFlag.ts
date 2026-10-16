// glFlag.ts — the Chromium OpenGL renderer choice for stills and renders.
// Order: --gl=<name> flag, then the FILM_GL environment variable, then 'angle'.
export const GL_RENDERERS = ['swangle', 'angle', 'egl', 'vulkan', 'default'] as const;
export type GlRenderer = (typeof GL_RENDERERS)[number];

export const DEFAULT_GL: GlRenderer = 'angle';

const isGl = (value: string): value is GlRenderer => (GL_RENDERERS as readonly string[]).includes(value);

/** What Chromium options accept: 'default' means "no override", which Remotion spells null. */
export type ChromiumGl = Exclude<GlRenderer, 'default'> | null;

/** Resolves the renderer from the CLI flags (`--gl=…`) and env; throws on an unknown name. */
export const resolveGl = (flags: readonly string[], env: NodeJS.ProcessEnv = process.env): ChromiumGl => {
  const fromFlag = flags.find((f) => f.startsWith('--gl='))?.slice('--gl='.length);
  const value = fromFlag ?? env.FILM_GL ?? DEFAULT_GL;
  if (!isGl(value)) {
    throw new Error(`Unknown GL renderer "${value}". Use one of: ${GL_RENDERERS.join(', ')}`);
  }
  return value === 'default' ? null : value;
};
