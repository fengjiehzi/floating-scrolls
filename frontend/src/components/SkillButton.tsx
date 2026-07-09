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
  attack: 'from-red-600 to-red-800 hover:from-red-500 hover:to-red-700',
  defense: 'from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700',
  heal: 'from-green-600 to-green-800 hover:from-green-500 hover:to-green-700',
  buff: 'from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700',
  debuff: 'from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700',
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
      className={`relative px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 transform ${
        isDisabled
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed scale-100'
          : `bg-gradient-to-r ${skillTypeColors[skill.type]} text-white hover:scale-105 active:scale-95`
      }`}
    >
      {isOnCooldown || cooldown > 0 ? (
        <>
          <span className="relative z-10">{cooldown}</span>
          <div
            className="absolute inset-0 bg-black/60 rounded-lg"
            style={{
              clipPath: `inset(${((skill.cooldown - cooldown) / skill.cooldown) * 100}% 0 0 0)`,
            }}
          />
        </>
      ) : (
        <span>{skill.name}</span>
      )}
      <span className="block text-xs opacity-70">{skill.damage} 伤害</span>
    </button>
  )
}
