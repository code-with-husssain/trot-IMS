/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8361', // rgb(255, 131, 97)
          50: '#FFF1EC',
          100: '#FFE2D8',
          200: '#FFC8B5',
          300: '#FFAB8E',
          400: '#FF9778',
          500: '#FF8361',
          600: '#F2643C',
          700: '#D44A24',
          800: '#A8381B',
          900: '#7C2914',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
