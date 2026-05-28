import { dirname } from "path";
import { fileURLToPath } from "url";
import nextConfig from "eslint-config-next";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = [
  ...nextConfig,
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  {
    ignores: [".next/"],
  },
];

export default config;
