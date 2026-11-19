import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every app route reads the session cookie, so pages render per request.
  // Cache Components stays off: there is no static shell worth prerendering.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
