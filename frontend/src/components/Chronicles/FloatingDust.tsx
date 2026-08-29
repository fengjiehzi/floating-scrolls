import { useMemo } from 'react'

export function FloatingDust() {
  const particles = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: `${(i * 3.14 * 17) % 100}%`,
      top: `${(i * 2.71 * 23) % 100}%`,
      size: (i % 3) + 1.5,
      opacity: 0.08 + (i % 5) * 0.03,
      duration: 12 + (i % 8) * 3,
      delay: (i % 6) * 1.5,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-amber-300"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            boxShadow: '0 0 6px rgba(241, 194, 88, 0.6)',
            animation: `float-dust ${p.duration}s ease-in-out infinite alternate`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
