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
    
    // Ensure lucide-react is properly resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react'),
    };
    
    return config;
  }
};

module.exports = nextConfig; 