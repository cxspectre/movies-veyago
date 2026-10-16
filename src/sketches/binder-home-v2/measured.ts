// measured.ts — details the layout JSON does not list, measured from the ink of binder-home.png (screen points,
// [x0, y0, x1, y1]; the 3x pixels divided by 3, read with a border-median ink threshold). The JSON gives the
// element frames; these say where the glyphs, icons and the one hairline rule sit INSIDE those frames, so the
// drawing's text lines and icons land on the real ones. Re-measure if the footage is re-captured.
import {edges, type ScreenRect} from './screen';

type Edges = readonly [number, number, number, number];
const r = ([x0, y0, x1, y1]: Edges): ScreenRect => edges(x0, y0, x1, y1);

export const MEASURED = {
  status: {
    time: r([56.7, 26.3, 88.7, 39.0]),
    signal: r([288.3, 26.3, 307.7, 38.7]),
    wifi: r([315.0, 26.3, 331.7, 38.7]),
    battery: r([339.3, 26.0, 366.7, 39.7]),
  },
  topBar: {
    /** The "Mom" title's glyphs (inside navTitle). */
    title: r([182.3, 78.3, 220.0, 90.7]),
    chevron: r([62.0, 80.0, 75.3, 88.0]),
    magnifier: r([297.3, 73.7, 318.3, 95.0]),
    plus: r([355.0, 75.0, 373.0, 93.0]),
  },
  nextUp: {
    headline: r([21.3, 147.0, 121.7, 161.0]),
    link: r([230.7, 146.7, 368.0, 158.7]),
    linkChevron: r([375.0, 147.7, 381.3, 158.3]),
    /** "Tomorrow": cap top to baseline. */
    countdown: r([21.7, 187.0, 268.3, 226.0]),
    title: r([21.7, 247.3, 236.3, 268.0]),
    detail: [r([21.7, 276.0, 356.3, 287.7]), r([21.7, 296.0, 50.3, 307.7])],
    doneCheck: r([110.7, 368.0, 125.7, 382.7]),
    doneText: r([136.7, 369.3, 176.0, 381.7]),
    snoozeText: r([298.7, 369.0, 355.3, 381.7]),
    pagerDash: r([186.0, 414.0, 204.0, 420.0]),
    pagerDot: r([210.0, 414.0, 216.0, 420.0]),
  },
  later: {
    header: r([21.0, 442.7, 62.0, 451.3]),
    /** Per row: the date's glyphs and the name's glyphs. */
    rows: [
      {date: r([20.7, 470.7, 69.7, 482.0]), name: r([102.7, 470.7, 168.0, 484.3])},
      {date: r([20.7, 510.7, 66.0, 522.0]), name: r([102.3, 510.3, 165.3, 522.0])},
      {date: r([20.7, 550.7, 68.0, 562.0]), name: r([103.3, 550.3, 272.3, 564.7])},
    ],
    /** The hairline rule between the Later rows and the dock (not an accessibility element). */
    rule: r([20.0, 594.3, 382.0, 594.7]),
  },
  dock: {
    /** The 52 pt circle at the top centre of each dockButton frame (JSON notes). */
    circleDiameter: 52,
    icons: [r([44.7, 626.0, 64.7, 648.0]), r([113.3, 626.3, 142.3, 646.0]), r([190.3, 625.7, 212.0, 647.3]), r([262.0, 624.3, 286.7, 649.3]), r([337.3, 634.7, 357.3, 639.0])],
    labels: [r([24.0, 669.3, 86.0, 680.3]), r([110.7, 669.0, 145.7, 680.3]), r([190.3, 669.0, 211.7, 678.3]), r([253.0, 669.0, 295.7, 678.3]), r([334.0, 669.3, 361.3, 678.3])],
  },
  helpers: {
    header: r([21.0, 704.3, 81.3, 713.3]),
    /** Each chip's icon tile and title glyphs. */
    chips: [
      {icon: r([28.4, 732.4, 55.5, 759.0]), text: r([64.7, 740.3, 135.0, 754.3])},
      {icon: r([163.9, 732.4, 191.0, 759.0]), text: r([200.0, 740.3, 339.0, 754.3])},
    ],
  },
  tabBar: {
    /** Icon and label glyphs of the four tabs, in tabBarTab order. */
    icons: [r([63.4, 802.0, 83.0, 826.0]), r([148.7, 802.7, 168.0, 826.0]), r([231.7, 802.0, 255.6, 825.3]), r([313.7, 804.7, 344.7, 825.3])],
    labels: [r([56.8, 832.0, 89.0, 846.0]), r([130.7, 832.0, 185.8, 846.0]), r([219.8, 832.0, 267.4, 846.0]), r([312.6, 832.0, 345.7, 846.0])],
  },
} as const;
