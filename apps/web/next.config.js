/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@serviceflow/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
