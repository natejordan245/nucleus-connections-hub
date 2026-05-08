/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pdf-to-png-converter", "@napi-rs/canvas"],
  },
};

export default nextConfig;
