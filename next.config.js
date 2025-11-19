/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ INTE output:'export' här – annars dör alla API-routes
  // output: 'export', // ← ska INTE finnas

  images: {
    remotePatterns: [
      // demo/placeholder
      { protocol: 'https', hostname: 'images.unsplash.com' },

      // dina domäner
      { protocol: 'https', hostname: 'login.helsingbuss.se' },
      { protocol: 'https', hostname: 'kund.helsingbuss.se' },

      // din Supabase-domän (byt till din faktiska om den skiljer sig)
      { protocol: 'https', hostname: 'meotcdztoehulrirqzxn.supabase.co' },

      // t.ex. Google-avatarer
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async rewrites() {
    return [
      // serva widget-assets via din app
      { source: '/widget/:path*', destination: 'https://login.helsingbuss.se/widget/:path*' },

      // Exempel (lämna av om kund ligger som eget projekt):
      // { source: '/offert/:path*', destination: 'https://kund.helsingbuss.se/offert/:path*' },
    ];
  },

  async headers() {
    return [
      {
        source: '/widget/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=600, stale-while-revalidate=1200' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
