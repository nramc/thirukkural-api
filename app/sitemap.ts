import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kural.codewithram.dev';
const maxKuralNumber = 1330;
const maxChapterNumber = 133;

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${siteUrl}/`,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${siteUrl}/chat`,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${siteUrl}/browse`,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/openapi/swagger-ui.html`,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];

    const kuralPages: MetadataRoute.Sitemap = Array.from({ length: maxKuralNumber }, (_, index) => ({
        url: `${siteUrl}/kural/${index + 1}`,
        changeFrequency: 'yearly' as const,
        priority: 0.7,
    }));

    const chapterPages: MetadataRoute.Sitemap = Array.from({ length: maxChapterNumber }, (_, index) => ({
        url: `${siteUrl}/chapters/${index + 1}`,
        changeFrequency: 'yearly' as const,
        priority: 0.8,
    }));

    return [...staticPages, ...chapterPages, ...kuralPages];
}
