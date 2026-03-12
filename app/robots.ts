import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/'], // Blocks hackers from indexing secret panels
    },
    sitemap: 'https://clawlink.com/sitemap.xml',
  }
}