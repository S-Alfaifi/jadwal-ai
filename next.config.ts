import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: false,
  },
  experimental: {
    allowedDevOrigins: [
        '*.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev'
    ]
  }
};

export default nextConfig;
