/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        112: "28rem",
        120: "30rem",
        128: "32rem",
        136: "34rem",
        144: "36rem",
        160: "40rem",
        172: "44rem",
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-in-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontFamily: {
        archivo: ["Archivo", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        mPlus: ["M PLUS Rounded 1c", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss")],
};
