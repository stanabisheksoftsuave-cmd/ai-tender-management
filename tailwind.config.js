/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-light': 'var(--color-primary-light)',
        accent: 'var(--color-accent)',
        surface: 'var(--color-surface)',
        background: 'var(--color-background)',
        sidebar: 'var(--color-sidebar)',
        'sidebar-text': 'var(--color-sidebar-text)',
      },
    },
  },
  plugins: [],
}
