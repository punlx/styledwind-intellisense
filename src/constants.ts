// constants.ts
export const cssValues: Record<string, string[]> = {
  /********************************************
   * Alignment, Box, and Display
   ********************************************/
  'align-content': [
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    'start',
    'end',
    'baseline',
    'first baseline',
    'last baseline',
    'safe center',
    'unsafe center',
    'normal',
  ],
  'align-items': [
    'normal',
    'stretch',
    'baseline',
    'first baseline',
    'last baseline',
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'self-start',
    'self-end',
    'safe center',
    'unsafe center',
  ],
  'align-self': [
    'auto',
    'normal',
    'stretch',
    'baseline',
    'first baseline',
    'last baseline',
    'center',
    'start',
    'end',
    'self-start',
    'self-end',
    'flex-start',
    'flex-end',
    'safe center',
    'unsafe center',
  ],
  display: [
    'inline',
    'block',
    'inline-block',
    'inline-flex',
    'inline-grid',
    'flex',
    'grid',
    'flow-root',
    'table',
    'table-row',
    'table-cell',
    'list-item',
    'none',
    'contents',
    // อื่น ๆ ตามสเปค เช่น 'run-in', 'ruby', ...
  ],

  /********************************************
   * Animation
   ********************************************/
  animation: [
    // shorthand มักจะรวมค่า (name duration timing-function delay iteration-count direction fill-mode play-state)
    // จึงอาจเป็น string ที่ซับซ้อน เช่น "fade-in 1s ease-in-out 0.5s 2 normal forwards running"
    // ใส่ตัวอย่างคำว่า "fade-in 1s ease" ฯลฯ
    '<animation-shorthand>',
  ],
  'animation-delay': [
    '<time>', // เช่น "0s", "1s", "500ms"
  ],
  'animation-direction': ['normal', 'reverse', 'alternate', 'alternate-reverse'],
  'animation-duration': [
    '<time>', // เช่น "1s", "2.5s", "100ms"
  ],
  'animation-fill-mode': ['none', 'forwards', 'backwards', 'both'],
  'animation-iteration-count': [
    'infinite',
    '<number>', // เช่น "1", "2", "3" ...
  ],
  'animation-name': [
    'none',
    '<keyframes-name>', // เช่น "fade-in"
  ],
  'animation-play-state': ['paused', 'running'],
  'animation-timing-function': [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
    'steps(<number>)',
    'cubic-bezier(<x1>, <y1>, <x2>, <y2>)',
  ],

  /********************************************
   * Background
   ********************************************/
  'background-color': ['<color>', 'transparent', 'currentColor', 'inherit', 'initial', 'unset'],
  'background-position': [
    'left top',
    'left center',
    'left bottom',
    'center top',
    'center center',
    'center bottom',
    'right top',
    'right center',
    'right bottom',
    '<length> <length>',
    '<percentage> <percentage>',
    // หรือ combination อื่น ๆ
  ],
  'background-size': [
    'auto',
    'cover',
    'contain',
    '<length> <length>',
    '<percentage> <percentage>',
    // อาจเป็นค่าผสมได้เช่น "auto 50%"
  ],
  'background-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
  'background-clip': ['border-box', 'padding-box', 'content-box', 'text'],
  'background-origin': ['border-box', 'padding-box', 'content-box'],
  'background-blend-mode': [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ],

  /********************************************
   * Border / Outline
   ********************************************/
  border: [
    // shorthand เช่น "1px solid #000", "thin dotted red"
    '<border-width> <border-style> <color>',
  ],
  'border-left': ['<border-width> <border-style> <color>'],
  'border-top': ['<border-width> <border-style> <color>'],
  'border-right': ['<border-width> <border-style> <color>'],
  'border-bottom': ['<border-width> <border-style> <color>'],
  'border-spacing': [
    '<length>', // สามารถเป็น "5px 10px" ก็ได้
  ],
  'border-collapse': ['collapse', 'separate'],
  'border-image': [
    // shorthand เช่น "url(border.png) 30 round"
    '<border-image-shorthand>',
  ],
  'border-radius': [
    '<length>',
    '<percentage>',
    // อาจผสมเช่น "10px 20px / 5px 10px"
  ],
  outline: [
    // shorthand เช่น "1px solid red"
    '<outline-width> <outline-style> <outline-color>',
  ],
  'outline-width': ['thin', 'medium', 'thick', '<length>'],
  'outline-color': [
    '<color>',
    'invert', // ค่าดั้งเดิม (บาง browser อาจไม่ซัพพอร์ต)
  ],
  'outline-style': [
    'auto',
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ],
  'outline-offset': ['<length>'],

  /********************************************
   * Box Shadow / Sizing
   ********************************************/
  'box-shadow': [
    // เช่น "none" หรือ "2px 2px 4px #000" หรือ "inset 5px 5px 10px red"
    '<shadow>',
  ],
  'box-sizing': ['content-box', 'border-box'],

  /********************************************
   * Color, Cursor
   ********************************************/
  color: ['<color>', 'currentColor', 'inherit', 'initial', 'unset'],
  cursor: [
    'auto',
    'default',
    'none',
    'context-menu',
    'help',
    'pointer',
    'progress',
    'wait',
    'cell',
    'crosshair',
    'text',
    'vertical-text',
    'alias',
    'copy',
    'move',
    'no-drop',
    'not-allowed',
    'grab',
    'grabbing',
    'all-scroll',
    'col-resize',
    'row-resize',
    'n-resize',
    'e-resize',
    's-resize',
    'w-resize',
    'ne-resize',
    'nw-resize',
    'se-resize',
    'sw-resize',
    'ew-resize',
    'ns-resize',
    'nesw-resize',
    'nwse-resize',
    'zoom-in',
    'zoom-out',
  ],

  /********************************************
   * Container Query
   ********************************************/
  'container-type': [
    'inline-size',
    'block-size',
    'size',
    'normal', // จากสเปค container queries (W3C)
  ],
  // 'container' เป็น shorthand ของ container-type และ container-name
  container: [
    'none',
    'inline-size',
    'block-size',
    'size',
    // หรือ "inline-size fooContainer" ฯลฯ
    '<container-shorthand>',
  ],
  'container-name': ['none', '<custom-name>'],

  /********************************************
   * Columns / Gap
   ********************************************/
  columns: [
    // shorthand เช่น "200px 3" (column-width column-count)
    '<column-width> <column-count>',
  ],
  'column-gap': ['normal', '<length>'],
  'row-gap': ['normal', '<length>'],
  gap: [
    'normal',
    '<length>',
    // หรือ "row-gap column-gap" เป็น shorthand
  ],

  /********************************************
   * Flex / Grid
   ********************************************/
  flex: [
    'none',
    'auto',
    '<number>', // flex-grow (หากใช้ตัวเดียว)
    '<number> <number>', // flex-grow flex-shrink
    '<number> <number> <length|percentage>', // flex-grow flex-shrink flex-basis
    // ตัวอย่าง: "1 0 auto", "0 1 200px"
  ],
  'flex-basis': [
    'auto',
    'content',
    '<length>',
    '<percentage>',
    'max-content',
    'min-content',
    'fit-content',
  ],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'flex-flow': [
    // shorthand ของ flex-direction และ flex-wrap
    'row nowrap',
    'row wrap',
    'row wrap-reverse',
    'column nowrap',
    'column wrap',
    'column wrap-reverse',
    'row-reverse nowrap',
    'row-reverse wrap',
    'column-reverse wrap',
    // ... เป็นต้น
  ],
  'flex-grow': ['<number>'],
  'flex-shrink': ['<number>'],

  grid: [
    // shorthand เช่น "none", หรือ "100px / auto-flow 50px"
    '<grid-shorthand>',
  ],
  'grid-area': [
    // shorthand เช่น "areaName", หรือ "1 / 2 / 3 / 4"
    '<grid-area>',
  ],
  'grid-auto-columns': [
    'auto',
    'min-content',
    'max-content',
    'fit-content(<length|percentage>)',
    'minmax(<length|percentage>, <length|percentage>)',
    '<length>',
    '<percentage>',
  ],
  'grid-auto-flow': ['row', 'column', 'dense', 'row dense', 'column dense'],
  'grid-auto-rows': [
    'auto',
    'min-content',
    'max-content',
    'fit-content(<length|percentage>)',
    'minmax(<length|percentage>, <length|percentage>)',
    '<length>',
    '<percentage>',
  ],
  'grid-column': [
    '<start> / <end>',
    // เช่น "1 / 3" หรือ "span 2 / span 4"
  ],
  'grid-column-end': [
    'auto',
    '<integer>',
    '<custom-grid-line-name>',
    'span <integer>',
    'span <custom-grid-line-name>',
  ],
  'grid-column-gap': ['normal', '<length>'],
  'grid-column-start': [
    'auto',
    '<integer>',
    '<custom-grid-line-name>',
    'span <integer>',
    'span <custom-grid-line-name>',
  ],
  'grid-gap': [
    'normal',
    '<length>',
    // หรือ "row-gap column-gap"
  ],
  'grid-row': ['<start> / <end>'],
  'grid-row-end': [
    'auto',
    '<integer>',
    '<custom-grid-line-name>',
    'span <integer>',
    'span <custom-grid-line-name>',
  ],
  'grid-row-gap': ['normal', '<length>'],
  'grid-row-start': [
    'auto',
    '<integer>',
    '<custom-grid-line-name>',
    'span <integer>',
    'span <custom-grid-line-name>',
  ],
  'grid-template': [
    // shorthand เช่น `"none"`, หรือ `"100px / 1fr 1fr"`, หรือรวม areas ด้วย
    '<grid-template-shorthand>',
  ],
  'grid-template-areas': [
    'none',
    // หรือชุด string เช่น
    `"<name> <name>" "<name2> <name3>"`,
  ],
  'grid-template-columns': [
    'none',
    'auto',
    '<track-size>',
    'min-content',
    'max-content',
    'fit-content(<length|percentage>)',
    'repeat(<count>, <track-size>)',
    'minmax(<length|percentage>, <length|percentage>)',
    // ... เป็นต้น
  ],
  'grid-template-rows': [
    'none',
    'auto',
    '<track-size>',
    'min-content',
    'max-content',
    'fit-content(<length|percentage>)',
    'repeat(<count>, <track-size>)',
    'minmax(<length|percentage>, <length|percentage>)',
  ],

  /********************************************
   * Justify / Align / Place
   ********************************************/
  'justify-content': [
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'start',
    'end',
    'left',
    'right',
  ],
  'justify-items': [
    'normal',
    'start',
    'end',
    'center',
    'left',
    'right',
    'stretch',
    'legacy',
    'self-start',
    'self-end',
    'baseline',
    'first baseline',
    'last baseline',
  ],
  'justify-self': [
    'auto',
    'normal',
    'start',
    'end',
    'center',
    'left',
    'right',
    'stretch',
    'self-start',
    'self-end',
    'baseline',
    'first baseline',
    'last baseline',
  ],
  'place-content': [
    // shorthand ของ align-content + justify-content เช่น "center stretch"
    '<place-content-shorthand>',
  ],
  'place-items': [
    // shorthand ของ align-items + justify-items
    '<place-items-shorthand>',
  ],
  'place-self': [
    // shorthand ของ align-self + justify-self
    '<place-self-shorthand>',
  ],

  /********************************************
   * Font / Text
   ********************************************/
  'font-family': [
    '<family-name>',
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    // ... หรือ list แบบ "Arial, sans-serif"
  ],
  'font-size': [
    'xx-small',
    'x-small',
    'small',
    'medium',
    'large',
    'x-large',
    'xx-large',
    'xxx-large',
    'smaller',
    'larger',
    '<length>',
    '<percentage>',
  ],
  'font-weight': [
    'normal',
    'bold',
    'bolder',
    'lighter',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ],
  'font-style': [
    'normal',
    'italic',
    'oblique',
    // บางครั้งอาจระบุ oblique angle เช่น "oblique 10deg"
  ],
  'font-variant': [
    'normal',
    'small-caps',
    // ยังมีค่าอื่น ๆ มากมายใน modern CSS (ligatures ฯลฯ)
  ],
  'font-feature-settings': [
    'normal',
    // หรือค่าเป็น string เช่น '"kern" 1', '"liga" off'
    '<feature-tag>',
  ],
  'line-height': ['normal', '<number>', '<length>', '<percentage>'],
  'letter-spacing': ['normal', '<length>'],
  'word-spacing': ['normal', '<length>'],

  'text-align': [
    'left',
    'right',
    'center',
    'justify',
    'start',
    'end',
    'match-parent',
    'justify-all', // บาง browser
  ],
  'text-decoration': [
    // shorthand เช่น "underline red wavy"
    '<text-decoration-shorthand>',
  ],
  'text-indent': [
    '<length>',
    '<percentage>',
    'hanging',
    'each-line',
    // หรือผสมกัน "2em hanging"
  ],
  'text-justify': ['auto', 'none', 'inter-word', 'inter-character', 'distribute'],
  'text-overflow': ['clip', 'ellipsis', '<string>'],
  'text-shadow': [
    'none',
    '<shadow>', // เช่น "1px 1px 2px #000"
  ],
  'text-transform': [
    'none',
    'capitalize',
    'uppercase',
    'lowercase',
    'full-width',
    'full-size-kana',
  ],
  'text-wrap': [
    // ส่วนใหญ่ property นี้เป็น non-standard หรือเป็นของเก่า (webkit)
    'normal',
    'none',
    'wrap',
    'unrestricted',
    'suppress',
  ],
  'text-underline-position': [
    'auto',
    'under',
    'left',
    'right',
    'below',
    // ... บาง browser มีค่าพิเศษ
  ],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],

  'text-size-adjust': [
    'auto',
    'none',
    '<percentage>', // เช่น "100%"
  ],
  'text-decoration-line': [
    'none',
    'underline',
    'overline',
    'line-through',
    'blink', // ไม่ค่อยซัพพอร์ตแล้ว
  ],
  'text-decoration-color': ['<color>'],
  'text-decoration-style': ['solid', 'double', 'dotted', 'dashed', 'wavy'],
  'text-decoration-skip-ink': ['auto', 'none', 'all'],

  /********************************************
   * Filter / Blend / Backdrop
   ********************************************/
  filter: [
    'none',
    '<filter-function>', // เช่น "blur(5px)", "grayscale(0.5)"
  ],
  'backdrop-filter': ['none', '<filter-function>'],
  '-webkit-backdrop-filter': ['none', '<filter-function>'],
  'mix-blend-mode': [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ],

  /********************************************
   * Dimensions / Spacing
   ********************************************/
  width: ['auto', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],
  'max-width': ['none', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],
  'min-width': ['auto', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],
  height: ['auto', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],
  'max-height': ['none', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],
  'min-height': ['auto', '<length>', '<percentage>', 'max-content', 'min-content', 'fit-content'],

  margin: [
    'auto',
    '<length>',
    '<percentage>',
    // shorthand เช่น "10px 20px"
  ],
  'margin-left': ['auto', '<length>', '<percentage>'],
  'margin-top': ['auto', '<length>', '<percentage>'],
  'margin-right': ['auto', '<length>', '<percentage>'],
  'margin-bottom': ['auto', '<length>', '<percentage>'],

  padding: [
    '<length>',
    '<percentage>',
    // shorthand เช่น "10px 20px"
  ],
  'padding-left': ['<length>', '<percentage>'],
  'padding-top': ['<length>', '<percentage>'],
  'padding-right': ['<length>', '<percentage>'],
  'padding-bottom': ['<length>', '<percentage>'],

  /********************************************
   * Position
   ********************************************/
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  left: ['auto', '<length>', '<percentage>'],
  top: ['auto', '<length>', '<percentage>'],
  right: ['auto', '<length>', '<percentage>'],
  bottom: ['auto', '<length>', '<percentage>'],
  'z-index': ['auto', '<integer>'],

  /********************************************
   * Object
   ********************************************/
  'object-fit': ['fill', 'contain', 'cover', 'none', 'scale-down'],
  'object-position': [
    'center',
    'top',
    'bottom',
    'left',
    'right',
    '<length> <length>',
    '<percentage> <percentage>',
    // หรือ combination เช่น "left 20px bottom 10px"
  ],

  /********************************************
   * Aspect Ratio
   ********************************************/
  'aspect-ratio': [
    'auto',
    '<ratio>', // เช่น "16/9", "1/1"
  ],

  /********************************************
   * Overflow / Scroll Behavior
   ********************************************/
  overflow: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  'overflow-x': ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  'scroll-behavior': ['auto', 'smooth'],
  'overscroll-behavior': ['auto', 'contain', 'none'],
  'overscroll-behavior-x': ['auto', 'contain', 'none'],
  'overscroll-behavior-y': ['auto', 'contain', 'none'],
  resize: [
    'none',
    'both',
    'horizontal',
    'vertical',
    'block', // บางสเปค
    'inline', // บางสเปค
  ],

  /********************************************
   * Opacity, Pointer Events (PE)
   ********************************************/
  'pointer-events': [
    'auto',
    'none',
    'visiblePainted',
    'visibleFill',
    'visibleStroke',
    'visible',
    'painted',
    'fill',
    'stroke',
    'all',
    'inherit',
  ],

  /********************************************
   * Transform / Transition / Will-change
   ********************************************/
  transform: [
    'none',
    '<transform-function>', // เช่น "translate(10px, 20px) rotate(45deg)"
  ],
  'transform-origin': [
    'center',
    'top',
    'bottom',
    'left',
    'right',
    '<length> <length>',
    '<percentage> <percentage>',
    // หรือ combination เช่น "50% 50%"
  ],
  'transform-box': ['border-box', 'content-box', 'fill-box', 'stroke-box', 'view-box'],
  'transform-style': ['flat', 'preserve-3d'],
  perspective: ['none', '<length>'],
  'perspective-origin': [
    'center',
    'top',
    'bottom',
    'left',
    'right',
    '<length> <length>',
    '<percentage> <percentage>',
  ],
  'backface-visibility': ['visible', 'hidden'],

  transition: [
    // shorthand: property duration timing-function delay
    '<transition-shorthand>',
  ],
  'transition-delay': ['<time>'],
  'transition-duration': ['<time>'],
  'transition-property': ['none', 'all', '<custom-property-name>'],
  'transition-timing-function': [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
    'steps(<number>)',
    'cubic-bezier(<x1>, <y1>, <x2>, <y2>)',
  ],
  'will-change': [
    'auto',
    '<property-name>',
    // เช่น "transform, opacity"
  ],

  /********************************************
   * Mask / Clip
   ********************************************/
  mask: [
    '<mask-shorthand>',
    // เช่น "url(mask.png) no-repeat center / contain"
  ],
  'mask-image': ['none', '<image>', 'url(...)', 'linear-gradient(...)'],
  '-webkit-mask': ['<mask-shorthand>'],
  '-webkit-mask-image': ['none', '<image>', 'url(...)', 'linear-gradient(...)'],
  'clip-path': [
    'none',
    '<basic-shape>',
    'url(...)',
    'margin-box',
    'border-box',
    'padding-box',
    'content-box',
    'text',
    // ... เป็นต้น
  ],
  '-webkit-clip-path': [
    'none',
    '<basic-shape>',
    'url(...)',
    'margin-box',
    'border-box',
    'padding-box',
    'content-box',
    'text',
  ],

  /********************************************
   * Appearance / User-select
   ********************************************/
  appearance: [
    'auto',
    'none',
    // browser-specific เช่น 'textfield', 'button', ...
  ],
  '-webkit-appearance': [
    'auto',
    'none',
    // browser-specific เช่น 'textfield', 'button', ...
  ],

  'user-select': ['auto', 'text', 'none', 'contain', 'all'],
  '-webkit-user-select': ['auto', 'text', 'none', 'contain', 'all'],

  /********************************************
   * Misc
   ********************************************/
  isolation: ['auto', 'isolate'],
  content: [
    'normal',
    'none',
    'counter',
    'attr(...)',
    'open-quote',
    'close-quote',
    'no-open-quote',
    'no-close-quote',
    '<string>',
  ],
};

export const abbrMap: Record<string, string> = {
  /********************************************
   * Alignment, Box, and Display
   ********************************************/
  ac: 'align-content',
  ai: 'align-items',
  as: 'align-self',
  d: 'display',

  /********************************************
   * Animation
   ********************************************/
  am: 'animation',
  'am-delay': 'animation-delay',
  'am-drt': 'animation-direction',
  'am-dur': 'animation-duration',
  'am-fill': 'animation-fill-mode',
  'am-count': 'animation-iteration-count',
  'am-name': 'animation-name',
  'am-play': 'animation-play-state',
  'am-timefun': 'animation-timing-function',

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
  br: 'border-radius',
  ol: 'outline',
  'ol-width': 'outline-width',
  'ol-color': 'outline-color',
  'ol-style': 'outline-style',
  'ol-offset': 'outline-offset',

  /********************************************
   * Box Shadow / Sizing
   ********************************************/
  sd: 'box-shadow',
  sz: 'box-sizing',

  /********************************************
   * Color, Cursor
   ********************************************/
  c: 'color',
  cs: 'cursor',

  /********************************************
   * Container Query
   ********************************************/
  'cn-type': 'container-type',
  cn: 'container',
  'cn-name': 'container-name',

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
  'fx-basis': 'flex-basis',
  basis: 'flex-basis', // (สำรอง ถ้าอยากใช้ basis[...] ตรง ๆ)
  wrap: 'flex-wrap',
  drt: 'flex-direction',
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
  'tx-decor-line': 'text-decoration-line',
  'tx-decor-color': 'text-decoration-color',
  'tx-decor-style': 'text-decoration-style',
  'tx-decor-skip': 'text-decoration-skip-ink',

  /********************************************
   * Filter / Blend / Backdrop
   ********************************************/
  fil: 'filter',
  bf: 'backdrop-filter',
  '-webkit-bf': '-webkit-backdrop-filter',
  mbm: 'mix-blend-mode',

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
  pe: 'pointer-events',

  /********************************************
   * Transform / Transition / Will-change
   ********************************************/
  tf: 'transform',
  'tf-origin': 'transform-origin',
  'tf-box': 'transform-box',
  'tf-style': 'transform-style',
  per: 'perspective',
  'per-origin': 'perspective-origin',
  'backface-vis': 'backface-visibility',

  tsn: 'transition',
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

  us: 'user-select',
  '-webkit-sel': '-webkit-user-select',

  /********************************************
   * Misc
   ********************************************/
  iso: 'isolation',
  ct: 'content',
};
