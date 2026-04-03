import React from 'react'

type BadgeVariant =
  | 'vert'
  | 'orange'
  | 'rouge'
  | 'bleu'
  | 'jaune'
  | 'violet'
  | 'gris'

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  vert: { background: '#D8F3DC', color: '#1B4332' },
  orange: { background: '#fff4ec', color: '#c2410c' },
  rouge: { background: '#fee2e2', color: '#dc2626' },
  bleu: { background: '#dbeafe', color: '#1e40af' },
  jaune: { background: '#fef3c7', color: '#d97706' },
  violet: { background: '#ede9fe', color: '#7c3aed' },
  gris: { background: '#f3f4f6', color: '#6b7280' },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

export default function Badge({ children, variant = 'vert', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
