import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        card: "#1a1a1a",
        border: "#2a2a2a",
        accent: "#22c55e"
      }
    }
  },
  darkMode: "class",
  plugins: []
};

export default config;