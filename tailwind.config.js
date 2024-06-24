/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#fb842b",
      },
      backgroundImage: {
        faceBackground: "url('/src/assets/face-bg.jpg')",
      },
    },
  },
  plugins: [],
};