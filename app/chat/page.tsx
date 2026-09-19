'use client';

import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { useCallback, useEffect, useRef, useState } from 'react';

type ChatSuggestion = {
    label: string;
    prompt: string;
    autoSubmit?: boolean;
};

const threeKuralQuizPrompt = `Start a concise 3-round Thirukkural meaning quiz. Before Round 1, call getRandomKurals once with count=3.

Grounding rule: each returned array item is authoritative. For each round, use the same item's number and copy its kural[0] and kural[1] verbatim. Never use Tamil from memory, rewrite or translate the couplet, invent text, or show any other Tamil. If a matching tool item is unavailable, say the verified source is unavailable instead of guessing.

Round format:
Round N – Kural <number>
<exact kural[0]>
<exact kural[1]>
What does this couplet mean?
A) ...
B) ...
C) ...
D) ...

Use exactly four plausible choices with one correct answer. Do not reveal or hint at the answer until I choose. Accept A-D or an unambiguous choice; unclear answers do not change the score. After a valid answer, briefly explain it, update the score, and show the next round. Stop after Round 3. End every response with exactly: Score: <correct>/<answered>

Begin Round 1 now with Score: 0/0`;

const suggestions: ChatSuggestion[] = [
    { label: 'What Can I Learn Today?', prompt: 'What Can I Learn Today?' },
    { label: 'Find a Kural about perseverance', prompt: 'Find a Kural about perseverance' },
    { label: 'Help Me Stay Motivated', prompt: 'Help Me Stay Motivated' },
    { label: 'Surprise Me with a Kural', prompt: 'Surprise Me with a Kural' },
    { label: 'Start a 3-Kural Quiz', prompt: threeKuralQuizPrompt, autoSubmit: true },
    { label: 'Explain This Kural', prompt: 'Explain This Kural' },
];

const CLIENT_REQUEST_TIMEOUT_MS = 50_000;

function SparkIcon({ className = 'size-5' }: Readonly<{ className?: string }>) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2.75 13.65 9l5.6 3-5.6 3L12 21.25 10.35 15l-5.6-3 5.6-3L12 2.75Z" fill="currentColor" />
        </svg>
    );
}

function ArrowUpIcon() {
    return (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 19V5m0 0L6 11m6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function StopIcon() {
    return <span className="size-3 rounded-[3px] bg-current" aria-hidden="true" />;
}

function CopyIcon() {
    return (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

function getMessageText(message: UIMessage) {
    return message.parts
        .filter((part): part is Extract<UIMessage['parts'][number], { type: 'text' }> => part.type === 'text')
        .map((part) => part.text)
        .join('');
}

function hasActiveToolPart(message: UIMessage) {
    return message.parts.some((part) => {
        if (typeof part !== 'object' || part === null) return false;

        const candidate = part as { type?: unknown; state?: unknown };
        return (
            typeof candidate.type === 'string' &&
            candidate.type.startsWith('tool-') &&
            (candidate.state === 'input-streaming' || candidate.state === 'input-available')
        );
    });
}

const thinkingStatuses = ['Reflecting', 'Considering the context', 'Preparing a clear answer'];

function PendingMessageContent({ activity }: Readonly<{ activity: 'thinking' | 'tool' }>) {
    const [statusIndex, setStatusIndex] = useState(0);

    useEffect(() => {
        if (activity === 'tool') return;

        const intervalId = window.setInterval(() => {
            setStatusIndex((index) => (index + 1) % thinkingStatuses.length);
        }, 4_000);

        return () => window.clearInterval(intervalId);
    }, [activity]);

    if (activity === 'tool') {
        return (
            <span className="text-sm text-slate-500" role="status" aria-live="polite">
                Looking up a Kural…
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 py-2 text-sm text-slate-500" role="status" aria-live="polite">
            <span>{thinkingStatuses[statusIndex]}…</span>
            <i className="size-1.5 animate-pulse rounded-full bg-slate-400" aria-hidden="true" />
            <i className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" aria-hidden="true" />
            <i className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" aria-hidden="true" />
        </span>
    );
}

function PendingAssistantBubble() {
    return (
        <div className="flex gap-3 sm:gap-4">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-xs font-semibold text-white shadow-lg shadow-blue-900/20">
                <SparkIcon className="size-4" />
            </div>
            <Message from="assistant" className="max-w-[86%] sm:max-w-[76%]">
                <MessageContent className="rounded-2xl rounded-tl-md border border-blue-100 bg-white px-5 py-4 text-slate-700 shadow-sm shadow-blue-900/5">
                    <PendingMessageContent activity="thinking" />
                </MessageContent>
            </Message>
        </div>
    );
}

function MessageBubble({ message, isStreaming, onRetry }: Readonly<{ message: UIMessage; isStreaming: boolean; onRetry: () => void }>) {
    const [copied, setCopied] = useState(false);
    const isAssistant = message.role === 'assistant';
    const content = getMessageText(message);
    const isUsingTool = isAssistant && hasActiveToolPart(message);
    let renderedContent = content ? <MessageResponse isAnimating={isStreaming && isAssistant}>{content}</MessageResponse> : null;

    if (!content && isStreaming && isAssistant) {
        renderedContent = <PendingMessageContent activity={isUsingTool ? 'tool' : 'thinking'} />;
    }

    if (!content && !isStreaming && isAssistant) {
        renderedContent = (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                <span>No response text was returned.</span>
                <button type="button" onClick={onRetry} className="font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-950">
                    Retry response
                </button>
            </div>
        );
    }

    const copyMessage = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div className={`flex gap-3 sm:gap-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
            <div
                className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                    isAssistant ? 'bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20' : 'bg-blue-100 text-blue-800'
                }`}
            >
                {isAssistant ? <SparkIcon className="size-4" /> : 'You'}
            </div>
            <Message from={message.role} className="max-w-[86%] sm:max-w-[76%]">
                <MessageContent
                    className={`whitespace-pre-wrap wrap-break-word text-[0.95rem] leading-7 ${
                        isAssistant
                            ? 'rounded-2xl rounded-tl-md border border-blue-100 bg-white px-5 py-4 text-slate-700 shadow-sm shadow-blue-900/5'
                            : 'rounded-2xl rounded-tr-md bg-blue-800 px-5 py-4 text-white shadow-lg shadow-blue-900/15'
                    }`}
                >
                    {renderedContent}
                </MessageContent>
                {isAssistant && content && (
                    <MessageActions className="mt-2">
                        <MessageAction
                            label={copied ? 'Response copied' : 'Copy response'}
                            title={copied ? 'Response copied' : 'Copy response'}
                            onClick={copyMessage}
                            className="text-slate-400 hover:bg-blue-50 hover:text-blue-800"
                        >
                            <CopyIcon />
                        </MessageAction>
                    </MessageActions>
                )}
            </Message>
        </div>
    );
}

export default function Home() {
    const [uiFailure, setUiFailure] = useState(false);
    const [intentionalStop, setIntentionalStop] = useState(false);
    const { messages, sendMessage, regenerate, stop, error, clearError, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onError: () => setUiFailure(true),
        onFinish: ({ isAbort, isDisconnect, isError }) => {
            const wasIntentionalStop = intentionalStop;
            setIntentionalStop(false);
            if (!wasIntentionalStop && (isAbort || isDisconnect || isError)) {
                setUiFailure(true);
            }
        },
    });
    const [input, setInput] = useState('');
    const didAutoSubmitPrompt = useRef(false);
    const isStreaming = status === 'submitted' || status === 'streaming';
    const lastMessage = messages.at(-1);
    const showPendingAssistant = isStreaming && lastMessage?.role !== 'assistant';

    useEffect(() => {
        if (!isStreaming) return;

        const timeoutId = window.setTimeout(() => {
            setIntentionalStop(true);
            setUiFailure(true);
            void stop();
        }, CLIENT_REQUEST_TIMEOUT_MS);

        return () => window.clearTimeout(timeoutId);
    }, [isStreaming, stop]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth',
            });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [lastMessage?.id, lastMessage?.role]);

    const submitMessage = useCallback(
        (value: string) => {
            const content = value.trim();
            if (!content || isStreaming) return;

            setInput('');
            setUiFailure(false);
            setIntentionalStop(false);
            clearError();
            void sendMessage({ text: content });
        },
        [clearError, isStreaming, sendMessage],
    );

    useEffect(() => {
        if (didAutoSubmitPrompt.current) return;
        didAutoSubmitPrompt.current = true;

        const url = new URL(window.location.href);
        const prompt = url.searchParams.get('prompt')?.trim();
        if (!prompt) return;

        url.searchParams.delete('prompt');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        window.setTimeout(() => submitMessage(prompt), 0);
    }, [submitMessage]);

    const stopStreaming = () => {
        setIntentionalStop(true);
        void stop();
    };

    const retryLastResponse = () => {
        if (isStreaming) return;

        const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
        const lastAssistantIndex = [...messages].map((message) => message.role).lastIndexOf('assistant');
        const lastUserIndex = lastUserMessage ? messages.indexOf(lastUserMessage) : -1;

        setUiFailure(false);
        setIntentionalStop(false);
        clearError();

        if (lastAssistantIndex > lastUserIndex) {
            const lastAssistantMessage = messages[lastAssistantIndex];
            void regenerate({ messageId: lastAssistantMessage.id }).catch(() => setUiFailure(true));
            return;
        }

        if (lastUserMessage) {
            void sendMessage({ text: getMessageText(lastUserMessage), messageId: lastUserMessage.id }).catch(() => setUiFailure(true));
        }
    };

    const dismissFailure = () => {
        setUiFailure(false);
        clearError();
    };

    return (
        <main className="bg-linear-to-br from-blue-50 via-white to-indigo-50 pb-36 text-slate-900 selection:bg-blue-200 sm:pb-32">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-40 -top-40 size-112 rounded-full bg-blue-200/50 blur-[110px]" />
                <div className="absolute -right-40 top-1/3 size-112 rounded-full bg-indigo-200/50 blur-[120px]" />
            </div>

            <div className="relative mx-auto flex w-full max-w-5xl flex-col px-3 sm:px-8">
                <section className="flex flex-col items-center gap-3 py-3 sm:gap-0 sm:py-10">
                    <Conversation
                        className={`w-full max-w-4xl rounded-3xl bg-white/45 pb-3 shadow-sm ring-1 ring-blue-100/80 sm:pb-6 ${messages.length === 0 ? 'flex-none' : ''}`}
                    >
                        {messages.length === 0 ? (
                            <ConversationEmptyState className="h-auto bg-transparent p-4! sm:p-8!">
                                <div className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-3xl border border-blue-200 bg-blue-100 text-blue-700 shadow-xl shadow-blue-900/10 sm:mb-6 sm:size-16">
                                    <SparkIcon className="size-7 sm:size-8" />
                                </div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700/80 sm:mb-3 sm:text-xs sm:tracking-[0.22em]">
                                    Timeless wisdom, made conversational
                                </p>
                                <h1 className="max-w-xl text-2xl font-semibold tracking-tight text-blue-950 sm:text-5xl sm:leading-[1.12]">
                                    Explore the Thirukkural with Valluvar AI
                                </h1>
                                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                                    Ask about a Kural, explore an idea, or bring timeless wisdom into your everyday life.
                                </p>
                                <Suggestions className="mx-auto mt-5 flex w-full max-w-2xl flex-wrap justify-center gap-2 whitespace-normal sm:mt-8 sm:gap-3">
                                    {suggestions.map((suggestion) => (
                                        <Suggestion
                                            key={suggestion.label}
                                            suggestion={suggestion.prompt}
                                            onClick={(prompt) => {
                                                setInput(prompt);
                                                if (suggestion.autoSubmit) {
                                                    submitMessage(prompt);
                                                }
                                            }}
                                            className="rounded-full border-blue-200/80 bg-white/80 px-3 py-2.5 text-left text-xs font-medium text-slate-600 shadow-sm shadow-blue-900/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-950 hover:shadow-md hover:shadow-blue-900/10 focus-visible:ring-4 focus-visible:ring-blue-200 active:translate-y-0 sm:px-4 sm:py-3"
                                        >
                                            {suggestion.label}
                                        </Suggestion>
                                    ))}
                                </Suggestions>
                            </ConversationEmptyState>
                        ) : (
                            <ConversationContent className="mx-auto w-full max-w-3xl px-2 py-4 sm:px-6 sm:py-8">
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} isStreaming={isStreaming} onRetry={retryLastResponse} />
                                ))}
                                {showPendingAssistant && <PendingAssistantBubble />}
                            </ConversationContent>
                        )}
                    </Conversation>

                    <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-blue-50 via-blue-50/95 to-transparent px-3 pb-2 pt-3 sm:px-8 sm:pb-4 sm:pt-6">
                        <div className="mx-auto w-full max-w-4xl">
                            {(error || uiFailure) && (
                                <div
                                    role="alert"
                                    className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                                >
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <span>The response could not be completed. Please try again.</span>
                                        <button
                                            type="button"
                                            onClick={retryLastResponse}
                                            disabled={isStreaming}
                                            className="font-semibold text-rose-800 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                    <button type="button" onClick={dismissFailure} className="text-rose-500/70 hover:text-rose-800" aria-label="Dismiss error">
                                        ×
                                    </button>
                                </div>
                            )}
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submitMessage(input);
                                }}
                                className="rounded-2xl border border-blue-200 bg-white p-1.5 shadow-xl shadow-blue-900/10 transition focus-within:ring-4 focus-within:ring-blue-100 sm:p-2"
                            >
                                <textarea
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
                                            event.preventDefault();
                                            submitMessage(input);
                                        }
                                    }}
                                    placeholder="Ask Valluvar AI about the Thirukkural..."
                                    aria-label="Ask Valluvar AI about the Thirukkural"
                                    rows={1}
                                    disabled={isStreaming}
                                    className="max-h-36 min-h-11 w-full resize-none bg-transparent px-2.5 py-2.5 text-sm leading-6 text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:px-3 sm:py-3"
                                />
                                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 sm:px-2">
                                    <p className="text-[10px] text-slate-400 sm:text-[11px]">Enter to send · ⌘ Enter for a new line</p>
                                    <button
                                        type={isStreaming ? 'button' : 'submit'}
                                        onClick={isStreaming ? stopStreaming : undefined}
                                        disabled={!isStreaming && !input.trim()}
                                        className="flex size-9 items-center justify-center rounded-xl bg-blue-800 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed"
                                        aria-label={isStreaming ? 'Stop response' : 'Ask Valluvar AI'}
                                    >
                                        {isStreaming ? <StopIcon /> : <ArrowUpIcon />}
                                    </button>
                                </div>
                            </form>
                            <p className="mt-2 text-center text-[10px] text-slate-400 sm:mt-3 sm:text-[11px]">
                                Valluvar AI can make mistakes. Verify important information before relying on it.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
