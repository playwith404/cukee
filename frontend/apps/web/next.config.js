/** @type {import('next').NextConfig} */
const nextConfig = {
  //선장님 요구사항
  output: "standalone",
  transpilePackages: ["@repo/ui"],
  images: {
    remotePatterns: [
      // 개발 환경: localhost
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      // 배포 환경: production domain
      {
        protocol: 'https',
        hostname: 'cloudkakao.store',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${INTERNAL_API_URL}/api/:path`,
      },
    ];
  },
};


module.exports = nextConfig;