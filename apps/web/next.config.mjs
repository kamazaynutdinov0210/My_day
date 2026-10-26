/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript sources.
  transpilePackages: ["@my-day/types", "@my-day/api-client", "@my-day/ui"],

  // The shared packages import their own files as "./x.js" (TypeScript ESM style) while the
  // sources are .ts/.tsx, so webpack must try the TypeScript extensions first.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },

  // Same-origin /api keeps the HTTP-only session cookie off any cross-site path (no CORS, no tokens in JS).
  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};
export default nextConfig;