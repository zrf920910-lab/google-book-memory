import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '绘本伴读 Book Memory',
    short_name: '绘本伴读',
    description: '记录孩子成长声音的数字绘本相册',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8f5',
    theme_color: '#faf8f5',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}