/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Strict Tend Health palette — zero #FFFFFF and zero #000000
        canvas: {
          DEFAULT: '#F6F5F0',
          subtle: '#F1EFE8',
          card: '#ECEAE2',
          hover: '#E4E1D7',
          hoverAlt: '#E2DFD5',
          divider: '#D6D3C8',
        },
        ink: {
          DEFAULT: '#2D312B',
          hover: '#3D4239',
          secondary: '#454A42',
          muted: '#5F6459',
          sage: '#3E4538',
          sageStrong: '#4F6340',
          optimal: '#45573A',
        },
        sage: {
          soft: '#DCE3D2',
          light: '#CBD3BF',
          well: '#C9D3BB',
          water: '#C7D0B9',
          DEFAULT: '#B5C2A3',
          hover: '#A7B693',
          mid: '#99AA84',
          line: '#7E8F6A',
          deep: '#6F7A63',
        },
        sand: {
          DEFAULT: '#D6CDB8',
          low: '#E9DCC3',
          pill: '#F1E4C6',
          dot: '#D9B66E',
          ink: '#7D5A1C',
        },
        terracotta: {
          high: '#E9CFC2',
          pill: '#EED6CB',
          dot: '#C98468',
          ink: '#8E4430',
        },
      },
      borderRadius: {
        card: '20px',
        inner: '16px',
        nav: '24px',
        btn: '14px',
        chip: '18px',
      },
      screens: {
        wide: '880px',
      },
    },
  },
  plugins: [],
};
