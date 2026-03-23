import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // 🛑 LAYER 1: BLOCK ALL MAJOR AI SCRAPERS & BOTS (No Code/Roadmap Stealing)
        userAgent: ['GPTBot', 'ChatGPT-User', 'Anthropic-ai', 'Google-Extended', 'CCBot', 'omgili'],
        disallow: ['/'], // Banned from accessing anything
      },
      {
        // 🛑 LAYER 2: REGULAR SEARCH ENGINES (Google, Bing)
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/'], // Blocks hackers from indexing secret panels
      }
    ],
    sitemap: 'https://clawlink.com/sitemap.xml',
  }
}