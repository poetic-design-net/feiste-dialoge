/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Matcha palette — Material Design tokens (aligned with Stitch export)
        primary: '#536529',
        'on-primary': '#ffffff',
        'primary-container': '#94a864',
        'on-primary-container': '#2d3c03',
        'primary-fixed': '#d6eba0',
        'primary-fixed-dim': '#bacf87',
        'on-primary-fixed': '#151f00',
        'on-primary-fixed-variant': '#3c4c13',

        secondary: '#5a6245',
        'on-secondary': '#ffffff',
        'secondary-container': '#dbe4c0',
        'on-secondary-container': '#5e6649',
        'secondary-fixed': '#dee6c3',
        'secondary-fixed-dim': '#c2caa8',
        'on-secondary-fixed': '#171e08',
        'on-secondary-fixed-variant': '#424a2f',

        tertiary: '#286a4c',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#6dae8c',
        'on-tertiary-container': '#004029',
        'tertiary-fixed': '#aef1cc',
        'tertiary-fixed-dim': '#92d5b0',
        'on-tertiary-fixed': '#002113',
        'on-tertiary-fixed-variant': '#065136',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#fbfaf1',
        'on-background': '#1b1c17',
        surface: '#fbfaf1',
        'on-surface': '#1b1c17',
        'surface-variant': '#e4e3da',
        'on-surface-variant': '#45483c',
        'surface-tint': '#536529',
        'surface-dim': '#dbdad2',
        'surface-bright': '#fbfaf1',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f4eb',
        'surface-container': '#efeee5',
        'surface-container-high': '#eae8e0',
        'surface-container-highest': '#e4e3da',
        'inverse-surface': '#30312b',
        'inverse-on-surface': '#f2f1e8',
        'inverse-primary': '#bacf87',

        outline: '#76786b',
        'outline-variant': '#c6c8b8',

        // Post-it
        'postit-yellow': '#fef08a',
        'postit-yellow-deep': '#fde047',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
        headline: ['"Courier Prime"', 'ui-monospace', 'monospace'],
        mono: ['"Courier Prime"', 'ui-monospace', 'monospace'],
        marker: ['"Permanent Marker"', 'cursive'],
        handwriting: ['Caveat', 'cursive'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      backgroundImage: {
        'matcha-gradient': 'linear-gradient(135deg, #536529 0%, #94a864 100%)',
      },
      boxShadow: {
        ambient: '0 0 48px 0 rgba(27, 28, 23, 0.04)',
        postit: '2px 2px 10px rgba(0, 0, 0, 0.1)',
        'postit-lg': '15px 15px 40px -5px rgba(0, 0, 0, 0.18)',
        manuscript: '0 50px 80px -20px rgba(0, 0, 0, 0.25)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
