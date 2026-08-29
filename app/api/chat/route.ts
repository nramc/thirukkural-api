import { OpenRouter } from '@openrouter/sdk';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type StreamChunk = {
    choices: Array<{ delta?: { content?: string | null } }>;
};

function isChatMessage(value: unknown): value is ChatMessage {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const message = value as Record<string, unknown>;
    return (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string' && message.content.trim().length > 0;
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

    return 'Unknown OpenRouter error.';
}

export async function POST(request: Request) {
    if (!process.env.OPENROUTER_API_KEY) {
        return errorResponse('OPENROUTER_API_KEY is missing. Create a key at https://openrouter.ai/settings/keys.', 500);
    }

    let body: { model?: unknown; messages?: unknown; stream?: unknown };
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
        return errorResponse('messages must be a non-empty array of user and assistant messages.', 400);
    }

    const model = typeof body.model === 'string' && body.model.trim() ? body.model : 'google/gemini-3.1-flash-lite';
    const stream = body.stream !== false;

    try {
        if (!stream) {
            const completion = await client.chat.send({
                chatRequest: {
                    model,
                    messages,
                    stream: false,
                },
            });

            return Response.json(completion);
        }

        const completion = await client.chat.send({
            chatRequest: {
                model,
                messages,
                stream: true,
            },
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion as AsyncIterable<StreamChunk>) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    const message = getErrorMessage(error);
                    console.error('OpenRouter streaming request failed:', message);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
        console.error('OpenRouter request failed:', message);
        return errorResponse(`OpenRouter request failed: ${message}`, 502);
    }
}
