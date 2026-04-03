import React from 'react'

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  variant?: 'vert' | 'orange' | 'bleu' | 'violet'
}

const variantColors: Record<string, { icon: string; border: string; bg: string }> = {
  vert: { icon: '#D8F3DC', border: '#D8F3DC', bg: '#f0faf3' },
  orange: { icon: '#fff4ec', border: '#fed7aa', bg: '#fff4ec' },
  bleu: { icon: '#dbeafe', border: '#bfdbfe', bg: '#eff6ff' },
  violet: { icon: '#ede9fe', border: '#ddd6fe', bg: '#f5f3ff' },
}

export default function StatCard({ icon, label, value, sub, variant = 'vert' }: StatCardProps) {
  const colors = variantColors[variant]

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          background: colors.icon,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 22,
            fontWeight: 500,
            color: '#0d1f16',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 1 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}
