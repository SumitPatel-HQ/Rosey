import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Only build standalone output for production (Docker). Skipping it in dev
  // avoids the extra file-copy work that slows down the initial compile.
  output: isDev ? undefined : "standalone",

  // Prevent these heavy packages from being bundled by webpack on every
  // server-component render. They run natively in the Node.js process instead,
  // which is much faster and avoids repeated re-compilation.
  serverExternalPackages: ["sharp", "gsap"],

  // Tree-shake large icon / component packages at import time so only the
  // icons/components actually used are included in the bundle.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
    ],
  },
};

export default nextConfig;
