import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pronto para Supabase storage de imagens quando migrar
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Necessário para Capacitor (mobile)
  // output: 'export', // Descomente ao empacotar para mobile
}

export default nextConfig
