import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { DigitStroke, recognizeDigit } from '../lib/digitRecognizer'
import { useI18n } from '../i18n'

const RECOGNITION_DELAY_MS = 650

interface Props {
  activeLabel: string
  value: string
  disabled?: boolean
  onRecognized: (digit: string) => void
  onClearDigit: () => void
  canSubmit?: boolean
  onSubmit?: () => void
}

export default function HandwritingDigitInput({
  activeLabel,
  value,
  disabled,
  onRecognized,
  onClearDigit,
  canSubmit,
  onSubmit,
}: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const strokesRef = useRef<DigitStroke[]>([])
  const currentStrokeRef = useRef<DigitStroke>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [prediction, setPrediction] = useState(value)
  const [status, setStatus] = useState(value ? t('handwriting.recognized', { digit: value }) : t('handwriting.writeNumber'))

  useEffect(() => {
    clearCanvas()
    setPrediction(value)
    setStatus(value ? t('handwriting.recognized', { digit: value }) : t('handwriting.writeNumber'))
  }, [activeLabel, t, value])

  useEffect(() => {
    setPrediction(value)
  }, [value])

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function getContext() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#2D2D3A'
    ctx.lineWidth = 13
    return ctx
  }

  function scheduleRecognition() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const canvas = canvasRef.current
      if (!canvas || disabled) return
      setStatus(t('handwriting.recognizing'))
      const result = await recognizeDigit(canvas, strokesRef.current)
      if (!result) {
        setStatus(t('handwriting.tryAgain'))
        return
      }
      setPrediction(result.digit)
      setStatus(result.source === 'model' ? t('handwriting.recognized', { digit: result.digit }) : t('handwriting.guessed', { digit: result.digit }))
      onRecognized(result.digit)
    }, RECOGNITION_DELAY_MS)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    const point = getPoint(event)
    lastPointRef.current = point
    currentStrokeRef.current = [point]
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    setStatus(t('handwriting.writing'))
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return
    const ctx = getContext()
    if (!ctx) return
    const point = getPoint(event)
    const last = lastPointRef.current ?? point
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    currentStrokeRef.current.push(point)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (canvas) canvas.releasePointerCapture(event.pointerId)
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current.push(currentStrokeRef.current)
    }
    currentStrokeRef.current = []
    drawingRef.current = false
    lastPointRef.current = null
    scheduleRecognition()
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokesRef.current = []
    currentStrokeRef.current = []
  }

  function handleClearDigit() {
    clearCanvas()
    setPrediction('')
    setStatus(t('handwriting.writeNumber'))
    onClearDigit()
  }

  return (
    <div style={{ display: 'grid', gap: 8, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#7A7A9A' }}>{activeLabel}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#2D2D3A' }}>{status}</div>
        </div>
        <div style={{
          minWidth: 50, height: 50, borderRadius: 14,
          background: 'rgba(92,200,160,0.12)', color: '#31A77E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 900,
          border: '2px solid rgba(92,200,160,0.28)',
        }}>
          {prediction || value || '-'}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={170}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          height: 170,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.92)',
          border: '3px dashed rgba(92,200,160,0.45)',
          touchAction: 'none',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 6px 18px rgba(0,0,0,0.06)',
          opacity: disabled ? 0.5 : 1,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.96, y: 2 }}
          type="button"
          onClick={handleClearDigit}
          disabled={disabled}
          style={buttonStyle('#FFC7D9', '#FF99BB', '#7A1040')}
        >
          {t('practice.clear')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96, y: 2 }}
          type="button"
          onClick={() => {
            if (!disabled && canSubmit) onSubmit?.()
          }}
          aria-disabled={disabled || !canSubmit}
          style={{
            ...buttonStyle('#62D6B2', '#3EC99A', '#fff'),
            opacity: canSubmit ? 1 : 0.45,
            cursor: canSubmit ? 'pointer' : 'default',
          }}
        >
          {t('practice.submitAnswer')}
        </motion.button>
      </div>
    </div>
  )
}

function buttonStyle(from: string, to: string, color: string): React.CSSProperties {
  return {
    height: 48,
    borderRadius: 16,
    border: 'none',
    background: `linear-gradient(135deg,${from},${to})`,
    color,
    fontWeight: 900,
    fontSize: '0.9rem',
    boxShadow: '0 4px 0 rgba(70,70,100,0.18), 0 5px 12px rgba(0,0,0,0.08)',
    touchAction: 'manipulation',
  }
}
