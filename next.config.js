/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase', '@firebase/auth', '@firebase/app']
  },
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app', '@firebase/storage', 'undici']
};

module.exports = nextConfig; 