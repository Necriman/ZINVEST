/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        // Near-black navy scale used as the app canvas.
        night: {
          950: '#030509',
          900: '#070B14',
          850: '#0A101D',
          800: '#0D1526',
        },
      },
      boxShadow: {
        card: '0 8px 32px rgba(2, 6, 23, 0.45)',
        glow: '0 0 40px -12px rgba(99, 102, 241, 0.5)',
      },
    },
  },
  plugins: [],
};
