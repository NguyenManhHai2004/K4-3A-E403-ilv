import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "var(--bg-main)",
          surface: "var(--bg-surface)",
          "surface-elevated": "var(--bg-surface-elevated)",
          "surface-glass": "var(--bg-surface-glass)",
        },
        border: {
          subtle: "var(--border-subtle)",
          focus: "var(--border-focus)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        teacher: {
          DEFAULT: "var(--teacher-color)",
          light: "var(--teacher-light)",
          border: "var(--teacher-border)",
        },
        student: {
          DEFAULT: "var(--student-color)",
          light: "var(--student-light)",
          border: "var(--student-border)",
        },
        generator: {
          DEFAULT: "var(--generator-color)",
          light: "var(--generator-light)",
          border: "var(--generator-border)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      transitionProperty: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
      }
    },
  },
  plugins: [],
} satisfies Config;
