import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vert: '#1B4332',
        'vert-moyen': '#40916C',
        'vert-clair': '#D8F3DC',
        'vert-pale': '#f0faf3',
        orange: '#F4A261',
        'orange-clair': '#fff4ec',
        noir: '#0d1f16',
        gris: '#6b7280',
        'gris-clair': '#f3f4f6',
        blanc: '#ffffff',
        bordure: '#d1fae5',
        rouge: '#dc2626',
        'rouge-clair': '#fee2e2',
        bleu: '#1e40af',
        'bleu-clair': '#dbeafe',
        jaune: '#d97706',
        'jaune-clair': '#fef3c7',
        violet: '#7c3aed',
        'violet-clair': '#ede9fe',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        sans: ['Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
