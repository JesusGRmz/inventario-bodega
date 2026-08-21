import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        bg: '#0f1720',
        panel: '#16202b',
        'panel-2': '#1c2933',
        line: '#26333e',
        ink: '#e6edf3',
        'ink-dim': '#8fa1ae',
        accent: '#5fd0c5',
        'accent-dim': '#3a8f86',
        warn: '#e0a040',
        danger: '#e0616e'
      }
    }
  },
  daisyui: {
    themes: false, // usamos nuestra propia paleta, no los temas predefinidos de daisyUI
    base: false,
    utils: true,
    logs: false
  },
  plugins: [daisyui]
};
