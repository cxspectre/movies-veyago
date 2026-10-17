// Chapter.tsx — chapter 10, "Paper to glass" (8:10-9:30, local 0-80; BIBLE4 §5.10, script §10). The one WebGL chapter and
// the one with a parked camera: the void is screen space, so everything lives in the Overlay. The village turns to light
// and lifts, folds into one phone; nine snaps; the row of five; the card flips to the Watch and the pass slides out; four
// number rolls on black; eight recordings; Maya's invitation; the hard stop; the title. Art is empty (the paper beneath is
// chapter 9's finished village, which the black veil takes away).
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {GLASS_SNAPS, RECORDINGS, SUPERS, paperToGlass as P} from '../../beats4';
import {cameraDistance, CardFlip, cardFromPhone, cardToWatch, DeviceStage, flightCardSize, Phone3D, WalletPass3D, Watch3D, type ScreenSource, type StageInfo} from '../../devices';
import {COLORS, FONTS, FPS, sec, type FormatName} from '../../film';
import {ease, rgba, windowProgress} from '../../glass';
import {ChapterShell, NumberRoll, Super, superFromBeat, useChapter} from '../../kit';
import {DockStarPatch} from '../../scenes/familyOfDevices/DockStarPatch';
import {cardLanded, dockStarAlpha, passBodyOpacity, passLight, passPose, passProgress, phoneLight, phonePose, watchBodyOpacity, watchLight, watchPose} from '../../scenes/familyOfDevices/layout';
import {BINDER_HOME_STILL, homeScreenSource, useHomeStill} from '../../scenes/transition/homeScreen';
import {MayaInLight, NotificationCard, PaperPlane} from './Invite';
import {
  BINDERS,
  INVITE,
  REST_LIGHT,
  REC_PHONE_HEIGHT,
  REC_PHONE_Y,
  basePlacement,
  binderScreen,
  cloneOpacity,
  devicesFade,
  familyT,
  fovAt,
  glowAt,
  mainBodyOpacity,
  mainLight,
  mainRotation,
  recordingAt,
  recordingPose,
  recordingScreen,
  rowSlot,
  rowSpread,
  snapIndexAt,
  snapScreen,
  SCREEN_SWAPS,
  clipScreen,
  type Size,
} from './motion';
import {TitleLayer} from './title/Scene';
import {VillageLight} from './VillageLight';

const GLASS_WHITE = COLORS.glassWhite;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const KIT_VIDEO_HOLD = 0.0;

export const WATCH_SCREEN = 'footage/watch-card-still.png';

/** The label under the phone: DM Sans 500 36 px glassWhite 92%, 48 px under the phone (BIBLE4 §5.10). */
const Label: React.FC<{text: string; centreX: number; top: number; opacity: number}> = ({text, centreX, top, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: centreX - 700,
      width: 1400,
      top,
      textAlign: 'center',
      fontFamily: FONTS.super,
      fontWeight: 500,
      fontSize: 36,
      lineHeight: '44px',
      color: rgba(GLASS_WHITE, 0.92 * opacity),
      opacity: 1,
    }}
  >
    {text}
  </div>
);

const labelOpacity = (t: number, from: number, to: number): number => clamp01((t - from) / 0.3) * (1 - clamp01((t - (to - 0.2)) / 0.2));

// The recordings that bleed: the footage fills the frame (cover x 1.06, focus centred).
const BLEED_FOCUS: Record<string, {wide: number; tall: number}> = {};
const bleedBox = (id: string, format: FormatName, size: Size): {left: number; top: number; width: number; height: number} => {
  const cover = Math.max(size.width / 1206, size.height / 2622) * 1.06;
  const width = 1206 * cover;
  const height = 2622 * cover;
  const fy = BLEED_FOCUS[id]?.[format] ?? 0.5;
  return {width, height, left: (size.width - width) / 2, top: Math.min(0, Math.max(size.height - height, size.height / 2 - fy * height))};
};

const BleedCut: React.FC<{footage: string; start: number; focusKey: string; format: FormatName; size: Size}> = ({footage, start, focusKey, format, size}) => {
  const clip = clipScreen(footage, start);
  if (clip.kind !== 'video') return null;
  const box = bleedBox(focusKey, format, size);
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.void, overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile(clip.src)} trimBefore={Math.round(((clip.startAt ?? 0) + start) * FPS)} muted style={{position: 'absolute', ...box, maxWidth: 'none'}} />
    </AbsoluteFill>
  );
};

type Pose = {placement: ReturnType<typeof basePlacement>; rotation: {x?: number; y?: number; z?: number}};

const Devices: React.FC<{t: number; format: FormatName; size: Size; still: HTMLCanvasElement | null}> = ({t, format, size, still}) => {
  const fov = fovAt(t);
  const base = basePlacement(format, size);
  const rot = mainRotation(t);
  const row = rowSpread(t);
  const fade = devicesFade(t);
  const homeActive = t >= SCREEN_SWAPS.home && !!still;

  // Which picture the main phone wears
  let mainScreen: ScreenSource = {kind: 'none'};
  if (homeActive) mainScreen = homeScreenSource(still as HTMLCanvasElement);
  else if (t >= P.split.from) mainScreen = binderScreen(BINDERS[2]);
  else if (t >= GLASS_SNAPS[0]!.t) mainScreen = snapScreen(Math.max(0, snapIndexAt(t)));

  const stage: StageInfo = {width: size.width, height: size.height, fov: P.perspective.fovTo, distance: cameraDistance(P.perspective.fovTo, size.height)};
  const inFamily = t >= P.family.hit && t < P.devicesOut.to;
  const lt = familyT(t);

  // 8.0-36.0: the phone (and, 25.0-36.0, the row of five)
  if (t < P.family.hit) {
    const main = rowSlot(format, size, 2, row, base, rot);
    const rest = t >= P.edgeLight.settle.to;
    const light = rest && t >= P.split.from ? {...REST_LIGHT, intensity: mainLight(t).intensity} : mainLight(t);
    const clones = [0, 1, 3, 4];
    return (
      <DeviceStage fov={fov}>
        {row > 0.001
          ? clones.map((i) => {
              const slot = rowSlot(format, size, i, row, base, rot);
              return (
                <Phone3D
                  key={i}
                  placement={{...slot.placement, z: -30 * (1 - row)}}
                  rotation={slot.rotation}
                  edgeLight={{...REST_LIGHT, intensity: cloneOpacity(row)}}
                  opacity={cloneOpacity(row)}
                  screen={binderScreen(BINDERS[i]!)}
                />
              );
            })
          : null}
        <Phone3D placement={main.placement} rotation={main.rotation} edgeLight={light} opacity={mainBodyOpacity(t)} screen={mainScreen} island={false} />
      </DeviceStage>
    );
  }

  // 36.0-42.0: the card flips to the Watch and the pass slides out (v1 layout, on t - 36.0)
  if (inFamily) {
    const phone = phonePose(lt, format, size);
    const watch = watchPose(lt, format, size);
    const glow = glowAt(t) * fade;
    const passK = passProgress(lt);
    const flightPhone = phonePose(0, format, size);
    const flight = {from: cardFromPhone(flightPhone, stage), to: cardToWatch(watch, stage), card: flightCardSize(flightPhone.placement.height)};
    const watchScreen: ScreenSource = cardLanded(lt) ? {kind: 'image', src: WATCH_SCREEN} : {kind: 'none'};
    const star = dockStarAlpha(lt);
    const overlay = star > 0 && fade > 0.99 ? <DockStarPatch placement={phone.placement} rotation={phone.rotation} fov={P.perspective.fovTo} size={size} alpha={star} /> : null;
    const homeScreen: ScreenSource = still ? homeScreenSource(still) : {kind: 'none'};
    return (
      <DeviceStage fov={P.perspective.fovTo} overlay={overlay}>
        <Phone3D placement={phone.placement} rotation={phone.rotation} edgeLight={{...phoneLight(), intensity: fade}} glow={glow} opacity={fade} screen={homeScreen} island />
        <Watch3D placement={watch.placement} rotation={watch.rotation} edgeLight={{...watchLight(lt), intensity: (watchLight(lt).intensity ?? 1) * fade}} glow={glow} opacity={watchBodyOpacity(lt) * fade} screen={watchScreen} />
        {passK > 0 ? <WalletPass3D {...passPose(lt, format, size)} edgeLight={{...passLight(passK), intensity: (passLight(passK).intensity ?? 1) * fade}} glow={glow} opacity={passBodyOpacity(passK) * fade} /> : null}
        <CardFlip {...flight} t={lt} />
      </DeviceStage>
    );
  }

  // 48.0-60.0: the void recordings (the bleeds are drawn outside the stage)
  const rec = recordingAt(t);
  if (rec && rec.framing === 'void') {
    const p = recordingPose(rec, t, format, size);
    return (
      <DeviceStage fov={P.perspective.fovTo}>
        <Phone3D placement={p.placement} rotation={p.rotation} scale={p.scale} edgeLight={REST_LIGHT} screen={recordingScreen(rec)} island={false} />
      </DeviceStage>
    );
  }

  // 60.0-68.0: the invitation
  if (t >= P.invite.mayaIn.from) {
    const inv = INVITE[format];
    const lit = windowProgress({from: P.invite.mayaIn.from, to: P.invite.mayaIn.to}, t, 'easeInOutSine');
    const farLit = windowProgress({from: P.invite.farPhoneLights - 0.5, to: P.invite.farPhoneLights}, t, 'easeInOutSine');
    const hot = (id: string, at: number): ScreenSource => {
      const c = clipScreen(id, at);
      return c.kind === 'video' ? c : {kind: 'none'};
    };
    const inviteScreen: ScreenSource = t < P.invite.tap ? (() => {
      const c = hot('invite-friend', P.invite.tap);
      return c.kind === 'video' ? {kind: 'video', src: c.src, holdAt: (c.startAt ?? 0) + P.invite.tap} : c;
    })() : hot('invite-friend', P.invite.tap);
    return (
      <DeviceStage fov={P.perspective.fovTo}>
        <Phone3D
          placement={{x: inv.phone.x, y: inv.phone.y, height: inv.phone.height * size.height}}
          rotation={{x: -4, y: format === 'tall' ? 0 : 10}}
          edgeLight={{...REST_LIGHT, intensity: lit * (t >= P.invite.tap ? mainLightFlare(t) : 1)}}
          opacity={lit}
          screen={inviteScreen}
          island={false}
        />
        <Phone3D
          placement={{x: inv.far.x, y: inv.far.y, height: inv.far.height * size.height}}
          rotation={{x: -4, y: format === 'tall' ? 0 : 12}}
          edgeLight={{...REST_LIGHT, intensity: farLit}}
          opacity={farLit}
          screen={{kind: 'none'}}
        />
      </DeviceStage>
    );
  }

  return <DeviceStage fov={P.perspective.fovTo}>{null}</DeviceStage>;
};

const mainLightFlare = (t: number): number => {
  const s = t - P.invite.tap;
  return s < 0 || s > P.snapSeconds ? 1 : 1 + 0.6 * (1 - ease('easeOutCubic', s / P.snapSeconds));
};

/** Where the phone's bottom edge is on screen, for the label (the phone's centre and height as the stage places them). */
const phoneBottom = (t: number, format: FormatName, size: Size): {x: number; y: number} => {
  const base = basePlacement(format, size);
  return {x: base.x * size.width, y: (base.y + 0) * size.height + base.height / 2};
};

const Rolls: React.FC<{t: number; format: FormatName; size: Size}> = ({t, format, size}) => (
  <>
    {P.numberRolls.map((r, i) => {
      const [digit, ...rest] = r.text.split(' ');
      const words = rest.join(' ');
      const next = P.numberRolls[i + 1]?.at ?? P.recordings[0]!.t;
      if (t < r.at - 0.3 || t >= next) return null;
      const age = t - r.at;
      const wordsOpacity = clamp01((age - 0.1) / 0.3) * (1 - clamp01((t - (next - 0.2)) / 0.2));
      const baseline = size.height * (format === 'tall' ? 0.46 : 0.52);
      return (
        <React.Fragment key={r.at}>
          <NumberRoll
            to={digit ?? ''}
            start={r.at}
            duration={0.4}
            ink="glass"
            weight={700}
            size={200}
            at={[size.width / 2, baseline]}
            align="centre"
            fadeIn={0.2}
            hold={Math.max(0, next - r.at - 0.4 - 0.2)}
            fadeOut={0.2}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: size.width,
              top: baseline + 36,
              textAlign: 'center',
              fontFamily: FONTS.super,
              fontWeight: 400,
              fontSize: 48,
              color: rgba(GLASS_WHITE, 0.8 * wordsOpacity),
            }}
          >
            {words}
          </div>
        </React.Fragment>
      );
    })}
  </>
);

/** The screen supers (kit, type only): positions from BIBLE4 §5.10, adapted to the format. */
const SUPER_Y: Record<FormatName, readonly number[]> = {wide: [0.82, 0.9, 0.9, 0.67], tall: [0.7, 0.92, 0.12, 0.6]};
const SUPER_SIZE: Record<FormatName, readonly number[]> = {wide: [44, 44, 44, 44], tall: [40, 40, 40, 38]};
const Supers: React.FC<{format: FormatName; opacity: number}> = ({format, opacity}) => (
  <div style={{opacity}}>
    {SUPERS.paperToGlass.map((s, i) => (
      <Super key={i} {...superFromBeat(s, {screen: {x: 0.5, y: SUPER_Y[format][i]!, align: 'centre'}}, {size: SUPER_SIZE[format][i]})} />
    ))}
  </div>
);

export const Overlay: React.FC = () => {
  const {t, isTall, camera} = useChapter('paperToGlass');
  const {width, height} = useVideoConfig();
  const format: FormatName = isTall ? 'tall' : 'wide';
  const size: Size = {width, height};
  const still = useHomeStill();
  void BINDER_HOME_STILL;
  void KIT_VIDEO_HOLD;

  const veil = ease('easeInOutCubic', windowProgress(P.paperToBlack, t));
  const dim = 1 - 0.15 * windowProgress({from: P.glowFadeStarts, to: 80}, t);
  const rec = recordingAt(t);
  const stageOn = t >= P.foldIntoPhone.from && t < P.hardStop && !(t >= P.numberRolls[0].at && t < P.recordings[0]!.t);
  const snapI = snapIndexAt(t);
  const bottom = phoneBottom(t, format, size);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: COLORS.void, opacity: veil}} />
      {stageOn ? <Devices t={t} format={format} size={size} still={still} /> : null}
      <VillageLight t={t} format={format} size={size} toScreen={camera.toScreen} />
      {rec && rec.framing === 'bleed' ? (
        <Sequence from={sec(rec.t)} durationInFrames={sec(rec.dur)} name={`bleed ${rec.n}`}>
          <BleedCut footage={rec.footage.replace(/^capture:\s*/, '')} start={rec.t} focusKey={rec.footage} format={format} size={size} />
        </Sequence>
      ) : null}
      {/* the nine labels */}
      {GLASS_SNAPS.map((s, i) => {
        const next = GLASS_SNAPS[i + 1]?.t ?? P.split.from - 0.5;
        if (t < s.t || t >= next) return null;
        return <Label key={s.n} text={s.label} centreX={bottom.x} top={Math.min(bottom.y + 48, height - 64)} opacity={labelOpacity(t, s.t, next)} />;
      })}
      {/* the eight recordings' labels */}
      {RECORDINGS.map((r) => {
        if (t < r.t || t >= r.t + r.dur) return null;
        const centreY = Math.min(r.framing === 'void' ? REC_PHONE_Y[format] * height + (REC_PHONE_HEIGHT[format] * height) / 2 + 48 : height * 0.88, height - 64);
        return <Label key={r.n} text={r.label} centreX={width / 2} top={centreY} opacity={labelOpacity(t, r.t, r.t + r.dur)} />;
      })}
      {t >= P.numberRolls[0].at - 0.3 && t < P.recordings[0]!.t ? <Rolls t={t} format={format} size={size} /> : null}
      {t >= P.invite.mayaIn.from && t < P.hardStop ? (
        <>
          <MayaInLight t={t} format={format} size={size} />
          <PaperPlane t={t} format={format} size={size} />
          <NotificationCard t={t} format={format} size={size} />
        </>
      ) : null}
      {t < P.hardStop || t >= P.title.word.from ? <Supers format={format} opacity={t >= P.hardStop ? dim : 1} /> : null}
      {t >= P.title.word.from ? (
        <div style={{position: 'absolute', inset: 0, opacity: dim}}>
          <TitleLayer t={t} format={format} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Art: React.FC = () => null;

export const Chapter: React.FC = () => <ChapterShell id="paperToGlass" art={<Art />} overlay={<Overlay />} />;
