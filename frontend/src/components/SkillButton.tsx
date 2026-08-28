import { useEffect, useState } from 'react'
import type { Skill } from '@/types'

interface SkillButtonProps {
  skill: Skill
  onClick?: () => void
  disabled?: boolean
  isOnCooldown?: boolean
  cooldownRemaining?: number
}

const skillTypeColors = {
  attack: 'skill-attack',
  defense: 'skill-defense',
  heal: 'skill-heal',
  buff: 'skill-buff',
  debuff: 'skill-debuff',
}

export function SkillButton({ skill, onClick, disabled, isOnCooldown, cooldownRemaining }: SkillButtonProps) {
  const [cooldown, setCooldown] = useState(cooldownRemaining || 0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const isDisabled = disabled || isOnCooldown || cooldown > 0

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`skill-button ${skillTypeColors[skill.type]}`}
    >
      {isOnCooldown || cooldown > 0 ? (
        <>
          <span className="skill-button-label">冷却 {cooldown}</span>
          <div
            className="skill-cooldown"
            style={{
              clipPath: `inset(${((skill.cooldown - cooldown) / skill.cooldown) * 100}% 0 0 0)`,
            }}
          />
        </>
      ) : (
        <span className="skill-button-label">{skill.name}</span>
      )}
      <span className="skill-button-meta">{skill.damage > 0 ? `${skill.damage} 伤害` : skill.description}</span>
    </button>
  )
}
