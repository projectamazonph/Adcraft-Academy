/**
 * Tailwind CSS v4 Configuration
 *
 * In Tailwind v4, configuration is CSS-first via @theme blocks in globals.css.
 * This file exists only for the tailwindcss-animate plugin compatibility.
 * All color, radius, and dark mode settings are in src/app/globals.css.
 *
 * DO NOT add theme.extend colors here — they will conflict with @theme inline.
 */
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [tailwindcssAnimate],
};

export default config;
