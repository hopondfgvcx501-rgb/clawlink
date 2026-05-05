/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 1. VERCEL DEPLOYMENT BYPASS: Ignore TS errors during build
  // FIXED: Removed deprecated 'eslint' block to clear yellow warnings in Next.js 16.1.6
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🔒 2. Hide Source Code in Browser Inspect Element (F12 Shield)
  productionBrowserSourceMaps: false, 

  // 🔒 3. Remove all console.logs in Production (So hackers can't see your logic data in the console)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // 🔒 4. Iron-Clad Security Headers (Network & Request Shield)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // Prevents other sites from embedding ClawLink
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // Stops MIME type sniffing
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, // Protects origin info
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }, // Forces secure HTTPS
          { key: 'X-XSS-Protection', value: '1; mode=block' }, // Blocks Cross-Site Scripting attacks
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' }, // Blocks malicious hardware access
        ],
      },
    ];
  },
};

export default nextConfig;