/**
 * specialSplitMap: สร้างอัตโนมัติจาก generateSpecialSplitMap.ts
 * mapping สำหรับ inlayHints: abbr -> Array<{ pos: number; text: string }>
 */

// 1. สร้าง type interface
interface SplitItem {
  pos: number;
  text: string;
}

export const specialSplitMap: Record<string, SplitItem[]> = {
  ac: [
    {
      pos: 1,
      text: 'lign-',
    },
    {
      pos: 2,
      text: 'ontent',
    },
  ],
  ai: [
    {
      pos: 1,
      text: 'lign-',
    },
    {
      pos: 2,
      text: 'tems',
    },
  ],
  as: [
    {
      pos: 1,
      text: 'lign-',
    },
    {
      pos: 2,
      text: 'elf',
    },
  ],
  d: [
    {
      pos: 1,
      text: 'isplay',
    },
  ],
  ani: [
    {
      pos: 3,
      text: 'mation',
    },
  ],
  'ani-delay': [
    {
      pos: 3,
      text: 'mation',
    },
  ],
  'ani-dir': [
    {
      pos: 3,
      text: 'mation',
    },
    {
      pos: 7,
      text: 'ection',
    },
  ],
  'ani-dur': [
    {
      pos: 3,
      text: 'mation',
    },
    {
      pos: 7,
      text: 'ation',
    },
  ],
  'ani-fill': [
    {
      pos: 3,
      text: 'mation',
    },
    {
      pos: 8,
      text: '-mode',
    },
  ],
  'ani-count': [
    {
      pos: 3,
      text: 'mation',
    },
    {
      pos: 4,
      text: 'iteration-',
    },
  ],
  'ani-name': [
    {
      pos: 3,
      text: 'mation',
    },
  ],
  'ani-play': [
    {
      pos: 3,
      text: 'mation',
    },
    {
      pos: 8,
      text: '-state',
    },
  ],
  'ani-timefun': [
    {
      pos: 3,
      text: 'mation',
    },
  ],
  bg: [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round-color',
    },
  ],
  'bg-pos': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
    {
      pos: 6,
      text: 'ition',
    },
  ],
  'bg-size': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
  ],
  'bg-repeat': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
  ],
  'bg-clip': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
  ],
  'bg-origin': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
  ],
  'bg-blend': [
    {
      pos: 1,
      text: 'ack',
    },
    {
      pos: 2,
      text: 'round',
    },
    {
      pos: 8,
      text: '-mode',
    },
  ],
  bd: [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er',
    },
  ],
  bdl: [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er-',
    },
    {
      pos: 3,
      text: 'eft',
    },
  ],
  bdt: [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er-',
    },
    {
      pos: 3,
      text: 'op',
    },
  ],
  bdr: [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'e',
    },
    {
      pos: 3,
      text: '-right',
    },
  ],
  bdb: [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er-',
    },
    {
      pos: 3,
      text: 'ottom',
    },
  ],
  'bd-spacing': [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er',
    },
  ],
  'bd-collapse': [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er',
    },
  ],
  'bd-img': [
    {
      pos: 1,
      text: 'or',
    },
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 5,
      text: 'a',
    },
    {
      pos: 6,
      text: 'e',
    },
  ],
  br: [
    {
      pos: 1,
      text: 'order-',
    },
    {
      pos: 2,
      text: 'adius',
    },
  ],
  ol: [
    {
      pos: 1,
      text: 'ut',
    },
    {
      pos: 2,
      text: 'ine',
    },
  ],
  'ol-width': [
    {
      pos: 1,
      text: 'ut',
    },
    {
      pos: 2,
      text: 'ine',
    },
    {
      pos: 3,
      text: '',
    },
  ],
  'ol-color': [
    {
      pos: 1,
      text: 'ut',
    },
    {
      pos: 2,
      text: 'ine',
    },
    {
      pos: 3,
      text: '',
    },
  ],
  'ol-style': [
    {
      pos: 1,
      text: 'ut',
    },
    {
      pos: 2,
      text: 'ine',
    },
    {
      pos: 3,
      text: '',
    },
  ],
  'ol-offset': [
    {
      pos: 1,
      text: 'ut',
    },
    {
      pos: 2,
      text: 'ine',
    },
    {
      pos: 3,
      text: '',
    },
  ],
  sd: [
    {
      pos: 0,
      text: 'box-',
    },
    {
      pos: 1,
      text: 'ha',
    },
    {
      pos: 2,
      text: 'ow',
    },
  ],
  siz: [
    {
      pos: 3,
      text: 'ing',
    },
  ],
  c: [
    {
      pos: 1,
      text: 'olor',
    },
  ],
  cur: [
    {
      pos: 3,
      text: 'sor',
    },
  ],
  'ct-type': [
    {
      pos: 1,
      text: 'on',
    },
    {
      pos: 2,
      text: 'ainer',
    },
  ],
  ct: [
    {
      pos: 1,
      text: 'on',
    },
    {
      pos: 2,
      text: 'ainer',
    },
  ],
  'ct-name': [
    {
      pos: 1,
      text: 'on',
    },
    {
      pos: 2,
      text: 'ainer',
    },
  ],
  cols: [
    {
      pos: 3,
      text: 'umn',
    },
  ],
  'col-gap': [
    {
      pos: 3,
      text: 'umn',
    },
  ],
  fx: [
    {
      pos: 1,
      text: 'le',
    },
  ],
  'fx-basis': [
    {
      pos: 1,
      text: 'le',
    },
  ],
  direc: [
    {
      pos: 5,
      text: 'tion',
    },
  ],
  flow: [
    {
      pos: 2,
      text: 'ex-fl',
    },
  ],
  gd: [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-area': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-auto-cols': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 11,
      text: 'umn',
    },
  ],
  'gd-auto-flow': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-auto-rows': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-col': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 6,
      text: 'umn',
    },
  ],
  'gd-col-end': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 6,
      text: 'umn',
    },
  ],
  'gd-col-gap': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 6,
      text: 'umn',
    },
  ],
  'gd-col-start': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 6,
      text: 'umn',
    },
  ],
  'gd-gap': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-row': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-row-end': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-row-gap': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-row-start': [
    {
      pos: 1,
      text: 'ri',
    },
  ],
  'gd-temp': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 7,
      text: 'late',
    },
  ],
  'gd-temp-areas': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 7,
      text: 'late',
    },
  ],
  'gd-temp-cols': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 7,
      text: 'late',
    },
    {
      pos: 11,
      text: 'umn',
    },
  ],
  'gd-temp-rows': [
    {
      pos: 1,
      text: 'ri',
    },
    {
      pos: 7,
      text: 'late',
    },
  ],
  jc: [
    {
      pos: 1,
      text: 'ustify-',
    },
    {
      pos: 2,
      text: 'ontent',
    },
  ],
  ji: [
    {
      pos: 1,
      text: 'ust',
    },
    {
      pos: 2,
      text: 'fy-items',
    },
  ],
  js: [
    {
      pos: 1,
      text: 'u',
    },
    {
      pos: 2,
      text: 'tify-self',
    },
  ],
  pc: [
    {
      pos: 1,
      text: 'la',
    },
    {
      pos: 2,
      text: 'e-content',
    },
  ],
  pi: [
    {
      pos: 1,
      text: 'lace-',
    },
    {
      pos: 2,
      text: 'tems',
    },
  ],
  ps: [
    {
      pos: 1,
      text: 'lace-',
    },
    {
      pos: 2,
      text: 'elf',
    },
  ],
  fm: [
    {
      pos: 1,
      text: 'ont-fa',
    },
    {
      pos: 2,
      text: 'ily',
    },
  ],
  fs: [
    {
      pos: 1,
      text: 'ont-',
    },
    {
      pos: 2,
      text: 'ize',
    },
  ],
  fw: [
    {
      pos: 1,
      text: 'ont-',
    },
    {
      pos: 2,
      text: 'eight',
    },
  ],
  fst: [
    {
      pos: 1,
      text: 'ont-',
    },
    {
      pos: 3,
      text: 'yle',
    },
  ],
  fv: [
    {
      pos: 1,
      text: 'ont-',
    },
    {
      pos: 2,
      text: 'ariant',
    },
  ],
  ffs: [
    {
      pos: 1,
      text: 'ont-',
    },
    {
      pos: 2,
      text: 'eature-',
    },
    {
      pos: 3,
      text: 'ettings',
    },
  ],
  lh: [
    {
      pos: 1,
      text: 'ine-',
    },
    {
      pos: 2,
      text: 'eight',
    },
  ],
  'let-sp': [
    {
      pos: 3,
      text: 'ter',
    },
    {
      pos: 6,
      text: 'acing',
    },
  ],
  'word-sp': [
    {
      pos: 7,
      text: 'acing',
    },
  ],
  'tx-ali': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 6,
      text: 'gn',
    },
  ],
  'tx-decor': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 8,
      text: 'ation',
    },
  ],
  'tx-ind': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 6,
      text: 'ent',
    },
  ],
  'tx-jtf': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 4,
      text: 'us',
    },
    {
      pos: 5,
      text: 'i',
    },
    {
      pos: 6,
      text: 'y',
    },
  ],
  'tx-ovf': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 5,
      text: 'er',
    },
    {
      pos: 6,
      text: 'low',
    },
  ],
  'tx-sd': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 4,
      text: 'ha',
    },
    {
      pos: 5,
      text: 'ow',
    },
  ],
  'tx-tf': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 4,
      text: 'rans',
    },
    {
      pos: 5,
      text: 'orm',
    },
  ],
  'tx-wrap': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
  ],
  'tx-unde-pos': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 7,
      text: 'rline',
    },
    {
      pos: 11,
      text: 'ition',
    },
  ],
  'tx-adj': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 3,
      text: 'size-',
    },
    {
      pos: 6,
      text: 'ust',
    },
  ],
  'tx-decor-line': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 8,
      text: 'ation',
    },
  ],
  'tx-decor-color': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 8,
      text: 'ation',
    },
  ],
  'tx-decor-style': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 8,
      text: 'ation',
    },
  ],
  'tx-decor-skip': [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 't',
    },
    {
      pos: 8,
      text: 'ation',
    },
    {
      pos: 13,
      text: '-ink',
    },
  ],
  fil: [
    {
      pos: 3,
      text: 'ter',
    },
  ],
  bf: [
    {
      pos: 1,
      text: 'ackdrop-',
    },
    {
      pos: 2,
      text: 'ilter',
    },
  ],
  '-webkit-bf': [
    {
      pos: 9,
      text: 'ackdrop-',
    },
    {
      pos: 10,
      text: 'ilter',
    },
  ],
  mbm: [
    {
      pos: 1,
      text: 'ix-',
    },
    {
      pos: 2,
      text: 'lend-',
    },
    {
      pos: 3,
      text: 'ode',
    },
  ],
  w: [
    {
      pos: 1,
      text: 'idth',
    },
  ],
  'max-w': [
    {
      pos: 5,
      text: 'idth',
    },
  ],
  'min-w': [
    {
      pos: 5,
      text: 'idth',
    },
  ],
  h: [
    {
      pos: 1,
      text: 'eight',
    },
  ],
  'max-h': [
    {
      pos: 5,
      text: 'eight',
    },
  ],
  'min-h': [
    {
      pos: 5,
      text: 'eight',
    },
  ],
  m: [
    {
      pos: 1,
      text: 'argin',
    },
  ],
  ml: [
    {
      pos: 1,
      text: 'argin-',
    },
    {
      pos: 2,
      text: 'eft',
    },
  ],
  mt: [
    {
      pos: 1,
      text: 'argin-',
    },
    {
      pos: 2,
      text: 'op',
    },
  ],
  mr: [
    {
      pos: 1,
      text: 'a',
    },
    {
      pos: 2,
      text: 'gin-right',
    },
  ],
  mb: [
    {
      pos: 1,
      text: 'argin-',
    },
    {
      pos: 2,
      text: 'ottom',
    },
  ],
  p: [
    {
      pos: 1,
      text: 'adding',
    },
  ],
  pl: [
    {
      pos: 1,
      text: 'adding-',
    },
    {
      pos: 2,
      text: 'eft',
    },
  ],
  pt: [
    {
      pos: 1,
      text: 'adding-',
    },
    {
      pos: 2,
      text: 'op',
    },
  ],
  pr: [
    {
      pos: 1,
      text: 'adding-',
    },
    {
      pos: 2,
      text: 'ight',
    },
  ],
  pb: [
    {
      pos: 1,
      text: 'adding-',
    },
    {
      pos: 2,
      text: 'ottom',
    },
  ],
  pos: [
    {
      pos: 3,
      text: 'ition',
    },
  ],
  l: [
    {
      pos: 1,
      text: 'eft',
    },
  ],
  t: [
    {
      pos: 1,
      text: 'op',
    },
  ],
  r: [
    {
      pos: 1,
      text: 'ight',
    },
  ],
  b: [
    {
      pos: 1,
      text: 'ottom',
    },
  ],
  z: [
    {
      pos: 1,
      text: '-index',
    },
  ],
  'obj-fit': [
    {
      pos: 3,
      text: 'ect',
    },
  ],
  'obj-pos': [
    {
      pos: 3,
      text: 'ect',
    },
    {
      pos: 7,
      text: 'ition',
    },
  ],
  ar: [
    {
      pos: 1,
      text: 'spect-',
    },
    {
      pos: 2,
      text: 'atio',
    },
  ],
  ovf: [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 3,
      text: 'low',
    },
  ],
  'ovf-x': [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 3,
      text: 'low',
    },
  ],
  'ovf-y': [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 3,
      text: 'low',
    },
  ],
  'scr-beh': [
    {
      pos: 3,
      text: 'oll',
    },
    {
      pos: 7,
      text: 'avior',
    },
  ],
  'ovscr-beh': [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 5,
      text: 'oll',
    },
    {
      pos: 9,
      text: 'avior',
    },
  ],
  'ovscr-beh-x': [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 5,
      text: 'oll',
    },
    {
      pos: 9,
      text: 'avior',
    },
  ],
  'ovscr-beh-y': [
    {
      pos: 2,
      text: 'er',
    },
    {
      pos: 5,
      text: 'oll',
    },
    {
      pos: 9,
      text: 'avior',
    },
  ],
  rs: [
    {
      pos: 1,
      text: 'e',
    },
    {
      pos: 2,
      text: 'ize',
    },
  ],
  pe: [
    {
      pos: 1,
      text: 'oint',
    },
    {
      pos: 2,
      text: 'r-events',
    },
  ],
  tf: [
    {
      pos: 1,
      text: 'rans',
    },
    {
      pos: 2,
      text: 'orm',
    },
  ],
  'tf-origin': [
    {
      pos: 1,
      text: 'rans',
    },
    {
      pos: 2,
      text: 'orm',
    },
  ],
  'tf-box': [
    {
      pos: 1,
      text: 'rans',
    },
    {
      pos: 2,
      text: 'orm',
    },
  ],
  'tf-style': [
    {
      pos: 1,
      text: 'rans',
    },
    {
      pos: 2,
      text: 'orm',
    },
  ],
  per: [
    {
      pos: 3,
      text: 'spective',
    },
  ],
  'per-origin': [
    {
      pos: 3,
      text: 'spective',
    },
  ],
  'backface-vis': [
    {
      pos: 12,
      text: 'ibility',
    },
  ],
  tsn: [
    {
      pos: 1,
      text: 'ran',
    },
    {
      pos: 2,
      text: 'itio',
    },
  ],
  'tsn-delay': [
    {
      pos: 1,
      text: 'ran',
    },
    {
      pos: 2,
      text: 'itio',
    },
  ],
  'tsn-dur': [
    {
      pos: 1,
      text: 'ran',
    },
    {
      pos: 2,
      text: 'itio',
    },
    {
      pos: 7,
      text: 'ation',
    },
  ],
  'tsn-prop': [
    {
      pos: 1,
      text: 'ran',
    },
    {
      pos: 2,
      text: 'itio',
    },
    {
      pos: 8,
      text: 'erty',
    },
  ],
  'tsn-fn': [
    {
      pos: 1,
      text: 'ran',
    },
    {
      pos: 2,
      text: 'itio',
    },
    {
      pos: 4,
      text: 'timing-',
    },
    {
      pos: 5,
      text: 'u',
    },
    {
      pos: 6,
      text: 'ction',
    },
  ],
  wc: [
    {
      pos: 1,
      text: 'ill-',
    },
    {
      pos: 2,
      text: 'hange',
    },
  ],
  'mask-img': [
    {
      pos: 7,
      text: 'a',
    },
    {
      pos: 8,
      text: 'e',
    },
  ],
  '-webkit-mask-img': [
    {
      pos: 15,
      text: 'a',
    },
    {
      pos: 16,
      text: 'e',
    },
  ],
  app: [
    {
      pos: 3,
      text: 'earance',
    },
  ],
  '-webkit-app': [
    {
      pos: 11,
      text: 'earance',
    },
  ],
  us: [
    {
      pos: 1,
      text: 'ser-',
    },
    {
      pos: 2,
      text: 'elect',
    },
  ],
  '-webkit-sel': [
    {
      pos: 8,
      text: 'u',
    },
    {
      pos: 10,
      text: 'r-se',
    },
    {
      pos: 11,
      text: 'ect',
    },
  ],
  iso: [
    {
      pos: 3,
      text: 'lation',
    },
  ],
};
