/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🛑 1. Hide Source Code in Browser Inspect Element
  productionBrowserSourceMaps: false, 

  // 🛑 2. Remove all console.logs in Production (So hackers can't see your logic data)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // 🛑 3. Iron-Clad Security Headers
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
        ],
      },
    ];
  },
};

export default nextConfig;