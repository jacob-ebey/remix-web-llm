import type { Config } from "tailwindcss";

import * as daisyui from "daisyui";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
} satisfies Config;
