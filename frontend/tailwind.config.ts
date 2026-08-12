import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1E2761",
        navyDark: "#141B4D",
        steel: "#3E5C9A",
        ice: "#CADCFC",
        iceLight: "#EEF3FC",
        teal: "#00B4A6",
      },
    },
  },
  plugins: [],
};
export default config;
