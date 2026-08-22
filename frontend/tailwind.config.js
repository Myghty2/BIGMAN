/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0B1F2A",
        blueguard: "#16A36A",
        mint: "#E9F8F0",
      },
    },
  },
  plugins: [],
};
