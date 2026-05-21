/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'surface-white': '#ffffff',
        'canvas-sand': '#eeefe9',
        'pale-granite': '#e5e7e0',
        'ink-black': '#000000',
        'charcoal-black': '#111827',
        'graphite-grey': '#374151',
        'faded-grey': '#4d4f46',
        'ash-grey': '#65675e',
        'warm-gray-tint': '#e1d7c2',
        'sky-blue': '#2f80fa',
        'marigold-yellow': '#f1a82c',
        'sunset-orange': '#eb9d2a',
        'vivid-green': '#6aa84f',
      },
      spacing: {
        '4': '4px',
        '5': '5px',
        '6': '6px',
        '8': '8px',
        '9': '9px',
        '10': '10px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '17': '17px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '34': '34px',
        '48': '48px',
        '64': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'full': '9999px',
      },
      boxShadow: {
        'xl': 'rgba(0, 0, 0, 0.25) 0px 25px 50px -12px',
      },
      letterSpacing: {
        'tight': '-0.025em',
      },
    },
  },
  plugins: [],
}
