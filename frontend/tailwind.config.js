/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Kullanici istegi: kurumsal/profesyonel bir stil - YouHaveMi'nin
      // oyuncu mint/sky paletinden farkli, koyu lacivert + gri agirlikli.
      colors: {
        ink: "#0F172A",
        slateBg: "#F8FAFC",
        accent: "#2563EB",
      },
    },
  },
  plugins: [],
};
