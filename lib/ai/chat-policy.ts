import type { UIMessage } from 'ai';

export const MAX_MESSAGES = 100;
export const MAX_MESSAGE_LENGTH = 12_000;
export const MAX_TOTAL_MESSAGE_LENGTH = 120_000;

export const SYSTEM_INSTRUCTIONS = `You are Valluvar AI, a thoughtful guide to the Thirukkural.
Answer clearly and respectfully. When a question concerns the Thirukkural, prefer accurate, concise explanations and do not invent couplet numbers, quotations, translations, or sources. If you are uncertain, say so. Do not claim to have performed actions or accessed information that you have not actually accessed.`;

type ChatInput = {
    id?: unknown;
    role?: unknown;
    content?: unknown;
    parts?: unknown;
};

type TextPart = {
    type: 'text';
    text: string;
};

function isTextPart(value: unknown): value is TextPart {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const part = value as Record<string, unknown>;
    return part.type === 'text' && typeof part.text === 'string' && part.text.trim().length > 0;
}

function normalizeMessage(entry: unknown, index: number): UIMessage | null {
    if (typeof entry !== 'object' || entry === null) {
        return null;
    }

    const input = entry as ChatInput;
    if (input.role !== 'user' && input.role !== 'assistant') {
        return null;
    }

    const textParts = Array.isArray(input.parts) ? input.parts.filter(isTextPart) : [];
    if (textParts.length === 0 && typeof input.content === 'string' && input.content.trim().length > 0) {
        textParts.push({ type: 'text', text: input.content });
    }
    const textLength = textParts.reduce((length, part) => length + part.text.length, 0);
    if ((input.role === 'user' && textParts.length === 0) || textLength > MAX_MESSAGE_LENGTH) {
        return null;
    }

    return {
        id: typeof input.id === 'string' && input.id.length > 0 ? input.id : `message-${index}`,
        role: input.role,
        parts: textParts,
    };
}

export async function normalizeMessages(value: unknown): Promise<UIMessage[] | null> {
    if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
        return null;
    }

    const messages: UIMessage[] = [];
    let totalLength = 0;

    for (const [index, entry] of value.entries()) {
        const message = normalizeMessage(entry, index);
        if (!message) {
            continue;
        }

        totalLength += message.parts.reduce((length, part) => (part.type === 'text' ? length + part.text.length : length), 0);
        if (totalLength > MAX_TOTAL_MESSAGE_LENGTH) {
            return null;
        }

        const previous = messages.at(-1);
        if (previous?.role === message.role) {
            previous.parts.push(...message.parts);
        } else if (message.parts.length > 0) {
            messages.push(message);
        }
    }

    if (messages[0]?.role !== 'user') {
        return null;
    }

    for (let index = 1; index < messages.length; index += 1) {
        if (messages[index]?.role === messages[index - 1]?.role) {
            return null;
        }
    }

    return messages;
}

export function getAllowedModels() {
    return new Set(
        (process.env.LLM_ALLOWED_MODELS ?? '')
            .split(',')
            .map((model) => model.trim())
            .filter(Boolean),
    );
}

export function isModelAllowed(model: string) {
    const allowedModels = getAllowedModels();
    return allowedModels.size === 0 || allowedModels.has(model);
}


