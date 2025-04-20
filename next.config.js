/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/auth', '@firebase/app']
  },
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app', '@firebase/storage'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle undici on the server
      config.externals = [...(config.externals || []), 'undici'];
    }
    return config;
  }
};

module.exports = nextConfig; 