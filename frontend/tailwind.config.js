/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0B1F2A",
        blueguard: "#16A36A",
        mint: "#E9F8F0",
        "deep-navy": "#0B2B33",
        "brand-teal": "#12545A",
        seagrass: "#3F7D5C",
        sand: "#E7DEC7",
        coral: "#C46A3F",
      },
    },
  },
  plugins: [],
};
