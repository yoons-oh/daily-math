import React from 'react'
import { motion } from 'framer-motion'

interface Props {
  value: string
  onChange: (val: string) => void
  maxLength?: number
  onSubmit: () => void
  disabled?: boolean
}

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['⌫', '0', '✓'],
]

export default function NumPad({ value, onChange, maxLength = 4, onSubmit, disabled }: Props) {
  function handleKey(k: string) {
    if (disabled) return
    if (k === '⌫') {
      onChange(value.slice(0, -1))
    } else if (k === '✓') {
      if (value.length > 0) onSubmit()
    } else {
      if (value.length >= maxLength) return
      if (value === '0') onChange(k)
      else onChange(value + k)
    }
  }

  return (
    <div className="w-full px-2">
      <div className="grid grid-cols-3 gap-3">
        {KEYS.flat().map((k, i) => {
          const isConfirm = k === '✓'
          const isDelete  = k === '⌫'
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleKey(k)}
              disabled={disabled || (isConfirm && value.length === 0)}
              style={{
                height: 72,
                fontSize: isConfirm ? '1.8rem' : '2rem',
                fontWeight: 900,
                borderRadius: 20,
                border: isDelete ? '2px solid #FFB3B3' : isConfirm ? 'none' : '2px solid #E8F8F0',
                background: isConfirm ? '#5CC8A0' : isDelete ? '#FFD6D6' : '#fff',
                color: isConfirm ? '#fff' : isDelete ? '#FF7676' : '#3A3A3A',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'opacity .15s',
                opacity: (disabled || (isConfirm && value.length === 0)) ? 0.4 : 1,
              }}
            >
              {k}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
