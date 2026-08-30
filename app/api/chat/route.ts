import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai';

export const runtime = 'nodejs';

const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 12_000;

type ChatInput = {
    id?: unknown;
    role?: unknown;
    content?: unknown;
    parts?: unknown;
};

function getProvider() {
    const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
    if (!provider) {
        throw new Error('LLM_PROVIDER is missing. Set it to "ollama" or "openrouter".');
    }
    if (provider !== 'ollama' && provider !== 'openrouter') {
        throw new Error(`Unsupported LLM_PROVIDER "${provider}". Use "ollama" or "openrouter".`);
    }
    return provider;
}

function getModel() {
    const model = process.env.LLM_MODEL?.trim();
    if (!model) {
        throw new Error('LLM_MODEL is missing. Set it to a model installed in Ollama or available in OpenRouter.');
    }
    return model;
}

function getTextContent(input: ChatInput) {
    if (typeof input.content === 'string') {
        return input.content;
    }

    if (Array.isArray(input.parts)) {
        return input.parts
            .filter((part): part is { type: 'text'; text: string } => typeof part === 'object' && part !== null && (part as { type?: unknown }).type === 'text' && typeof (part as { text?: unknown }).text === 'string')
            .map((part) => part.text)
            .join('');
    }

    return '';
}

function normalizeMessages(value: unknown): UIMessage[] | null {
    if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
        return null;
    }

    const messages: UIMessage[] = [];
    for (const [index, entry] of value.entries()) {
        if (typeof entry !== 'object' || entry === null) {
            return null;
        }

        const input = entry as ChatInput;
        if (input.role !== 'system' && input.role !== 'user' && input.role !== 'assistant') {
            return null;
        }

        const text = getTextContent(input);
        if (!text.trim() || text.length > MAX_MESSAGE_LENGTH) {
            return null;
        }

        messages.push({
            id: typeof input.id === 'string' && input.id ? input.id : `message-${index}`,
            role: input.role,
            parts: [{ type: 'text', text }],
        });
    }

    return messages;
}

function errorResponse(message: string, status: number) {
    return Response.json({ error: message }, { status });
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown language model error.';
}

function getLanguageModel(provider: 'ollama' | 'openrouter', model: string) {
    if (provider === 'openrouter') {
        const apiKey = process.env.LLM_API_KEY?.trim();
        if (!apiKey) {
            throw new Error('LLM_API_KEY is missing for the openrouter provider.');
        }

        const openrouter = createOpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
                ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
            },
        });
        return openrouter.chat(model);
    }

    const baseUrl = process.env.OLLAMA_BASE_URL?.trim().replace(/\/$/, '');
    if (!baseUrl) {
        throw new Error('OLLAMA_BASE_URL is missing for the ollama provider.');
    }

    const ollama = createOpenAI({
        apiKey: 'ollama',
        baseURL: `${baseUrl}/v1`,
    });
    return ollama.chat(model);
}

export async function POST(request: Request) {
    let body: { messages?: unknown; stream?: unknown };
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const messages = normalizeMessages(body.messages);
    if (!messages) {
        return errorResponse(`messages must contain 1-${MAX_MESSAGES} valid messages.`, 400);
    }

    try {
        const provider = getProvider();
        const model = getModel();
        const modelMessages = await convertToModelMessages(
            messages.map((message) => Object.fromEntries(Object.entries(message).filter(([key]) => key !== 'id')) as Omit<UIMessage, 'id'>),
        );
        const languageModel = getLanguageModel(provider, model);

        if (body.stream === false) {
            const completion = await generateText({
                model: languageModel,
                messages: modelMessages,
                abortSignal: request.signal,
            });
            return Response.json({
                choices: [{ message: { role: 'assistant', content: completion.text } }],
                usage: {
                    promptTokens: completion.usage.inputTokens,
                    completionTokens: completion.usage.outputTokens,
                },
            });
        }

        const result = streamText({
            model: languageModel,
            messages: modelMessages,
            abortSignal: request.signal,
        });

        if (body.stream === 'text') {
            return result.toTextStreamResponse();
        }

        return result.toUIMessageStreamResponse();
    } catch (error) {
        const message = getErrorMessage(error);
        console.error('Language model request failed:', message);
        return errorResponse('The language model is currently unavailable.', 502);
    }
}
