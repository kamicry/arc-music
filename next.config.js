/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Safari 12 compatibility - transpile to ES5
  swcMinify: true,
}

module.exports = nextConfig