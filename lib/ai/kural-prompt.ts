import type { Kural } from '@/app/domain/kurals-db';

export function createKuralExplanationPrompt(kural: Kural): string {
    return `Explain Kural ${kural.number} in simple English. Include its meaning, a practical modern-day example, and one lesson I can apply today. Use this verified Tamil couplet as the source text and do not invent or alter it:\n\n${kural.kural[0]}\n${kural.kural[1]}`;
}

export function getKuralChatHref(kural: Kural): string {
    const prompt = createKuralExplanationPrompt(kural);
    return `/chat?${new URLSearchParams({ prompt }).toString()}`;
}
