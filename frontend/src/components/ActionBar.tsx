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
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'button-danger',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  'space-between': 'justify-between',
}

export function ActionBar({ buttons, justify = 'end' }: ActionBarProps) {
  return (
    <div className={`flex gap-2 ${justifyClasses[justify]}`}>
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          disabled={button.disabled}
          className={variantClasses[button.variant || 'secondary']}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}
