interface StatSliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  unit?: string
}

export function StatSlider({ label, value, min, max, onChange, unit = '' }: StatSliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <label className="stat-slider">
      <div className="stat-slider-label">
        <span>{label}</span>
        <strong>{value}{unit}</strong>
      </div>
      <div className="stat-slider-track" style={{ '--slider-progress': `${percent}%` } as React.CSSProperties}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </label>
  )
}
