/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🛑 1. Hide Code Structure in Inspect Element
  productionBrowserSourceMaps: false, 

  // 🛑 2. Iron-Clad Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // Clickjacking prevention (koi dusri site me aapki site embed nahi kar sakta)
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // MIME type sniffing prevention
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, // Protect origin info
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }, // Force HTTPS
          { key: 'X-XSS-Protection', value: '1; mode=block' }, // Block Cross-Site Scripting
        ],
      },
    ];
  },
};

export default nextConfig;