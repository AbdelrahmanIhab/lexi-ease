/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        lexend: ["Lexend", "sans-serif"],
        opendyslexic: ["OpenDyslexic", "sans-serif"],
        dyslexie: ["Dyslexie", "sans-serif"],
      },
      colors: {
        primary: "#5A47AB",
        danger: "#d9534f",
        warning: "#f0ad4e",
        success: "#4CAF50",
        purpleApp: "#1E0253",
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
