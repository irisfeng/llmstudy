import { useEffect, useRef, useState } from 'react'

/* Hand-drawn doodle system (Kaggle/Notion style sketch illustrations).
   All strokes: fill none, currentColor, round caps, slightly irregular paths.
   Strokes draw in once when scrolled into view; reduced-motion renders final state. */

export function useDrawIn(threshold = 0.3) {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || drawn) return undefined
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setDrawn(true)
      return undefined
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setDrawn(true)
        io.disconnect()
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [drawn, threshold])
  return [ref, drawn]
}

function DoodleSvg({ viewBox, className = '', children, stretch = false, still = false, ...rest }) {
  const [ref, drawn] = useDrawIn()
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={`doodle ${drawn || still ? 'drawn' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* Stroke helpers: pathLength=1 normalises the dash draw-in math; delay staggers passes. */
const P = ({ delay = 0, ...rest }) => <path pathLength={1} style={{ transitionDelay: `${delay}s` }} {...rest} />
const C = ({ delay = 0, ...rest }) => <circle pathLength={1} style={{ transitionDelay: `${delay}s` }} {...rest} />
const E = ({ delay = 0, ...rest }) => <ellipse pathLength={1} style={{ transitionDelay: `${delay}s` }} {...rest} />

/* Curved hand arrow, points down-right by default; rotate/flip with CSS at call site. */
export function DoodleArrow({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 100 64" className={`doodle-arrow ${className}`}>
      <P d="M7 9 C 28 38, 55 49, 84 42" strokeWidth="3" />
      <P d="M70 30 C 76 35, 81 39, 87 43 C 81 46, 75 51, 70 57" strokeWidth="3" delay="0.35" />
    </DoodleSvg>
  )
}

/* Double-pass wavy underline swash. Stretch to parent width. */
export function DoodleUnderline({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 200 22" stretch className={`doodle-underline ${className}`}>
      <P d="M4 13 C 38 7, 72 17, 106 12 C 140 7, 170 14, 196 10" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
      <P d="M10 18 C 52 14, 96 19, 150 15" strokeWidth="1.6" vectorEffect="non-scaling-stroke" opacity="0.45" delay="0.3" />
    </DoodleSvg>
  )
}

/* Scribbled circle/ellipse ring for highlighting a word or a node. */
export function DoodleCircle({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 120 120" className={`doodle-circle ${className}`}>
      <P d="M63 13 C 31 10, 11 33, 13 62 C 15 93, 45 111, 71 107 C 98 103, 113 79, 109 52 C 105 27, 83 9, 51 14" strokeWidth="3" />
    </DoodleSvg>
  )
}

/* Four-point sparkle / star. */
export function DoodleStar({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 100 100" className={`doodle-star ${className}`}>
      <P d="M50 10 C 54 32, 59 40, 82 46 C 61 52, 55 59, 50 82 C 45 59, 39 52, 18 46 C 41 40, 46 32, 50 10 Z" strokeWidth="3" />
      <P d="M83 74 C 84 80, 86 83, 92 85 C 86 87, 84 90, 83 96 C 82 90, 80 87, 74 85 C 80 83, 82 80, 83 74 Z" strokeWidth="2.2" delay="0.35" />
    </DoodleSvg>
  )
}

/* Hand-drawn check mark. */
export function DoodleCheck({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 120 110" className={`doodle-check ${className}`}>
      <P d="M16 60 C 27 68, 35 77, 43 87 C 59 62, 78 39, 106 20" strokeWidth="7" />
    </DoodleSvg>
  )
}

/* Washi tape strip for sticky notes. Filled, fades in. */
export function DoodleTape({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 110 32" className={`doodle-tape ${className}`}>
      <path className="doodle-fill" d="M5 9 L 104 4 L 107 24 L 9 29 Z" />
      <P d="M5 9 L 104 4 M9 29 L 107 24" strokeWidth="1.4" opacity="0.5" />
    </DoodleSvg>
  )
}

/* Neural network sketch: three wobbly columns of nodes with sketchy synapses. */
export function DoodleNetwork({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 230 170" className={`doodle-network ${className}`}>
      <P d="M32 38 C 60 30, 84 34, 108 30 M32 38 C 58 52, 82 62, 108 66 M34 86 C 60 74, 84 70, 108 66 M34 86 C 60 98, 84 100, 108 104 M34 134 C 60 118, 84 108, 108 104 M34 134 C 58 138, 82 140, 108 138" strokeWidth="1.6" opacity="0.55" />
      <P d="M112 30 C 138 34, 162 48, 190 60 M112 66 C 138 66, 162 64, 190 62 M112 104 C 138 94, 162 78, 190 64 M112 138 C 138 122, 162 96, 190 66" strokeWidth="1.6" opacity="0.55" delay="0.15" />
      <C cx="32" cy="38" r="10" strokeWidth="2.6" delay="0.1" />
      <C cx="34" cy="86" r="10" strokeWidth="2.6" delay="0.2" />
      <C cx="34" cy="134" r="10" strokeWidth="2.6" delay="0.3" />
      <C cx="110" cy="30" r="10" strokeWidth="2.6" delay="0.25" />
      <C cx="110" cy="66" r="10" strokeWidth="2.6" delay="0.35" />
      <C cx="110" cy="104" r="10" strokeWidth="2.6" delay="0.45" />
      <C cx="110" cy="138" r="10" strokeWidth="2.6" delay="0.55" />
      <C cx="192" cy="62" r="12" strokeWidth="2.8" delay="0.5" />
      <P d="M196 44 C 204 34, 212 28, 220 24 M214 20 C 216 22, 219 24, 222 25 C 219 27, 216 30, 214 33" strokeWidth="2.2" delay="0.65" />
    </DoodleSvg>
  )
}

/* World-models sketch: planet with orbit ring, an isometric cube, small stars. */
export function DoodleWorld({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 230 170" className={`doodle-world ${className}`}>
      <P d="M84 52 C 60 50, 44 68, 46 90 C 48 114, 70 128, 92 124 C 114 120, 126 100, 122 78 C 118 58, 102 46, 76 50" strokeWidth="2.8" />
      <E cx="84" cy="87" rx="66" ry="20" strokeWidth="1.8" transform="rotate(-18 84 87)" opacity="0.7" delay="0.3" />
      <P d="M62 78 C 70 74, 78 80, 86 76 M70 100 C 80 95, 90 102, 100 96" strokeWidth="1.6" opacity="0.6" delay="0.2" />
      <P d="M168 62 L 196 48 L 222 62 L 194 76 Z M168 62 L 168 92 L 194 108 L 194 76 M222 62 L 222 92 L 194 108" strokeWidth="2.2" delay="0.45" />
      <P d="M150 22 C 151 28, 153 31, 159 33 C 153 35, 151 38, 150 44 C 149 38, 147 35, 141 33 C 147 31, 149 28, 150 22 Z" strokeWidth="2" delay="0.6" />
      <P d="M30 130 C 31 135, 33 138, 38 139 C 33 141, 31 144, 30 149 C 29 144, 27 141, 22 139 C 27 138, 29 135, 30 130 Z" strokeWidth="2" delay="0.7" />
    </DoodleSvg>
  )
}

/* Lab flask with liquid and bubbles. */
export function DoodleFlask({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 130 150" className={`doodle-flask ${className}`}>
      <P d="M50 12 L 50 52 M80 12 L 80 52" strokeWidth="3" />
      <P d="M42 10 C 52 8, 76 8, 88 11" strokeWidth="3" />
      <P d="M50 52 C 44 78, 30 96, 24 114 C 19 129, 30 138, 44 138 L 88 138 C 102 138, 112 129, 106 114 C 100 96, 86 78, 80 52" strokeWidth="3" delay="0.15" />
      <P d="M35 106 C 45 100, 55 110, 65 104 C 75 98, 85 108, 95 102" strokeWidth="2" opacity="0.65" delay="0.4" />
      <C cx="56" cy="120" r="3.4" strokeWidth="1.8" delay="0.55" />
      <C cx="76" cy="126" r="2.6" strokeWidth="1.8" delay="0.65" />
      <C cx="68" cy="88" r="2.2" strokeWidth="1.6" delay="0.75" />
    </DoodleSvg>
  )
}

/* Rocket. */
export function DoodleRocket({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 150 150" className={`doodle-rocket ${className}`}>
      <P d="M75 14 C 93 30, 98 62, 89 90 L 61 90 C 52 62, 57 30, 75 14 Z" strokeWidth="3" />
      <C cx="75" cy="54" r="9" strokeWidth="2.4" delay="0.3" />
      <P d="M61 90 C 51 98, 45 108, 47 119 M89 90 C 99 98, 105 108, 103 119" strokeWidth="2.6" delay="0.4" />
      <P d="M66 98 C 70 106, 68 115, 75 124 C 82 115, 80 106, 84 98" strokeWidth="2.4" delay="0.55" />
      <P d="M118 24 C 119 30, 121 33, 127 35 C 121 37, 119 40, 118 46 C 117 40, 115 37, 109 35 C 115 33, 117 30, 118 24 Z" strokeWidth="2" delay="0.7" />
    </DoodleSvg>
  )
}

/* Open book with wavy text lines. */
export function DoodleBook({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 170 130" className={`doodle-book ${className}`}>
      <P d="M85 32 C 66 21, 43 19, 22 25 L 22 102 C 43 96, 66 98, 85 109 C 104 98, 127 96, 148 102 L 148 25 C 127 19, 104 21, 85 32 Z" strokeWidth="3" />
      <P d="M85 32 L 85 109" strokeWidth="2" delay="0.25" />
      <P d="M34 44 C 46 40, 58 41, 70 46 M34 60 C 46 56, 58 57, 70 62 M34 76 C 46 72, 58 73, 70 78" strokeWidth="1.8" opacity="0.6" delay="0.4" />
      <P d="M100 46 C 112 41, 124 40, 136 44 M100 62 C 112 57, 124 56, 136 60 M100 78 C 112 73, 124 72, 136 76" strokeWidth="1.8" opacity="0.6" delay="0.55" />
    </DoodleSvg>
  )
}

/* Target with an arrow in the bullseye (mastery gate). */
export function DoodleTarget({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 150 150" className={`doodle-target ${className}`}>
      <P d="M75 22 C 45 20, 24 42, 26 72 C 28 104, 52 126, 80 124 C 108 122, 126 98, 124 70 C 122 42, 100 22, 68 25" strokeWidth="2.8" />
      <P d="M75 48 C 59 47, 48 59, 49 74 C 50 91, 64 101, 79 100 C 94 99, 103 86, 102 71 C 101 56, 89 47, 71 49" strokeWidth="2.4" delay="0.25" />
      <C cx="75" cy="74" r="8" strokeWidth="2.4" delay="0.45" />
      <P d="M122 22 C 108 36, 94 52, 81 68 M108 18 C 112 19, 118 20, 124 21 C 123 27, 122 33, 121 38" strokeWidth="2.6" delay="0.6" />
    </DoodleSvg>
  )
}

/* Two chasing arc arrows (learning loop). */
export function DoodleLoop({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 170 170" className={`doodle-loop ${className}`}>
      <P d="M85 22 C 122 24, 148 52, 146 88" strokeWidth="3" />
      <P d="M134 72 C 139 78, 143 84, 147 91 C 141 93, 134 94, 127 93" strokeWidth="3" delay="0.3" />
      <P d="M85 148 C 48 146, 22 118, 24 82" strokeWidth="3" delay="0.5" />
      <P d="M36 98 C 31 92, 27 86, 23 79 C 29 77, 36 76, 43 77" strokeWidth="3" delay="0.8" />
    </DoodleSvg>
  )
}

/* Warning triangle (misconception / pitfall). */
export function DoodleWarn({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 150 140" className={`doodle-warn ${className}`}>
      <P d="M75 16 C 55 50, 36 84, 18 114 C 52 120, 98 120, 132 114 C 114 84, 95 50, 75 16 Z" strokeWidth="3" />
      <P d="M75 52 C 74 62, 74 72, 75 82" strokeWidth="3.4" delay="0.4" />
      <C cx="75" cy="99" r="3" strokeWidth="2.6" delay="0.6" />
    </DoodleSvg>
  )
}

/* Long wobbly connector line (roadmap rail, signal map). Stretches horizontally.
   Rendered statically: core navigation lines should not animate in. */
export function DoodleRail({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 1200 40" stretch still className={`doodle-rail ${className}`}>
      <P d="M2 22 C 90 12, 190 28, 300 19 C 410 10, 520 27, 640 19 C 760 11, 890 28, 1010 18 C 1090 12, 1150 24, 1198 17" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </DoodleSvg>
  )
}

/* Small asterisk spark for section labels. */
export function DoodleSpark({ className = '' }) {
  return (
    <DoodleSvg viewBox="0 0 60 60" className={`doodle-spark ${className}`}>
      <P d="M30 8 C 30 20, 30 34, 30 52 M12 18 C 22 26, 38 34, 48 42 M48 18 C 38 26, 22 34, 12 42" strokeWidth="2.6" />
    </DoodleSvg>
  )
}
