/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react', 'framer-motion'],
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