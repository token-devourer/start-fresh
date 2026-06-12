import type { NextConfig } from "next";
import { createRequire } from "node:module";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const require = createRequire(import.meta.url);
const nextPackageDir = path.dirname(require.resolve("next/package.json"));
const turbopackRoot = path.dirname(path.dirname(nextPackageDir));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot
  },
  transpilePackages: ["@kartu-satu/shared"]
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
