/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Microsoft YaHei", "sans-serif"]
      },
      colors: {
        page: "var(--bg-base)",
        card: "var(--bg-card)",
        surface: "var(--bg-surface)",
        "surface-hover": "var(--bg-surface-hover)",
        "surface-active": "var(--bg-surface-active)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        subtle: "var(--border-subtle)"
      },
      boxShadow: {
        soft: "var(--shadow-card)"
      }
    }
  },
  plugins: []
};
