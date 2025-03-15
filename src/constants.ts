export const cssValues: Record<string, string[]> = {
  // --------------------------------------------------------------------------------
  // กลุ่มที่มีอยู่เดิม
  // --------------------------------------------------------------------------------
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
  'text-indent': ['0px', '10px', '20px', '30px'],
  'text-justify': ['auto', 'inter-word', 'inter-character', 'none'],
  'text-overflow': ['clip', 'ellipsis'],
  'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'user-select': ['none', 'text', 'all', 'auto'],
  'z-index': ['auto', 'inherit', 'initial', 'unset'], // ตัวเลขกำหนดเองได้
  'box-shadow': ['none', '0px 4px 6px rgba(0,0,0,0.1)', 'inset 0px 4px 6px rgba(0,0,0,0.1)'],
  'column-gap': ['normal', '10px', '20px', '30px'],
  'row-gap': ['normal', '10px', '20px', '30px'],
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

  // --------------------------------------------------------------------------------
  // กลุ่มที่เพิ่มเติมจาก abbrMap (ยังไม่เคยมีมาก่อนใน cssValues ด้านบน)
  // --------------------------------------------------------------------------------

  // Animation
  animation: ['none', 'fadein 1s ease-in-out', 'spin 0.5s linear infinite'],
  'animation-delay': ['0s', '1s', '2s', '3s'],
  'animation-direction': ['normal', 'reverse', 'alternate', 'alternate-reverse'],
  'animation-duration': ['0s', '1s', '2s', '3s'],
  'animation-fill-mode': ['none', 'forwards', 'backwards', 'both'],
  'animation-iteration-count': ['infinite', '1', '2', '3'],
  'animation-name': ['none', 'slide', 'fadein'],
  'animation-play-state': ['running', 'paused'],
  'animation-timing-function': [
    'ease',
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
  ],

  // Appearance
  appearance: ['auto', 'none', 'textfield', 'button'],

  // Aspect Ratio
  'aspect-ratio': ['auto', '16/9', '4/3', '1/1'],

  // Backdrop / Filter
  'backdrop-filter': ['none', 'blur(4px)', 'brightness(0.8)'],
  'backface-visibility': ['visible', 'hidden'],

  // Background
  'background-blend-mode': ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],
  'background-clip': ['border-box', 'padding-box', 'content-box', 'text'],
  'background-color': ['transparent', '#fff', '#000', 'red', 'blue'],
  'background-origin': ['padding-box', 'border-box', 'content-box'],
  'background-position': ['left top', 'center center', 'right bottom', '50% 50%'],
  'background-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
  'background-size': ['auto', 'cover', 'contain', '50% 50%', '100px 100px'],

  // Border / Outline
  border: ['none', '1px solid #000', '2px dashed #ccc'],
  'border-bottom': ['none', '1px solid #000', '2px dashed #ccc'],
  'border-collapse': ['collapse', 'separate'],
  'border-image': ['none', 'url(border.png) 30 round'],
  'border-left': ['none', '1px solid #000', '2px dashed #ccc'],
  'border-radius': ['0', '4px', '50%', '9999px'],
  'border-right': ['none', '1px solid #000', '2px dashed #ccc'],
  'border-spacing': ['0', '2px', '4px', '8px'],
  'border-top': ['none', '1px solid #000', '2px dashed #ccc'],
  outline: ['none', '1px solid red'],
  'outline-width': ['thin', 'medium', 'thick', '1px', '2px'],
  'outline-color': ['invert', '#000', 'red'],
  'outline-style': [
    'none',
    'solid',
    'dotted',
    'dashed',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ],
  'outline-offset': ['0', '1px', '2px', '4px'],

  // Color
  color: ['currentColor', 'black', 'white', 'red', '#000', '#fff'],

  // Container Query
  'container-type': ['normal', 'size', 'inline-size'],
  container: ['none', 'myContainer / size', 'myContainer / inline-size'], // shorthand (ถ้าต้องการ)
  'container-name': ['none', 'myContainer'],

  // Columns / Gap
  columns: ['auto', '200px auto', '12em 3em'],
  gap: ['normal', '10px', '20px', '30px'],

  // Flex
  flex: ['none', '0 1 auto', '1', '1 1 0'],
  'flex-basis': ['auto', '0', '10px', '50%'],
  'flex-grow': ['0', '1', '2', '3'],
  'flex-shrink': ['0', '1', '2', '3'],

  // Filter
  filter: ['none', 'blur(5px)', 'grayscale(100%)', 'brightness(0.8)'],

  // Font
  'font-feature-settings': ['normal', '"liga" 1', '"calt" 0'],
  'font-family': ['sans-serif', 'serif', 'monospace', 'cursive'],
  'font-size': ['12px', '14px', '16px', '1em', '1rem'],
  'font-style': ['normal', 'italic', 'oblique'],
  'font-variant': ['normal', 'small-caps'],
  'font-weight': ['normal', 'bold', 'bolder', 'lighter', '100', '400', '700', '900'],

  // Grid
  grid: ['none', '100px / auto', 'auto-flow / auto-flow dense'], // shorthand ตัวอย่าง
  'grid-area': ['auto', 'header', 'main', 'footer', '1 / 2 / 3 / 4'],
  'grid-auto-columns': ['auto', 'min-content', 'max-content', '1fr'],
  'grid-auto-rows': ['auto', 'min-content', 'max-content', '1fr'],
  'grid-column-end': ['auto', 'span 1', 'span 2', '2', '-1'],
  'grid-column-gap': ['0', '10px', '20px', '30px'],
  'grid-column-start': ['auto', '1', '2', 'span 2'],
  'grid-gap': ['0', '10px', '20px', '30px'],
  'grid-row-end': ['auto', 'span 1', 'span 2', '2', '-1'],
  'grid-row-gap': ['0', '10px', '20px', '30px'],
  'grid-row-start': ['auto', '1', '2', 'span 2'],

  // Height / Width / Min / Max
  height: ['auto', '100%', '100px', 'fit-content', 'min-content', 'max-content'],
  'max-height': ['none', '100%', '100px', 'fit-content', 'min-content', 'max-content'],
  'min-height': ['0', '100px', '100%', 'auto', 'min-content', 'max-content'],
  width: ['auto', '100%', '100px', 'fit-content', 'min-content', 'max-content'],
  'max-width': ['none', '100%', '100px', 'fit-content', 'min-content', 'max-content'],
  'min-width': ['0', '100px', '100%', 'auto', 'min-content', 'max-content'],

  // Isolation มีแล้ว (isolation)

  // Justify Items / Self / Place
  'justify-items': ['start', 'end', 'center', 'stretch'],
  'justify-self': ['auto', 'start', 'end', 'center', 'stretch'],
  'place-content': [
    'center',
    'start',
    'end',
    'stretch',
    'space-between',
    'space-around',
    'space-evenly',
  ],
  'place-items': ['auto', 'start', 'end', 'center', 'stretch'],
  'place-self': ['auto', 'start', 'end', 'center', 'stretch'],

  // Left / Right / Top / Bottom
  left: ['auto', '0', '50%', '100px'],
  right: ['auto', '0', '50%', '100px'],
  top: ['auto', '0', '50%', '100px'],
  bottom: ['auto', '0', '50%', '100px'],

  // Letter / Line / Word
  'letter-spacing': ['normal', '1px', '2px'],
  'line-height': ['normal', '1', '1.5', '2', '1em', '1rem'],
  'word-spacing': ['normal', '1px', '2px'],

  // Margin / Padding
  margin: ['0', 'auto', '10px', '1rem'],
  'margin-bottom': ['0', 'auto', '10px', '1rem'],
  'margin-left': ['0', 'auto', '10px', '1rem'],
  'margin-right': ['0', 'auto', '10px', '1rem'],
  'margin-top': ['0', 'auto', '10px', '1rem'],
  padding: ['0', '10px', '1rem'],
  'padding-bottom': ['0', '10px', '1rem'],
  'padding-left': ['0', '10px', '1rem'],
  'padding-right': ['0', '10px', '1rem'],
  'padding-top': ['0', '10px', '1rem'],

  // Mask / Clip
  mask: ['none', 'url(mask.png)', 'linear-gradient(#fff, #000)'],
  'mask-image': ['none', 'url(mask.png)'],
  'clip-path': ['none', 'circle(50% at 50% 50%)', 'inset(0 0 100px 0)'],

  // Object
  'object-fit': ['fill', 'contain', 'cover', 'none', 'scale-down'],
  'object-position': ['50% 50%', 'center center', 'top left', 'bottom right'],

  // Overscroll / Resize
  'overscroll-behavior': ['auto', 'contain', 'none'],
  'overscroll-behavior-x': ['auto', 'contain', 'none'],
  'overscroll-behavior-y': ['auto', 'contain', 'none'],
  resize: ['none', 'both', 'horizontal', 'vertical'],

  // Perspective / Transform
  perspective: ['none', '500px', '1000px'],
  'perspective-origin': ['center center', 'top left', '50% 50%'],
  transform: ['none', 'translate(0,0)', 'scale(1)', 'rotate(0deg)'],
  'transform-box': ['border-box', 'fill-box', 'view-box'],
  'transform-origin': ['center center', 'top left', 'bottom right'],
  'transform-style': ['flat', 'preserve-3d'],

  // Transition
  transition: ['none', 'all 0.3s ease', 'opacity 0.3s ease-in'],
  'transition-delay': ['0s', '1s', '2s'],
  'transition-duration': ['0s', '0.3s', '1s'],
  'transition-property': ['none', 'all', 'opacity', 'transform'],
  'transition-timing-function': [
    'ease',
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
  ],

  // Text Decor (เพิ่มเติม)
  'text-shadow': ['none', '1px 1px 2px rgba(0,0,0,0.5)'],
  'text-wrap': ['normal', 'none'], // หรือหากไม่ใช้จริง สามารถลบทิ้งได้
  'text-underline-position': ['auto', 'under', 'left', 'right'],
  'text-size-adjust': ['auto', 'none', '100%'],
  'text-decoration-line': ['none', 'underline', 'overline', 'line-through'],
  'text-decoration-color': ['#000', '#fff', 'red', 'blue', 'currentColor'],
  'text-decoration-style': ['solid', 'double', 'dotted', 'dashed', 'wavy'],
  'text-decoration-skip-ink': ['none', 'auto', 'all'],

  // Will-change
  'will-change': ['auto', 'scroll-position', 'contents', 'transform', 'opacity'],

  // Content
  content: ['normal', 'none', '""', '"example"', 'attr(data-content)'],

  // Vendor Prefix
  '-webkit-display': [
    'inline-flex',
    'inline-block',
    'inline-box',
    'inline-grid',
    'inline-list-item',
    'inline-table',
    'run-in',
    'table',
    'table-caption',
    'table-cell',
    'table-column',
    'table-column-group',
    'table-footer-group',
    'table-header-group',
    'table-row',
    'table-row-group',
    'none',
  ],

  // -webkit-animation, -moz-animation, -ms-animation (abbr: '-webkit-ani', '-moz-ani', '-ms-ani')
  '-webkit-animation': ['none', 'fadein 1s ease-in-out', 'spin 0.5s linear infinite'],
  '-moz-animation': ['none', 'fadein 1s ease-in-out', 'spin 0.5s linear infinite'],
  '-ms-animation': ['none', 'fadein 1s ease-in-out', 'spin 0.5s linear infinite'],

  // -webkit-border-radius, -moz-border-radius (abbr: '-webkit-rd', '-moz-rd')
  '-webkit-border-radius': ['0', '4px', '50%', '9999px'],
  '-moz-border-radius': ['0', '4px', '50%', '9999px'],

  // -webkit-box-shadow, -moz-box-shadow (abbr: '-webkit-sd', '-moz-sd')
  '-webkit-box-shadow': [
    'none',
    '0px 4px 6px rgba(0,0,0,0.1)',
    'inset 0px 4px 6px rgba(0,0,0,0.1)',
  ],
  '-moz-box-shadow': ['none', '0px 4px 6px rgba(0,0,0,0.1)', 'inset 0px 4px 6px rgba(0,0,0,0.1)'],

  // -webkit-box-sizing, -moz-box-sizing (abbr: 'siz-webkit', 'siz-moz')
  '-webkit-box-sizing': ['content-box', 'border-box'],
  '-moz-box-sizing': ['content-box', 'border-box'],

  // -webkit-filter (abbr: '-webkit-fil')
  '-webkit-filter': ['none', 'blur(5px)', 'grayscale(100%)', 'brightness(0.8)'],

  // -webkit-backdrop-filter (abbr: '-webkit-bf')
  '-webkit-backdrop-filter': ['none', 'blur(4px)', 'brightness(0.8)'],

  // -webkit-background-blend-mode (abbr: '-webkit-bg-blend')
  '-webkit-background-blend-mode': ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],

  // -webkit-transform, -moz-transform, -ms-transform (abbr: '-webkit-tf', '-moz-tf', '-ms-tf')
  '-webkit-transform': ['none', 'translate(0,0)', 'scale(1)', 'rotate(0deg)'],
  '-moz-transform': ['none', 'translate(0,0)', 'scale(1)', 'rotate(0deg)'],
  '-ms-transform': ['none', 'translate(0,0)', 'scale(1)', 'rotate(0deg)'],

  // -webkit-transition, -moz-transition, -ms-transition (abbr: '-webkit-tsn', '-moz-tsn', '-ms-tsn')
  '-webkit-transition': ['none', 'all 0.3s ease', 'opacity 0.3s ease-in'],
  '-moz-transition': ['none', 'all 0.3s ease', 'opacity 0.3s ease-in'],
  '-ms-transition': ['none', 'all 0.3s ease', 'opacity 0.3s ease-in'],

  // -webkit-text-size-adjust, -moz-text-size-adjust, -ms-text-size-adjust (abbr: 'tx-adj-webkit', 'tx-adj-moz', 'tx-adj-ms')
  '-webkit-text-size-adjust': ['auto', 'none', '100%'],
  '-moz-text-size-adjust': ['auto', 'none', '100%'],
  '-ms-text-size-adjust': ['auto', 'none', '100%'],

  // -webkit-user-select, -moz-user-select, -ms-user-select (abbr: '-webkit-sel', '-moz-sel', '-ms-sel')
  '-webkit-user-select': ['none', 'text', 'all', 'auto'],
  '-moz-user-select': ['none', 'text', 'all', 'auto'],
  '-ms-user-select': ['none', 'text', 'all', 'auto'],

  // -webkit-appearance, -moz-appearance (abbr: '-webkit-app', '-moz-app')
  '-webkit-appearance': ['auto', 'none', 'textfield', 'button'],
  '-moz-appearance': ['auto', 'none', 'textfield', 'button'],

  // -webkit-mask, -webkit-mask-image (abbr: '-webkit-mask', '-webkit-mask-img')
  '-webkit-mask': ['none', 'url(mask.png)', 'linear-gradient(#fff, #000)'],
  '-webkit-mask-image': ['none', 'url(mask.png)'],

  // -webkit-clip-path (abbr: '-webkit-clip-path')
  '-webkit-clip-path': ['none', 'circle(50% at 50% 50%)', 'inset(0 0 100px 0)'],
};

export const abbrMap: Record<string, string> = {
  /********************************************
   * Alignment, Box, and Display
   ********************************************/
  ac: 'align-content',
  ai: 'align-items',
  as: 'align-self',
  d: 'display',
  '-webkit-d': '-webkit-display', // (ไม่ค่อยพบว่าได้ใช้ แต่ใส่เผื่อ)

  /********************************************
   * Animation
   ********************************************/
  ani: 'animation',
  '-webkit-ani': '-webkit-animation',
  '-moz-ani': '-moz-animation',
  '-ms-ani': '-ms-animation',
  'ani-delay': 'animation-delay',
  'ani-dir': 'animation-direction',
  'ani-dur': 'animation-duration',
  'ani-fill': 'animation-fill-mode',
  'ani-count': 'animation-iteration-count',
  'ani-name': 'animation-name',
  'ani-play': 'animation-play-state',
  'ani-timefun': 'animation-timing-function',

  /********************************************
   * Background
   ********************************************/
  bg: 'background-color',
  'bg-pos': 'background-position',
  'bg-size': 'background-size',
  'bg-repeat': 'background-repeat',
  'bg-clip': 'background-clip',
  'bg-origin': 'background-origin',
  'bg-blend': 'background-blend-mode',

  /********************************************
   * Border / Outline
   ********************************************/
  bd: 'border',
  bdl: 'border-left',
  bdt: 'border-top',
  bdr: 'border-right',
  bdb: 'border-bottom',
  'bd-spacing': 'border-spacing',
  'bd-collapse': 'border-collapse',
  'bd-img': 'border-image',
  rd: 'border-radius',
  '-webkit-rd': '-webkit-border-radius',
  '-moz-rd': '-moz-border-radius',
  outl: 'outline',
  'outl-width': 'outline-width',
  'outl-color': 'outline-color',
  'outl-style': 'outline-style',
  'outl-offset': 'outline-offset',

  /********************************************
   * Box Shadow / Sizing
   ********************************************/
  sd: 'box-shadow',
  '-webkit-sd': '-webkit-box-shadow',
  '-moz-sd': '-moz-box-shadow',
  siz: 'box-sizing',
  'siz-webkit': '-webkit-box-sizing',
  'siz-moz': '-moz-box-sizing',

  /********************************************
   * Color, Cursor
   ********************************************/
  c: 'color',
  curs: 'cursor',

  /********************************************
   * Container Query
   ********************************************/
  'ct-type': 'container-type',
  ct: 'container',
  'ct-name': 'container-name',

  /********************************************
   * Columns / Gap
   ********************************************/
  cols: 'columns',
  'col-gap': 'column-gap',
  'row-gap': 'row-gap',
  gap: 'gap',

  /********************************************
   * Flex / Grid
   ********************************************/
  fx: 'flex',
  '-webkit-fx': '-webkit-flex',
  '-moz-fx': '-moz-flex',
  'fx-basis': 'flex-basis',
  basis: 'flex-basis', // (สำรอง ถ้าอยากใช้ basis[...] ตรง ๆ)
  wrap: 'flex-wrap',
  direc: 'flex-direction',
  flow: 'flex-flow',
  grow: 'flex-grow',
  shrink: 'flex-shrink',

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

  /********************************************
   * Justify / Align / Place
   ********************************************/
  jc: 'justify-content',
  ji: 'justify-items',
  js: 'justify-self',
  pc: 'place-content',
  pi: 'place-items',
  ps: 'place-self',

  /********************************************
   * Font / Text
   ********************************************/
  fm: 'font-family',
  fs: 'font-size',
  fw: 'font-weight',
  fst: 'font-style',
  fv: 'font-variant',
  ffs: 'font-feature-settings',
  lh: 'line-height',
  'let-sp': 'letter-spacing',
  'word-sp': 'word-spacing',

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

  'tx-adj': 'text-size-adjust',
  'tx-adj-webkit': '-webkit-text-size-adjust',
  'tx-adj-moz': '-moz-text-size-adjust',
  'tx-adj-ms': '-ms-text-size-adjust',

  'tx-decor-line': 'text-decoration-line',
  'tx-decor-color': 'text-decoration-color',
  'tx-decor-style': 'text-decoration-style',
  'tx-decor-skip': 'text-decoration-skip-ink',

  /********************************************
   * Filter / Blend / Backdrop
   ********************************************/
  fil: 'filter',
  '-webkit-fil': '-webkit-filter',
  bf: 'backdrop-filter',
  '-webkit-bf': '-webkit-backdrop-filter',
  mbm: 'mix-blend-mode',
  '-webkit-bg-blend': '-webkit-background-blend-mode', // อาจไม่ได้ใช้จริง

  /********************************************
   * Dimensions / Spacing
   ********************************************/
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

  p: 'padding',
  pl: 'padding-left',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',

  /********************************************
   * Position
   ********************************************/
  pos: 'position',
  l: 'left',
  t: 'top',
  r: 'right',
  b: 'bottom',
  z: 'z-index',

  /********************************************
   * Object
   ********************************************/
  'obj-fit': 'object-fit',
  'obj-pos': 'object-position',

  /********************************************
   * Aspect Ratio
   ********************************************/
  ar: 'aspect-ratio',

  /********************************************
   * Overflow / Scroll Behavior
   ********************************************/
  ovf: 'overflow',
  'ovf-x': 'overflow-x',
  'ovf-y': 'overflow-y',
  'scr-beh': 'scroll-behavior',
  'ovscr-beh': 'overscroll-behavior',
  'ovscr-beh-x': 'overscroll-behavior-x',
  'ovscr-beh-y': 'overscroll-behavior-y',
  rs: 'resize',

  /********************************************
   * Opacity, Pointer Events, Cursor
   ********************************************/
  ptr: 'pointer-events',

  /********************************************
   * Transform / Transition / Will-change
   ********************************************/
  tf: 'transform',
  '-webkit-tf': '-webkit-transform',
  '-moz-tf': '-moz-transform',
  '-ms-tf': '-ms-transform',
  'tf-origin': 'transform-origin',
  'tf-box': 'transform-box',
  'tf-style': 'transform-style',
  per: 'perspective',
  'per-origin': 'perspective-origin',
  'backface-vis': 'backface-visibility',

  tsn: 'transition',
  '-webkit-tsn': '-webkit-transition',
  '-moz-tsn': '-moz-transition',
  '-ms-tsn': '-ms-transition',
  'tsn-delay': 'transition-delay',
  'tsn-dur': 'transition-duration',
  'tsn-prop': 'transition-property',
  'tsn-fn': 'transition-timing-function',
  wc: 'will-change',

  /********************************************
   * Mask / Clip
   ********************************************/
  mask: 'mask',
  'mask-img': 'mask-image',
  '-webkit-mask': '-webkit-mask',
  '-webkit-mask-img': '-webkit-mask-image',
  'clip-path': 'clip-path',
  '-webkit-clip-path': '-webkit-clip-path',

  /********************************************
   * Appearance / User-select
   ********************************************/
  app: 'appearance',
  '-webkit-app': '-webkit-appearance',
  '-moz-app': '-moz-appearance',

  sel: 'user-select',
  '-webkit-sel': '-webkit-user-select',
  '-moz-sel': '-moz-user-select',
  '-ms-sel': '-ms-user-select',

  /********************************************
   * Misc
   ********************************************/
  iso: 'isolation',
  content: 'content',
};
