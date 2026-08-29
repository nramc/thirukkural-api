import { OpenRouter } from '@openrouter/sdk';

export const runtime = 'nodejs';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_PROVIDER = 'ollama';
const DEFAULT_MODEL = 'mistral';
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 12_000;
const client = new OpenRouter({ apiKey: process.env.LLM_API_KEY });

type Role = 'system' | 'user' | 'assistant';

type ChatMessage = {
    role: Role;
    content: string;
};

type StreamChunk = {
    choices: Array<{ delta?: { content?: string | null } }>;
};

type NormalizedCompletion = {
    choices: Array<{ message: { role: 'assistant'; content: string } }>;
    usage?: { promptTokens?: number; completionTokens?: number };
};

function getProvider() {
    const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || DEFAULT_PROVIDER;
    if (provider !== 'ollama' && provider !== 'openrouter') {
        throw new Error(`Unsupported LLM_PROVIDER "${provider}". Use "ollama" or "openrouter".`);
    }
    return provider;
}

function getModel() {
    return process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;
}

function isChatMessage(value: unknown): value is ChatMessage {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const message = value as Record<string, unknown>;
    return (
        (message.role === 'system' || message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0 &&
        message.content.length <= MAX_MESSAGE_LENGTH
    );
}

function errorResponse(message: string, status: number) {
    return Response.json({ error: message }, { status });
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return 'Unknown language model error.';
}

function sse(content: unknown) {
    return `data: ${JSON.stringify(content)}\n\n`;
}

async function callOllama(messages: ChatMessage[], model: string, stream: boolean) {
    const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/$/, '') || DEFAULT_OLLAMA_URL;
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream }),
    });

    if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}: ${await response.text()}`);
    }
    return response;
}

async function callOpenRouter(messages: ChatMessage[], model: string, stream: boolean) {
    if (!process.env.LLM_API_KEY) {
        throw new Error('LLM_API_KEY is missing for the openrouter provider. Create a key at https://openrouter.ai/settings/keys.');
    }

    return client.chat.send({
        chatRequest: {
            model,
            messages,
            stream,
        },
    });
}

async function streamOllama(response: Response, controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder) {
    if (!response.body) {
        throw new Error('Ollama returned no response body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.trim()) continue;
            const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
            const content = chunk.message?.content;
            if (content) controller.enqueue(encoder.encode(sse({ content })));
        }
        if (done) break;
    }
    if (buffer.trim()) {
        const chunk = JSON.parse(buffer) as { message?: { content?: string } };
        if (chunk.message?.content) controller.enqueue(encoder.encode(sse({ content: chunk.message.content })));
    }
}

export async function POST(request: Request) {
    let body: { messages?: unknown; stream?: unknown };
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES || !messages.every(isChatMessage)) {
        return errorResponse(`messages must contain 1-${MAX_MESSAGES} valid messages.`, 400);
    }

    try {
        const provider = getProvider();
        const model = getModel();
        const stream = body.stream !== false;

        if (!stream) {
            if (provider === 'ollama') {
                const response = await callOllama(messages, model, false);
                const result = (await response.json()) as {
                    message?: { content?: string };
                    prompt_eval_count?: number;
                    eval_count?: number;
                };
                const completion: NormalizedCompletion = {
                    choices: [{ message: { role: 'assistant', content: result.message?.content ?? '' } }],
                    usage: { promptTokens: result.prompt_eval_count, completionTokens: result.eval_count },
                };
                return Response.json(completion);
            }

            const completion = await callOpenRouter(messages, model, false);
            return Response.json(completion);
        }

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    if (provider === 'ollama') {
                        await streamOllama(await callOllama(messages, model, true), controller, encoder);
                    } else {
                        const completion = await callOpenRouter(messages, model, true);
                        for await (const chunk of completion as AsyncIterable<StreamChunk>) {
                            const content = chunk.choices[0]?.delta?.content;
                            if (content) controller.enqueue(encoder.encode(sse({ content })));
                        }
                    }
                    controller.enqueue(encoder.encode(sse('[DONE]')));
                    controller.close();
                } catch (error) {
                    const message = getErrorMessage(error);
                    console.error(`${provider} streaming request failed:`, message);
                    controller.enqueue(encoder.encode(sse({ error: message })));
                    controller.enqueue(encoder.encode(sse('[DONE]')));
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'Content-Type': 'text/event-stream',
            },
        });
    } catch (error) {
        const message = getErrorMessage(error);
        console.error('Language model request failed:', message);
        return errorResponse(message, 502);
    }
}
