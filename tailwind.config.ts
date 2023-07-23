import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import * as daisyui from "daisyui";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {},
  },
  plugins: [typography, daisyui],
} satisfies Config;
