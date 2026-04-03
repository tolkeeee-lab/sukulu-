import React from 'react'

type ButtonVariant = 'primary' | 'outline' | 'danger'

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#1B4332',
    color: '#ffffff',
    border: '1px solid #1B4332',
  },
  outline: {
    background: 'transparent',
    color: '#1B4332',
    border: '1px solid #1B4332',
  },
  danger: {
    background: '#dc2626',
    color: '#ffffff',
    border: '1px solid #dc2626',
  },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: React.ReactNode
}

export default function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 16px',
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        fontFamily: 'inherit',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
