module.exports = {
  content: [
    './node_modules/flowbite-react/**/*.js',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'space': "url('../public/bg.jpg')",
      },
      animation: {
        "pulse": "pulse 8s cubic-bezier(.1, 0.3, 0.5, 1) infinite"
      },
      keyframes: {
        pulse: {
          '100%': { transform: 'scale(1)', color: 'white', opacity: '100' },
          '50%': { transform: 'scale(1.4)', color: 'darkred', opacity: '100' },
          '0%': { transform: 'scale(1)', color: 'white', opacity: '100' },
        }
      }
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
}
