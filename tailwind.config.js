/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        beige: '#F5F1E8',
        olive: {
          DEFAULT: '#636550',
          dark: '#4A4A3F',
        },
        teal: '#3F7D7C',
        coral: '#D4786A',
        yellow: '#EEC154',
      },
    },
  },
  plugins: [],
};
