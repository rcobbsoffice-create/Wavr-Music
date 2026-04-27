import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        purple: {
          50: "var(--p-50)",
          100: "var(--p-100)",
          200: "var(--p-200)",
          300: "var(--p-300)",
          400: "var(--p-400)",
          500: "var(--p-500)",
          600: "var(--p-600)",
          700: "var(--p-700)",
          800: "var(--p-800)",
          900: "var(--p-900)",
          950: "var(--p-950)",
        },
        fuchsia: {
          50: "var(--f-50)",
          100: "var(--f-100)",
          200: "var(--f-200)",
          300: "var(--f-300)",
          400: "var(--f-400)",
          500: "var(--f-500)",
          600: "var(--f-600)",
          700: "var(--f-700)",
          800: "var(--f-800)",
          900: "var(--f-900)",
          950: "var(--f-950)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
