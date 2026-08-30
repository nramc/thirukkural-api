'use client';

import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

const suggestions = ['Explain a complex idea simply', 'Help me plan my next project', 'Write a thoughtful introduction'];

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

function MessageBubble({ message }: Readonly<{ message: UIMessage }>) {
    const [copied, setCopied] = useState(false);
    const isAssistant = message.role === 'assistant';
    const content = getMessageText(message);

    const copyMessage = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div className={`flex gap-3 sm:gap-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
            <div
                className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                    isAssistant ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300'
                }`}
            >
                {isAssistant ? <SparkIcon className="size-4" /> : 'You'}
            </div>
            <div className={`group max-w-[86%] sm:max-w-[76%] ${isAssistant ? '' : 'items-end'}`}>
                <div
                    className={`whitespace-pre-wrap break-words text-[0.95rem] leading-7 ${
                        isAssistant
                            ? 'rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.07] px-4 py-3 text-slate-200'
                            : 'rounded-2xl rounded-tr-md bg-indigo-500 px-4 py-3 text-white shadow-lg shadow-indigo-950/20'
                    }`}
                >
                    {content || (
                        <span className="inline-flex gap-1.5 py-2">
                            <i className="size-1.5 animate-pulse rounded-full bg-slate-400" />
                            <i className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                            <i className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                        </span>
                    )}
                </div>
                {isAssistant && content && (
                    <button
                        type="button"
                        onClick={copyMessage}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 opacity-100 transition hover:bg-white/[0.06] hover:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                        <CopyIcon />
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function Home() {
    const { messages, sendMessage, stop, setMessages, error, clearError, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    });
    const [input, setInput] = useState('');
    const conversationRef = useRef<HTMLDivElement>(null);
    const isStreaming = status === 'submitted' || status === 'streaming';

    useEffect(() => {
        const conversation = conversationRef.current;
        if (conversation) conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const submitMessage = (event?: FormEvent) => {
        event?.preventDefault();
        const content = input.trim();
        if (!content || isStreaming) return;

        setInput('');
        clearError();
        void sendMessage({ text: content });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submitMessage();
        }
    };

    const stopStreaming = () => stop();
    const startNewChat = () => {
        if (isStreaming) stopStreaming();
        setMessages([]);
        setInput('');
        clearError();
    };

    return (
        <main className="min-h-screen bg-[#080b14] text-slate-100 selection:bg-indigo-500/30">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-40 -top-40 size-[28rem] rounded-full bg-indigo-600/10 blur-[110px]" />
                <div className="absolute -right-40 top-1/3 size-[28rem] rounded-full bg-violet-600/[0.08] blur-[120px]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
                <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                            <SparkIcon className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight text-white">Kural AI</p>
                            <p className="text-[11px] text-slate-500">Thoughtful conversations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300 sm:flex">
                            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
                            Online
                        </div>
                        <button
                            type="button"
                            onClick={startNewChat}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                        >
                            New chat
                        </button>
                    </div>
                </header>

                <section className="flex min-h-0 flex-1 flex-col py-8 sm:py-10">
                    <div ref={conversationRef} className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]">
                        {messages.length === 0 ? (
                            <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
                                <div className="mb-6 flex size-16 items-center justify-center rounded-3xl border border-indigo-400/20 bg-indigo-400/[0.08] text-indigo-300 shadow-2xl shadow-indigo-950/30">
                                    <SparkIcon className="size-8" />
                                </div>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300/80">Your thinking companion</p>
                                <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
                                    What would you like to explore?
                                </h1>
                                <p className="mt-5 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                                    Ask a question, shape an idea, or start a thoughtful conversation. Your assistant is ready when you are.
                                </p>
                                <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => setInput(suggestion)}
                                            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-left text-xs text-slate-400 transition hover:border-indigo-400/30 hover:bg-indigo-400/[0.07] hover:text-slate-200"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mx-auto w-full max-w-3xl">
                        {error && (
                            <div
                                role="alert"
                                className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200"
                            >
                                <span>{error.message}</span>
                                <button
                                    type="button"
                                    onClick={clearError}
                                    className="text-rose-300/70 hover:text-rose-100"
                                    aria-label="Dismiss error"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <form
                            onSubmit={submitMessage}
                            className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl focus-within:border-indigo-400/40 focus-within:ring-4 focus-within:ring-indigo-500/10"
                        >
                            <textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message your assistant..."
                                aria-label="Message your assistant"
                                rows={1}
                                disabled={isStreaming}
                                className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <div className="flex items-center justify-between px-2 pb-1">
                                <p className="text-[11px] text-slate-600">⌘ Enter to send</p>
                                <button
                                    type={isStreaming ? 'button' : 'submit'}
                                    onClick={isStreaming ? stopStreaming : undefined}
                                    disabled={!isStreaming && !input.trim()}
                                    className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-600"
                                    aria-label={isStreaming ? 'Stop generating' : 'Send message'}
                                >
                                    {isStreaming ? <StopIcon /> : <ArrowUpIcon />}
                                </button>
                            </div>
                        </form>
                        <p className="mt-3 text-center text-[11px] text-slate-600">AI can make mistakes. Check important information before relying on it.</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
