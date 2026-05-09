/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Vercel runs `next build`, which by default runs `next lint` and fails
    // the build on lint errors. We rely on typecheck for correctness; lint
    // is advisory only.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-to-png-converter", "@napi-rs/canvas"],
  },
  async headers() {
    return [
      {
        // The signup widget is iframed into third-party sites (Squarespace,
        // Webflow, plain HTML). Allow any parent.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
      {
        // The loader is static and meant to be hot-linked.
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
