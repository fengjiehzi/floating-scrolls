interface ActionButton {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  onClick: () => void
  disabled?: boolean
}

interface ActionBarProps {
  buttons: ActionButton[]
  justify?: 'start' | 'center' | 'end' | 'space-between'
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30',
  secondary: 'bg-bg-secondary border border-text-muted/30 text-text-primary hover:border-text-secondary/50',
  danger: 'bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/30',
}

export function ActionBar({ buttons, justify = 'end' }: ActionBarProps) {
  return (
    <div className={`flex gap-2 justify-${justify}`}>
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          disabled={button.disabled}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            variantClasses[button.variant || 'secondary']
          } ${button.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}
