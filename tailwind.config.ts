import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F1C',
        panel: '#10182B',
        panelHi: '#16203A',
        line: '#22304F',
        sweep: '#5EEAD4',
        hot: '#FFB454',
        muted: '#7C8AA8',
        text: '#E7ECF7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
