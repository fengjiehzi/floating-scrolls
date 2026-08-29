interface ScrollBackgroundProps {
  scrollX: number
}

export function ScrollBackground({ scrollX }: ScrollBackgroundProps) {
  return (
    <>
      <div
        className="chronicles-map-backdrop"
        style={{ transform: `translate3d(${scrollX * 0.15}px, 0, 0)` }}
      />

      <div
        className="chronicles-mountain-layer"
        style={{ transform: `translate3d(${scrollX * 0.35}px, 0, 0)` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1600 600" preserveAspectRatio="none">
          <path d="M0 454 C120 394 188 420 276 348 C364 276 452 410 560 326 C680 232 738 376 850 302 C956 230 1050 364 1164 292 C1290 214 1378 348 1600 246 L1600 600 L0 600 Z" />
          <path d="M0 516 C166 432 310 510 442 416 C564 330 686 470 816 390 C968 296 1088 448 1216 364 C1360 270 1470 386 1600 340 L1600 600 L0 600 Z" />
          <path className="chronicles-cloud-stroke" d="M70 178 C150 130 222 214 300 164 C374 118 430 188 500 154 M1034 166 C1110 112 1178 198 1246 156 C1314 114 1388 184 1488 132" />
        </svg>
      </div>

      <div
        className="chronicles-map-grid"
        style={{ transform: `translate3d(${scrollX * 0.6}px, 0, 0)` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1600 600" preserveAspectRatio="none">
          <g className="chronicles-celestial-lines">
            <ellipse cx="1370" cy="116" rx="190" ry="82" />
            <ellipse cx="1370" cy="116" rx="130" ry="54" />
            <path d="M1170 40 L1560 194 M1210 206 L1518 20 M1284 14 L1450 220" />
            <circle cx="1370" cy="116" r="18" />
            <circle cx="214" cy="488" r="94" />
            <circle cx="214" cy="488" r="64" />
            <path d="M120 488 H308 M214 394 V582 M148 422 L280 554 M146 554 L282 420" />
          </g>
          <g className="chronicles-cartography-lines">
            <path d="M0 126 C280 94 434 140 688 108 C964 74 1214 126 1600 72" />
            <path d="M0 520 C260 482 528 536 790 490 C1094 436 1320 510 1600 454" />
            <path d="M334 0 C298 168 376 316 318 600 M806 0 C742 184 842 370 780 600 M1198 0 C1136 160 1238 370 1180 600" />
          </g>
        </svg>
      </div>
    </>
  )
}
