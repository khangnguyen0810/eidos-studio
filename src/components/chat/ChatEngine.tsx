// src/components/chat/ChatEngine.tsx

import React, { useState, useRef, useEffect } from "react";
import type { ChatSession } from "../../types/chat";
import { FormattedMessageContent } from "./FormattedMessageContent";

interface ChatEngineProps {
    session: ChatSession;
    isGenerating: boolean;
    errorMessage: string | null;
    selectedModel: string;
    onSendMessage: (content: string) => void;
    onRegenerateLastTurn: () => void;
    onDismissError: () => void;
    onOpenSystemPrompt: () => void;
    onOpenSettings: () => void;
}

const STARTER_PROMPTS = [
    {
        title: "Analyze & Debug Code",
        prompt: "Review this TypeScript function for potential edge cases and optimize its memory footprint:\n\n```ts\n\n```",
    },
    {
        title: "Draft Technical Spec",
        prompt: "Write a high-level technical design document for a real-time collaborative whiteboard service.",
    },
    {
        title: "Synthesize Key Concepts",
        prompt: "Explain the core mechanics of transformer attention mechanisms using an intuitive step-by-step analogy.",
    },
    {
        title: "Architecture Strategy",
        prompt: "Compare event-driven architecture using Kafka vs traditional REST microservices for an e-commerce checkout flow.",
    },
];

export const ChatEngine: React.FC<ChatEngineProps> = ({
    session,
    isGenerating,
    errorMessage,
    selectedModel,
    onSendMessage,
    onRegenerateLastTurn,
    onDismissError,
    onOpenSystemPrompt,
    onOpenSettings,
}) => {
    const [input, setInput] = useState("");
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll timeline to bottom on new messages or generation
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [session.messages, isGenerating, errorMessage]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isGenerating) return;
        onSendMessage(trimmed);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
    };

    const handleCopyMessage = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const hasCustomPrompt = Boolean(session.systemPrompt?.trim());

    return (
        <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-white text-zinc-900 transition-colors dark:bg-[#0E0E10] dark:text-zinc-100">
            {/* Error Notification Banner */}
            {errorMessage && (
                <div className="flex shrink-0 items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 transition-colors dark:border-red-900/40 dark:bg-[#1A0E10] dark:text-red-300">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenSettings}
                            className="rounded-md border border-red-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-800 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200"
                        >
                            Configure API
                        </button>
                        <button
                            onClick={onDismissError}
                            className="rounded p-1 text-red-500 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Conversation Messages Timeline */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 py-6 md:px-6"
            >
                {session.messages.length === 0 ? (
                    // Welcoming Hero & Starter Suggestions (ChatGPT / Claude Style)
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-10 text-center select-none">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-xs transition-colors dark:border-white/[0.1] dark:bg-[#141418] dark:text-zinc-100">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3L21 12L12 21L3 12L12 3Z" />
                                <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                            </svg>
                        </div>

                        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            How can I help you today?
                        </h1>

                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            Connected to <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{selectedModel}</span>. Type a prompt below or customize system instructions.
                        </p>

                        {/* System Prompt Quick Pill */}
                        <div className="mt-3">
                            <button
                                onClick={onOpenSystemPrompt}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                                    hasCustomPrompt
                                        ? "border-zinc-400 bg-zinc-100 text-zinc-900 font-medium dark:border-white/[0.2] dark:bg-white/[0.08] dark:text-zinc-100"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:border-white/[0.15] dark:hover:text-zinc-200"
                                }`}
                            >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                <span>{hasCustomPrompt ? "System Prompt: Configured" : "+ Add System Instructions"}</span>
                            </button>
                        </div>

                        {/* Quick Prompts Grid */}
                        <div className="mt-8 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
                            {STARTER_PROMPTS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSendMessage(item.prompt)}
                                    className="group flex flex-col rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-zinc-300 hover:bg-zinc-50/80 active:scale-[0.99] dark:border-white/[0.07] dark:bg-[#121216] dark:hover:border-white/[0.16] dark:hover:bg-[#17171C]"
                                >
                                    <span className="text-xs font-semibold text-zinc-800 transition-colors group-hover:text-zinc-950 dark:text-zinc-200 dark:group-hover:text-white">
                                        {item.title}
                                    </span>
                                    <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300">
                                        {item.prompt}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages Stream (ChatGPT / Claude Conversation Style)
                    <div className="mx-auto max-w-3xl space-y-6 pb-28">
                        {session.messages.map((msg, idx) => {
                            const isUser = msg.role === "user";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col animate-fade-in ${
                                        isUser ? "items-end" : "items-start"
                                    }`}
                                >
                                    {isUser ? (
                                        // User Message: Sleek elevated bubble
                                        <div className="group relative max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-900 border border-zinc-200/80 shadow-2xs dark:border-white/[0.1] dark:bg-[#18181D] dark:text-zinc-100">
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                                                {msg.content}
                                            </div>

                                            {/* Micro-toolbar on hover */}
                                            <div className="mt-2 flex items-center justify-between border-t border-zinc-200/60 pt-1.5 font-mono text-[10px] text-zinc-400 dark:border-white/[0.06] dark:text-zinc-500">
                                                <span>{msg.timestamp}</span>
                                                <button
                                                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                                                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                    title="Copy message"
                                                >
                                                    {copiedMessageId === msg.id ? "Copied" : "Copy"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Assistant Message: Clean left-aligned layout (Claude style)
                                        <div className="group w-full max-w-3xl space-y-2">
                                            {/* Model Tag & Avatar */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-md border border-zinc-200 bg-white font-mono text-[10px] font-semibold text-zinc-800 shadow-2xs dark:border-white/[0.1] dark:bg-[#141418] dark:text-zinc-200">
                                                        ✦
                                                    </div>
                                                    <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                        {selectedModel}
                                                    </span>
                                                </div>

                                                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    {msg.timestamp}
                                                </span>
                                            </div>

                                            {/* Reasoning / Thought Process if present */}
                                            {msg.reasoning && (
                                                <div className="pl-7 mb-2">
                                                    <details className="group/thinking rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-2.5 transition-colors dark:border-white/[0.08] dark:bg-[#121216]">
                                                        <summary className="flex cursor-pointer items-center justify-between font-mono text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 select-none">
                                                            <span className="flex items-center gap-1.5">
                                                                <svg className="h-3 w-3 text-zinc-400 transition-transform group-open/thinking:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                <span>Thought Process</span>
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Reasoning</span>
                                                        </summary>
                                                        <div className="mt-2.5 border-t border-zinc-200/60 pt-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-600 dark:border-white/[0.06] dark:text-zinc-400">
                                                            {msg.reasoning}
                                                        </div>
                                                    </details>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="pl-7 select-text">
                                                <FormattedMessageContent content={msg.content} isUser={false} />
                                            </div>

                                            {/* Assistant Action Bar */}
                                            <div className="flex items-center gap-3 pl-7 pt-1 font-mono text-[11px] text-zinc-400 opacity-80 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
                                                <button
                                                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                                                    title="Copy response"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{copiedMessageId === msg.id ? "Copied" : "Copy"}</span>
                                                </button>

                                                {idx === session.messages.length - 1 && !isGenerating && (
                                                    <button
                                                        onClick={onRegenerateLastTurn}
                                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                                                        title="Regenerate last response"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                                                        </svg>
                                                        <span>Regenerate</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Generating State (Three Bouncing Dots Claude Style) */}
                        {isGenerating && (
                            <div className="flex items-center gap-2.5 pl-7 pt-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-md border border-zinc-200 bg-white text-[10px] font-semibold text-zinc-800 dark:border-white/[0.1] dark:bg-[#141418] dark:text-zinc-200">
                                    ✦
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-400 [animation-delay:-0.3s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-400 [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-400" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Input Floor (ChatGPT / Claude Pill Box Container) */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center bg-gradient-to-t from-white via-white/80 to-transparent p-4 pb-5 md:px-6 dark:from-[#0E0E10] dark:via-[#0E0E10]/80">
                <div className="pointer-events-auto w-full max-w-3xl">
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex flex-col rounded-2xl border border-zinc-300/80 bg-white p-2 shadow-lg shadow-zinc-900/5 transition-colors focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-400/20 dark:border-white/[0.12] dark:bg-[#141418] dark:shadow-2xl dark:shadow-black/50 dark:focus-within:border-white/[0.24]"
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isGenerating}
                            placeholder={`Message ${selectedModel}...`}
                            rows={1}
                            className="max-h-48 min-h-[2.5rem] w-full resize-none bg-transparent px-3 py-1.5 font-sans text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none disabled:opacity-50 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />

                        {/* Bottom Bar inside Input Box */}
                        <div className="flex items-center justify-between px-2 pt-1">
                            <button
                                type="button"
                                onClick={onOpenSystemPrompt}
                                className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                                    hasCustomPrompt
                                        ? "bg-zinc-100 text-zinc-800 font-medium dark:bg-white/[0.08] dark:text-zinc-200"
                                        : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
                                }`}
                                title="Edit System Instructions"
                            >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M4.5 6h.008v.008H4.5V6zm0 6h.008v.008H4.5V12zm0 6h.008v.008H4.5V18z" />
                                </svg>
                                <span>{hasCustomPrompt ? "Prompt Set" : "System Prompt"}</span>
                            </button>

                            <button
                                type="submit"
                                disabled={!input.trim() || isGenerating}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs transition-all hover:bg-black active:scale-95 disabled:scale-100 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                                title="Send message"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    <div className="mt-1.5 text-center font-sans text-[11px] text-zinc-400 dark:text-zinc-500 select-none">
                        AI may produce inaccurate information. Always verify critical facts.
                    </div>
                </div>
            </div>
        </div>
    );
};
