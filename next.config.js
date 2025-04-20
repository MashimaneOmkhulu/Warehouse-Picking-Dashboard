/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/auth', '@firebase/app']
  },
  webpack: (config) => {
    // Fixes error with private fields in undici library
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/undici/,
      use: { loader: 'next-babel-loader' }
    });
    return config;
  }
};

module.exports = nextConfig; 