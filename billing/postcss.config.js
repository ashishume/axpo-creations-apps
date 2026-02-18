// Local config so root postcss.config.js (old tailwindcss plugin) isn't used.
// Tailwind is handled by @tailwindcss/vite in vite.config.ts.
export default {
  plugins: {
    autoprefixer: {},
  },
};
