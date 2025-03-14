export const cssValues: Record<string, string[]> = {
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch'],
  'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'stretch'],
  'align-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'stretch'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'flex-flow': ['row nowrap', 'row wrap', 'column nowrap', 'column wrap'],
  display: [
    'block',
    'inline',
    'inline-block',
    'flex',
    'grid',
    'inline-flex',
    'inline-grid',
    'none',
  ],
  cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'not-allowed', 'grab', 'grabbing'],
  'box-sizing': ['content-box', 'border-box'],
  overflow: ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'text-align': ['left', 'right', 'center', 'justify'],
  'text-decoration': ['none', 'underline', 'overline', 'line-through'],
  'text-indent': ['0px', '10px', '20px', '30px'], // ค่าที่ใช้บ่อย แต่สามารถกำหนดเองได้
  'text-justify': ['auto', 'inter-word', 'inter-character', 'none'],
  'text-overflow': ['clip', 'ellipsis'],
  'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'user-select': ['none', 'text', 'all', 'auto'],
  'z-index': ['auto', 'inherit', 'initial', 'unset'], // ตัวเลขกำหนดเอง
  'box-shadow': ['none', '0px 4px 6px rgba(0,0,0,0.1)', 'inset 0px 4px 6px rgba(0,0,0,0.1)'],
  'column-gap': ['normal', '10px', '20px', '30px'], // สามารถกำหนดเองได้
  'row-gap': ['normal', '10px', '20px', '30px'], // สามารถกำหนดเองได้
  'grid-auto-flow': ['row', 'column', 'row dense', 'column dense'],
  'grid-column': ['auto', 'span 2', 'span 3', '1 / -1'],
  'grid-row': ['auto', 'span 2', 'span 3', '1 / -1'],
  'grid-template': ['none', 'repeat(3, 1fr)', '100px 200px 300px'],
  'grid-template-columns': ['none', 'repeat(3, 1fr)', '100px 200px 300px'],
  'grid-template-rows': ['none', 'repeat(3, 1fr)', '100px 200px 300px'],
  'grid-template-areas': ['none', '"header header" "sidebar main" "footer footer"'],
  'list-style': ['none', 'disc', 'circle', 'square'],
  'list-style-position': ['inside', 'outside'],
  'list-style-type': ['disc', 'circle', 'square', 'decimal', 'lower-alpha', 'upper-alpha'],
  'table-layout': ['auto', 'fixed'],
  'caption-side': ['top', 'bottom'],
  'scroll-behavior': ['auto', 'smooth'],
  'scroll-snap-type': ['none', 'mandatory', 'proximity'],
  'mix-blend-mode': ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],
  isolation: ['auto', 'isolate'],
  'pointer-events': ['auto', 'none', 'all'],
};

export const abbrMap: Record<string, string> = {
  ac: 'align-content',
  ai: 'align-items',
  as: 'align-self',
  ani: 'animation',
  bg: 'background-color',
  'bg-pos': 'background-position',
  'bg-size': 'background-size',
  'bg-repeat': 'background-repeat',
  'bg-clip': 'background-clip',
  'bg-origin': 'background-origin',
  bd: 'border',
  bdl: 'border-left',
  bdt: 'border-top',
  bdr: 'border-right',
  bdb: 'border-bottom',
  'bd-spacing': 'border-spacing',
  'bd-collapse': 'border-collapse',
  rd: 'border-radius',
  'bd-img': 'border-image',
  sd: 'box-shadow',
  siz: 'box-sizing',
  c: 'color',
  'col-gap': 'column-gap',
  'row-gap': 'row-gap',
  cols: 'columns',
  content: 'content',
  curs: 'cursor',
  'ct-type': 'container-type',
  ct: 'container',
  d: 'display',
  family: 'font-family',
  fs: 'font-size',
  fw: 'font-weight',
  fx: 'flex',
  basis: 'flex-basis',
  wrap: 'flex-wrap',
  direc: 'flex-direction',
  flow: 'flex-flow',
  grow: 'flex-grow',
  shrink: 'flex-shrink',
  gap: 'gap',
  gd: 'grid',
  'gd-area': 'grid-area',
  'gd-auto-cols': 'grid-auto-columns',
  'gd-auto-flow': 'grid-auto-flow',
  'gd-auto-rows': 'grid-auto-rows',
  'gd-col': 'grid-column',
  'gd-col-end': 'grid-column-end',
  'gd-col-gap': 'grid-column-gap',
  'gd-col-start': 'grid-column-start',
  'gd-gap': 'grid-gap',
  'gd-row': 'grid-row',
  'gd-row-end': 'grid-row-end',
  'gd-row-gap': 'grid-row-gap',
  'gd-row-start': 'grid-row-start',
  'gd-temp': 'grid-template',
  'gd-temp-areas': 'grid-template-areas',
  'gd-temp-cols': 'grid-template-columns',
  'gd-temp-rows': 'grid-template-rows',
  jc: 'justify-content',
  ji: 'justify-items',
  js: 'justify-self',
  lh: 'line-height',
  w: 'width',
  'max-w': 'max-width',
  'min-w': 'min-width',
  h: 'height',
  'max-h': 'max-height',
  'min-h': 'min-height',
  m: 'margin',
  ml: 'margin-left',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',
  outl: 'outline',
  opa: 'opacity',
  ovf: 'overflow',
  'ovf-x': 'overflow-x',
  'ovf-y': 'overflow-y',
  ptr: 'pointer-events',
  p: 'padding',
  pl: 'padding-left',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',
  pos: 'position',
  l: 'left',
  t: 'top',
  r: 'right',
  b: 'bottom',
  'tx-ali': 'text-align',
  'tx-decor': 'text-decoration',
  'tx-ind': 'text-indent',
  'tx-jtf': 'text-justify',
  'tx-ovf': 'text-overflow',
  'tx-sd': 'text-shadow',
  'tx-tf': 'text-transform',
  'tx-wrap': 'text-wrap',
  'tx-unde-pos': 'text-underline-position',
  'tx-break': 'word-break',
  'tx-ws': 'white-space',
  tsn: 'transition',
  tf: 'transform',
  sel: 'user-select',
  z: 'z-index',
};
