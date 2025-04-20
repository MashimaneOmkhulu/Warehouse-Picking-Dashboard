/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/auth', '@firebase/app']
  },
  transpilePackages: ['@firebase/storage', 'lucide-react'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle undici on the server
      config.externals = [...(config.externals || []), 'undici'];
    }
    
    // Add fallback for modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  }
};

module.exports = nextConfig; 