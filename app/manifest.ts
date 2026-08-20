import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindstate',
    short_name: 'Mindstate',
    description: 'Private memory infrastructure for AI agents.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c1c27',
    theme_color: '#1c1c27',
    icons: [
      {
        src: '/mindstate-icon-source.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
