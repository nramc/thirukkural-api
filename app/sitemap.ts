import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tamil-kural-api.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: siteUrl,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${siteUrl}/chat`,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${siteUrl}/openapi/swagger-ui.html`,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];
}
