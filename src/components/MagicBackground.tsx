import React from 'react'

// 배경 장식 오브, 별, 숫자 파티클
// 하드코딩 없이 시드 기반으로 생성 → 항상 동일한 위치 유지
const ORBS = [
  { x: '80%', y: '5%',  size: 220, color: '#A8D8FF', opacity: 0.45 },
  { x: '-5%', y: '30%', size: 180, color: '#62D6B2', opacity: 0.3  },
  { x: '70%', y: '55%', size: 160, color: '#C9B6FF', opacity: 0.35 },
  { x: '10%', y: '75%', size: 140, color: '#FFE58F', opacity: 0.3  },
  { x: '50%', y: '88%', size: 120, color: '#FFC7D9', opacity: 0.3  },
]

// 배경에 뿌려지는 작은 별/숫자 장식
const PARTICLES = [
  { x: '15%', y: '8%',  symbol: '✦', size: '1rem',  color: '#62D6B2', delay: 0   },
  { x: '75%', y: '12%', symbol: '✦', size: '0.7rem', color: '#C9B6FF', delay: 0.5 },
  { x: '88%', y: '35%', symbol: '+', size: '1.1rem', color: '#A8D8FF', delay: 1   },
  { x: '5%',  y: '45%', symbol: '✦', size: '0.8rem', color: '#FFE58F', delay: 1.5 },
  { x: '60%', y: '70%', symbol: '−', size: '1.2rem', color: '#C9B6FF', delay: 0.8 },
  { x: '25%', y: '85%', symbol: '✦', size: '0.6rem', color: '#FFC7D9', delay: 0.3 },
  { x: '90%', y: '80%', symbol: '+', size: '0.9rem', color: '#62D6B2', delay: 1.2 },
  { x: '40%', y: '18%', symbol: '✦', size: '0.75rem',color: '#FFE58F', delay: 0.7 },
  { x: '55%', y: '42%', symbol: '✦', size: '0.65rem',color: '#A8D8FF', delay: 1.8 },
  { x: '78%', y: '92%', symbol: '✦', size: '0.8rem', color: '#C9B6FF', delay: 0.4 },
]

export default function MagicBackground() {
  return (
    <div className="magic-bg-deco" aria-hidden="true">
      {/* 흐릿한 원형 빛 오브 */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="magic-orb"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            opacity: orb.opacity,
          }}
        />
      ))}

      {/* 반짝이는 별 · 숫자 파티클 */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            fontSize: p.size,
            color: p.color,
            fontWeight: 900,
            opacity: 0.55,
            animation: `sparkle ${2 + (i % 3) * 0.7}s ease-in-out ${p.delay}s infinite`,
            userSelect: 'none',
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  )
}
