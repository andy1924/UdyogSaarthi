const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#DFECC6',
          100: 'rgba(223, 236, 198, 0.33)',
          400: '#8E9C78',
          800: '#485C11',
        },
        neutral: {
          750: '#6F6F6F',
        }
      },
      fontFamily: {
        crimson: ['"Crimson Text"', 'serif'],
        dm: ['"DM Sans"', 'sans-serif'],
        roboto: ['"Roboto"', 'sans-serif'],
        'roboto-mono': ['"Roboto Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '30px',
        '5xl': '43px',
      }
    }
  },
  plugins: [],
};
