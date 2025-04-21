/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react', 'framer-motion'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle undici on the server
      config.externals = [...(config.externals || []), 'undici'];
      
      // Add Firebase packages as external
      config.externals.push('firebase', '@firebase/auth', '@firebase/app');
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