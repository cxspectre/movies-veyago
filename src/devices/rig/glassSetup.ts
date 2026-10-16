import type {RoundedRect} from '../../glass/edgeLightPath';
import type {GlassUniforms} from '../materials/deviceMaterials';

export type ScreenGeometry = {width: number; height: number; radius: number; centreY: number};

/** Points a glass material at its body: the glass outline (the body inset by its front edge) and the screen rect. */
export const setupGlass = (u: GlassUniforms, outline: RoundedRect, frontEdge: number, screen: ScreenGeometry): GlassUniforms => {
  u.uOutline.value.set(outline.width / 2 - frontEdge, outline.height / 2 - frontEdge);
  u.uOutlineRadius.value = Math.max(0, outline.radius - frontEdge);
  u.uScreen.value.set(0, screen.centreY, screen.width / 2, screen.height / 2);
  u.uScreenRadius.value = screen.radius;
  u.uScreenAspect.value = screen.width / screen.height;
  return u;
};
