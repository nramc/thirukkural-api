import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    generateText,
    stepCountIs,
    streamText,
    toTextStream,
    toUIMessageStream,
    type UIMessage,
} from 'ai';
import { getRecentMessages, MAX_CONTEXT_MESSAGES, SYSTEM_INSTRUCTIONS, normalizeMessages } from '@/lib/ai/chat-policy';
import { kuralTools } from '@/lib/ai/chat-tools';
import { ConfigurationError, getLanguageModel, getModel, getProvider } from '@/lib/ai/model-resolver';

export const runtime = 'nodejs';

const MAX_OUTPUT_TOKENS = 1_500;
// Quiz/study flows may need a random-batch lookup followed by a final answer; keep a small
// amount of headroom above the common 2-step case (one tool call, then the reply).
const MAX_STEP_COUNT = 4;
// Fail fast instead of leaving the UI stuck if the upstream model hangs or a slow OpenRouter
// route never responds.
const MAX_REQUEST_DURATION_MS = 45_000;
const registeredToolNames = Object.keys(kuralTools);

function logToolEvent(event: Record<string, unknown>) {
    console.info(JSON.stringify({ event: 'chat_tool_activity', ...event }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length <= 128 ? value : undefined;
}

function summarizeUsage(value: unknown): Record<string, number> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const summary: Record<string, number> = {};
    const addNumber = (key: string, source: unknown) => {
        const number = finiteNumber(source);
        if (number !== undefined) {
            summary[key] = number;
        }
    };

    addNumber('inputTokens', value.inputTokens);
    addNumber('outputTokens', value.outputTokens);
    addNumber('totalTokens', value.totalTokens);

    const inputTokenDetails = isRecord(value.inputTokenDetails) ? value.inputTokenDetails : undefined;
    addNumber('cacheReadTokens', inputTokenDetails?.cacheReadTokens);
    addNumber('cacheWriteTokens', inputTokenDetails?.cacheWriteTokens);

    const outputTokenDetails = isRecord(value.outputTokenDetails) ? value.outputTokenDetails : undefined;
    addNumber('textTokens', outputTokenDetails?.textTokens);
    addNumber('reasoningTokens', outputTokenDetails?.reasoningTokens);

    return Object.keys(summary).length > 0 ? summary : undefined;
}

function summarizeOpenRouterUsage(value: unknown): Record<string, number> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const summary: Record<string, number> = {};
    for (const key of ['promptTokens', 'completionTokens', 'totalTokens', 'cost'] as const) {
        const number = finiteNumber(value[key]);
        if (number !== undefined) {
            summary[key] = number;
        }
    }

    const costDetails = isRecord(value.costDetails) ? value.costDetails : undefined;
    const upstreamInferenceCost = finiteNumber(costDetails?.upstreamInferenceCost);
    if (upstreamInferenceCost !== undefined) {
        summary.upstreamInferenceCost = upstreamInferenceCost;
    }

    return Object.keys(summary).length > 0 ? summary : undefined;
}

function summarizeOpenRouterMetadata(value: unknown): Record<string, unknown> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const summary: Record<string, unknown> = {};
    const provider = safeString(value.provider);
    if (provider) {
        summary.provider = provider;
    }

    const usage = summarizeOpenRouterUsage(value.usage);
    if (usage) {
        summary.usage = usage;
    }

    return Object.keys(summary).length > 0 ? summary : undefined;
}

function logGenerationUsage(event: Record<string, unknown>) {
    console.info(JSON.stringify({ event: 'chat_generation_usage', ...event }));
}

function errorResponse(message: string, status: number, requestId: string) {
    return Response.json({ error: message, requestId }, { status, headers: { 'X-Request-ID': requestId } });
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    let body: { messages?: unknown; stream?: unknown };
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400, requestId);
    }

    const messages = await normalizeMessages(body.messages);
    if (!messages) {
        return errorResponse('Please send a conversation containing readable user or assistant text.', 400, requestId);
    }

    const abortSignal = AbortSignal.any([request.signal, AbortSignal.timeout(MAX_REQUEST_DURATION_MS)]);

    try {
        const provider = getProvider();
        const model = getModel();
        logToolEvent({ requestId, phase: 'registered', provider, model, tools: registeredToolNames });
        const modelMessages = await convertToModelMessages(
            getRecentMessages(messages, MAX_CONTEXT_MESSAGES).map(
                (message) => Object.fromEntries(Object.entries(message).filter(([key]) => key !== 'id')) as Omit<UIMessage, 'id'>,
            ),
        );
        const languageModel = getLanguageModel(provider, model);
        const generationStartedAt = Date.now();

        if (body.stream === false) {
            const completion = await generateText({
                model: languageModel,
                system: SYSTEM_INSTRUCTIONS,
                messages: modelMessages,
                tools: kuralTools,
                stopWhen: stepCountIs(MAX_STEP_COUNT),
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                abortSignal,
                onStepEnd: ({ stepNumber, toolCalls, toolResults, usage, providerMetadata, finishReason }) => {
                    logToolEvent({
                        requestId,
                        phase: 'step_completed',
                        stepNumber,
                        toolCalls: toolCalls.map((toolCall) => toolCall.toolName),
                        toolResults: toolResults.length,
                        finishReason,
                        usage: summarizeUsage(usage),
                        openrouter: summarizeOpenRouterMetadata(providerMetadata?.openrouter),
                    });
                },
                onToolExecutionStart: ({ callId, toolCall }) => {
                    logToolEvent({ requestId, phase: 'execution_started', callId, tool: toolCall.toolName });
                },
                onToolExecutionEnd: ({ callId, toolCall, toolExecutionMs, toolOutput }) => {
                    logToolEvent({
                        requestId,
                        phase: 'execution_completed',
                        callId,
                        tool: toolCall.toolName,
                        durationMs: toolExecutionMs,
                        resultType: toolOutput.type,
                    });
                },
                onEnd: ({ stepNumber, finishReason, usage, finalStep }) => {
                    logGenerationUsage({
                        requestId,
                        provider,
                        model,
                        stream: false,
                        durationMs: Date.now() - generationStartedAt,
                        stepNumber,
                        finishReason,
                        usage: summarizeUsage(usage),
                        openrouter: summarizeOpenRouterMetadata(finalStep.providerMetadata?.openrouter),
                    });
                },
            });
            return Response.json(
                {
                    choices: [{ message: { role: 'assistant', content: completion.text } }],
                    usage: {
                        promptTokens: completion.usage.inputTokens,
                        completionTokens: completion.usage.outputTokens,
                    },
                },
                { headers: { 'X-Request-ID': requestId } },
            );
        }

        const result = streamText({
            model: languageModel,
            system: SYSTEM_INSTRUCTIONS,
            messages: modelMessages,
            tools: kuralTools,
            stopWhen: stepCountIs(MAX_STEP_COUNT),
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            abortSignal,
            onStepEnd: ({ stepNumber, toolCalls, toolResults, usage, providerMetadata, finishReason }) => {
                logToolEvent({
                    requestId,
                    phase: 'step_completed',
                    stepNumber,
                    toolCalls: toolCalls.map((toolCall) => toolCall.toolName),
                    toolResults: toolResults.length,
                    finishReason,
                    usage: summarizeUsage(usage),
                    openrouter: summarizeOpenRouterMetadata(providerMetadata?.openrouter),
                });
            },
            onToolExecutionStart: ({ callId, toolCall }) => {
                logToolEvent({ requestId, phase: 'execution_started', callId, tool: toolCall.toolName });
            },
            onToolExecutionEnd: ({ callId, toolCall, toolExecutionMs, toolOutput }) => {
                logToolEvent({
                    requestId,
                    phase: 'execution_completed',
                    callId,
                    tool: toolCall.toolName,
                    durationMs: toolExecutionMs,
                    resultType: toolOutput.type,
                });
            },
            onEnd: ({ stepNumber, finishReason, usage, finalStep }) => {
                logGenerationUsage({
                    requestId,
                    provider,
                    model,
                    stream: true,
                    durationMs: Date.now() - generationStartedAt,
                    stepNumber,
                    finishReason,
                    usage: summarizeUsage(usage),
                    openrouter: summarizeOpenRouterMetadata(finalStep.providerMetadata?.openrouter),
                });
            },
        });

        if (body.stream === 'text') {
            const textStream = toTextStream({ stream: result.stream });
            return new Response(textStream.pipeThrough(new TextEncoderStream()), {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Request-ID': requestId,
                },
            });
        }

        return createUIMessageStreamResponse({
            headers: { 'X-Request-ID': requestId },
            stream: toUIMessageStream({
                stream: result.stream,
                onError: () => 'The language model is currently unavailable. Please try again.',
            }),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown language model error.';
        console.error(JSON.stringify({ event: 'chat_request_failed', requestId, message }));
        return errorResponse(
            error instanceof ConfigurationError ? 'Chat service configuration is incomplete.' : 'The language model is currently unavailable.',
            error instanceof ConfigurationError ? 500 : 502,
            requestId,
        );
    }
}
