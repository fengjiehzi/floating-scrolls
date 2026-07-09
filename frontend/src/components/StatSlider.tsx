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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-bold text-accent-gold">{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-gold to-border-gold transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}
