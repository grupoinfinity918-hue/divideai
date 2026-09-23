export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          neon: '#ec1c6a',
          dark: '#c4104f',
          light: '#ff8fb8',
          soft: '#fff5f8'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
