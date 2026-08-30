'use client';

import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { useState } from 'react';

const suggestions = [
    "Today's Kural",
    'Find a Kural about perseverance',
    'Why is lifelong learning important?',
    'What does Thirukkural say about education?',
    'Give me a Thirukkural and explain its modern relevance',
];

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

function PendingMessageContent({ activity }: Readonly<{ activity: 'thinking' | 'tool' }>) {
    if (activity === 'tool') {
        return (
            <span className="text-sm text-slate-500" role="status" aria-live="polite">
                Looking up a Kural…
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 py-2 text-sm text-slate-500" role="status" aria-live="polite">
            <span>Reflecting</span>
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

function MessageBubble({ message, isStreaming }: Readonly<{ message: UIMessage; isStreaming: boolean }>) {
    const [copied, setCopied] = useState(false);
    const isAssistant = message.role === 'assistant';
    const content = getMessageText(message);
    const isUsingTool = isAssistant && hasActiveToolPart(message);
    let renderedContent = content ? <MessageResponse isAnimating={isStreaming && isAssistant}>{content}</MessageResponse> : null;

    if (!content && isStreaming && isAssistant) {
        renderedContent = <PendingMessageContent activity={isUsingTool ? 'tool' : 'thinking'} />;
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
    const { messages, sendMessage, stop, setMessages, error, clearError, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    });
    const [input, setInput] = useState('');
    const isStreaming = status === 'submitted' || status === 'streaming';
    const lastMessage = messages.at(-1);
    const showPendingAssistant = isStreaming && lastMessage?.role !== 'assistant';

    const submitMessage = (value: string) => {
        const content = value.trim();
        if (!content || isStreaming) return;

        setInput('');
        clearError();
        void sendMessage({ text: content });
    };

    const stopStreaming = () => stop();
    const startNewChat = () => {
        if (isStreaming) stopStreaming();
        setMessages([]);
        setInput('');
        clearError();
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 text-slate-900 selection:bg-blue-200">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-40 -top-40 size-112 rounded-full bg-blue-200/50 blur-[110px]" />
                <div className="absolute -right-40 top-1/3 size-112 rounded-full bg-indigo-200/50 blur-[120px]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 sm:px-8">
                <header className="flex h-20 shrink-0 items-center justify-between border-b border-blue-100">
                    <div className="group flex items-center gap-3 rounded-xl">
                        <span className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/10 transition-transform group-hover:scale-105">
                            <SparkIcon className="size-7 text-blue-700" />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold tracking-tight text-blue-950">Valluvar AI</span>
                            <span className="block text-[11px] text-slate-500">Explore timeless wisdom</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 sm:flex">
                            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-400" />
                            Online
                        </div>
                        <button
                            type="button"
                            onClick={startNewChat}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-blue-100 hover:text-blue-900"
                        >
                            New conversation
                        </button>
                    </div>
                </header>

                <section className="flex min-h-0 flex-1 flex-col items-center py-6 sm:py-10">
                    <Conversation className="min-h-0 w-full max-w-4xl flex-1 rounded-3xl bg-white/45 pb-6 shadow-sm ring-1 ring-blue-100/80 [scrollbar-color:#bfdbfe_transparent] [scrollbar-width:thin]">
                        {messages.length === 0 ? (
                            <ConversationEmptyState className="min-h-[58vh] bg-transparent">
                                <div className="mb-6 flex size-16 items-center justify-center rounded-3xl border border-blue-200 bg-blue-100 text-blue-700 shadow-xl shadow-blue-900/10">
                                    <SparkIcon className="size-8" />
                                </div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700/80">Timeless wisdom, made conversational</p>
                                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-blue-950 sm:text-5xl sm:leading-[1.12]">
                                    Explore the Thirukkural with Valluvar AI
                                </h1>
                                <p className="mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                                    Ask about a Kural, explore an idea, or bring timeless wisdom into your everyday life.
                                </p>
                                <Suggestions className="mx-auto mt-8 flex w-full max-w-2xl flex-wrap justify-center gap-3 whitespace-normal">
                                    {suggestions.map((suggestion) => (
                                        <Suggestion
                                            key={suggestion}
                                            suggestion={suggestion}
                                            onClick={setInput}
                                            className="rounded-full border-blue-200/80 bg-white/80 px-4 py-3 text-left text-xs font-medium text-slate-600 shadow-sm shadow-blue-900/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-950 hover:shadow-md hover:shadow-blue-900/10 focus-visible:ring-4 focus-visible:ring-blue-200 active:translate-y-0"
                                        />
                                    ))}
                                </Suggestions>
                            </ConversationEmptyState>
                        ) : (
                            <ConversationContent className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} isStreaming={isStreaming} />
                                ))}
                                {showPendingAssistant && <PendingAssistantBubble />}
                            </ConversationContent>
                        )}
                    </Conversation>

                    <div className="mx-auto mt-5 w-full max-w-4xl sm:mt-7">
                        {error && (
                            <div
                                role="alert"
                                className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                            >
                                <span>Something went wrong: {error.message}</span>
                                <button type="button" onClick={clearError} className="text-rose-500/70 hover:text-rose-800" aria-label="Dismiss error">
                                    ×
                                </button>
                            </div>
                        )}
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitMessage(input);
                            }}
                            className="rounded-2xl border border-blue-200 bg-white p-2 shadow-xl shadow-blue-900/10 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
                        >
                            <textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                        event.preventDefault();
                                        submitMessage(input);
                                    }
                                }}
                                placeholder="Ask Valluvar AI about the Thirukkural..."
                                aria-label="Ask Valluvar AI about the Thirukkural"
                                rows={1}
                                disabled={isStreaming}
                                className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <div className="flex items-center justify-between px-2 pb-1">
                                <p className="text-[11px] text-slate-400">⌘ Enter to send · Shift+Enter for a new line</p>
                                <button
                                    type={isStreaming ? 'button' : 'submit'}
                                    onClick={isStreaming ? stopStreaming : undefined}
                                    disabled={!isStreaming && !input.trim()}
                                    className="flex size-9 items-center justify-center rounded-xl bg-blue-800 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-50 disabled:text-blue-300"
                                    aria-label={isStreaming ? 'Stop response' : 'Ask Valluvar AI'}
                                >
                                    {isStreaming ? <StopIcon /> : <ArrowUpIcon />}
                                </button>
                            </div>
                        </form>
                        <p className="mt-3 text-center text-[11px] text-slate-400">
                            Valluvar AI can make mistakes. Verify important information before relying on it.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
