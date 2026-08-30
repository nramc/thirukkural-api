import { jsonSchema, tool } from 'ai';
import type { Kural } from '@/app/domain/kurals-db';
import dailyKuralService from '@/app/service/daily-kural-service';
import kuralService from '@/app/service/kural-service';
import randomKuralService from '@/app/service/random-kural-service';

const kuralIdSchema = jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
        id: { type: 'integer', minimum: 1, maximum: 1330 },
    },
    required: ['id'],
    additionalProperties: false,
});

const sectionIdSchema = jsonSchema<{ sectionId: 1 | 2 | 3 }>({
    type: 'object',
    properties: {
        sectionId: { type: 'integer', enum: [1, 2, 3] },
    },
    required: ['sectionId'],
    additionalProperties: false,
});

const chapterIdSchema = jsonSchema<{ chapterId: number }>({
    type: 'object',
    properties: {
        chapterId: { type: 'integer', minimum: 1, maximum: 133 },
    },
    required: ['chapterId'],
    additionalProperties: false,
});

const noArgumentsSchema = jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
});

function requireKural(kural: Kural | undefined, description: string) {
    if (!kural) {
        throw new Error(`${description} was not found.`);
    }

    return kural;
}

export const kuralTools = {
    getKural: tool({
        description: 'Retrieve an exact Thirukkural by its number from 1 through 1330.',
        inputSchema: kuralIdSchema,
        execute: ({ id }) => requireKural(kuralService.search(id), `Kural ${id}`),
    }),
    getDailyKural: tool({
        description: 'Retrieve the deterministic Thirukkural selected for today.',
        inputSchema: noArgumentsSchema,
        execute: () => dailyKuralService.kuralOfTheDay(),
    }),
    getRandomKural: tool({
        description: 'Retrieve a random Thirukkural from the complete collection.',
        inputSchema: noArgumentsSchema,
        execute: () => randomKuralService.getRandomKural(),
    }),
    getRandomKuralBySection: tool({
        description: 'Retrieve a random Thirukkural from a section: 1 Virtue, 2 Wealth, or 3 Love.',
        inputSchema: sectionIdSchema,
        execute: ({ sectionId }) => randomKuralService.getRandomKuralBySection(sectionId),
    }),
    getRandomKuralByChapter: tool({
        description: 'Retrieve a random Thirukkural from a chapter numbered 1 through 133.',
        inputSchema: chapterIdSchema,
        execute: ({ chapterId }) => randomKuralService.getRandomKuralByChapter(chapterId),
    }),
    getKuralByKeyword: tool({
        description: 'Retrieve Kurals that match the given keywords with pagination.',
        inputSchema: jsonSchema<{ keywords: string[]; page?: number; limit?: number }>({
            type: 'object',
            properties: {
                keywords: { type: 'array', items: { type: 'string' } },
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, default: 10 },
            },
            required: ['keywords'],
            additionalProperties: false,
        }),
        execute: ({ keywords, page, limit }) => kuralService.searchByKeyword(keywords, page, limit),
    }),
};
