/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        "muted-background": "var(--muted-background)",
        "card-background": "var(--card-background)",
        border: "var(--border)",
        "text-muted": "var(--text-muted)",
        "light-yellow": "var(--light-yellow)",
      },
    },
  },
  plugins: [],
};
