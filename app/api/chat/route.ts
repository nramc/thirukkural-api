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

const MAX_OUTPUT_TOKENS = 1_024;
const MAX_STEP_COUNT = 3;
const registeredToolNames = Object.keys(kuralTools);

function logToolEvent(event: Record<string, unknown>) {
    console.info(JSON.stringify({ event: 'chat_tool_activity', ...event }));
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

        if (body.stream === false) {
            const completion = await generateText({
                model: languageModel,
                system: SYSTEM_INSTRUCTIONS,
                messages: modelMessages,
                tools: kuralTools,
                stopWhen: stepCountIs(MAX_STEP_COUNT),
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                abortSignal: request.signal,
                onStepEnd: ({ stepNumber, toolCalls, toolResults }) => {
                    logToolEvent({
                        requestId,
                        phase: 'step_completed',
                        stepNumber,
                        toolCalls: toolCalls.map((toolCall) => toolCall.toolName),
                        toolResults: toolResults.length,
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
            abortSignal: request.signal,
            onStepEnd: ({ stepNumber, toolCalls, toolResults }) => {
                logToolEvent({
                    requestId,
                    phase: 'step_completed',
                    stepNumber,
                    toolCalls: toolCalls.map((toolCall) => toolCall.toolName),
                    toolResults: toolResults.length,
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
            stream: toUIMessageStream({ stream: result.stream }),
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
