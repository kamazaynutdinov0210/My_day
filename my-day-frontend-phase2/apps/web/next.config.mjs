/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript sources.
  transpilePackages: ["@my-day/types", "@my-day/api-client", "@my-day/ui"],
  // Same-origin /api keeps the HTTP-only session cookie off any cross-site path (no CORS, no tokens in JS).
  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};
export default nextConfig;
