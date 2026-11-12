// src/components/chat/ChatEngine.tsx

import React, { useState, useRef, useEffect } from "react";
import type { ChatSession } from "../../types/chat";
import { estimateTokens, estimateConversationTokens } from "../../utils/tokenEstimator";
import { FormattedMessageContent } from "./FormattedMessageContent";

interface ChatEngineProps {
    session: ChatSession;
    isGenerating: boolean;
    errorMessage: string | null;
    selectedModel: string;
    onSendMessage: (content: string) => void;
    onUpdateSystemPrompt: (prompt: string) => void;
    onClearHistory: () => void;
    onRegenerateLastTurn: () => void;
    onDismissError: () => void;
    onOpenSettings: () => void;
}

const QUICK_STARTERS = [
    {
        title: "Coding Assistant",
        systemPrompt: "You are an expert full-stack software engineer. Provide clean, well-commented, and production-ready code. Explain key architectural decisions concisely.",
        prompt: "Write a TypeScript function to debounce an async search input with cancellation support.",
    },
    {
        title: "Concise Explainer",
        systemPrompt: "You are a clear and concise technical writer. Explain complex topics using simple analogies and direct bullet points. Keep explanations under 200 words.",
        prompt: "Explain how large language models generate text using token prediction.",
    },
    {
        title: "Structured Analyst",
        systemPrompt: "You are a strategic technology consultant. Structure your answers with Executive Summary, Key Factors, Pros/Cons table, and Final Recommendation.",
        prompt: "Compare PostgreSQL vs MongoDB for a fast-growing B2B SaaS application.",
    },
];

export const ChatEngine: React.FC<ChatEngineProps> = ({
    session,
    isGenerating,
    errorMessage,
    selectedModel,
    onSendMessage,
    onUpdateSystemPrompt,
    onClearHistory,
    onRegenerateLastTurn,
    onDismissError,
    onOpenSettings,
}) => {
    const [input, setInput] = useState("");
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(true);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const systemPromptTokens = estimateTokens(session.systemPrompt);
    const totalTokens = estimateConversationTokens(session.systemPrompt, session.messages);

    // Auto-scroll timeline to bottom on new messages or generation changes
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
        // Auto resize height
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    };

    const handleCopyMessage = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    return (
        <div className="flex h-full flex-col bg-[#09090B]">
            {/* Top Toolbar */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#09090B] px-4 md:px-6 select-none">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate text-xs font-medium text-zinc-200">
                        {session.title || "Conversation"}
                    </span>

                    <button
                        onClick={onOpenSettings}
                        className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#121216] px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/[0.16] hover:text-zinc-200"
                        title="Click to change model or API key"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <span>{selectedModel}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                            isSystemPromptOpen
                                ? "border-white/[0.16] bg-[#18181D] text-zinc-100"
                                : "border-white/[0.07] bg-[#121216] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"
                        }`}
                        title="Toggle System Instructions panel"
                    >
                        <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M4.5 6h.008v.008H4.5V6zm0 6h.008v.008H4.5V12zm0 6h.008v.008H4.5V18z" />
                        </svg>
                        <span>System Prompt</span>
                        {systemPromptTokens > 0 && (
                            <span className="rounded bg-white/[0.08] px-1.5 py-0.2 font-mono text-[10px] text-zinc-300">
                                {systemPromptTokens}t
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onClearHistory}
                        disabled={isGenerating || session.messages.length === 0}
                        className="rounded-md border border-white/[0.07] bg-[#121216] px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-white/[0.14] hover:bg-[#17171C] hover:text-zinc-200 disabled:opacity-35 disabled:pointer-events-none"
                        title="Clear conversation messages"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="flex items-center justify-between border-b border-red-900/40 bg-[#160D0F] px-4 py-2.5 text-xs text-red-300">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenSettings}
                            className="rounded border border-red-800/50 bg-red-950/60 px-2.5 py-0.5 text-[11px] font-medium text-red-200 transition-colors hover:bg-red-900/60"
                        >
                            Settings
                        </button>
                        <button
                            onClick={onDismissError}
                            className="rounded px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-950/40 hover:text-red-200"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* System Instructions Panel */}
            {isSystemPromptOpen && (
                <div className="shrink-0 border-b border-white/[0.07] bg-[#0D0D10] p-4 md:px-6">
                    <div className="mx-auto max-w-4xl space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-zinc-300 uppercase">
                                    <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    System Instructions
                                </label>
                                <span className="hidden sm:inline font-mono text-[10px] text-zinc-500">
                                    — Directs model behavior across the session
                                </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
                                <span>{systemPromptTokens} tokens</span>
                                {session.systemPrompt && (
                                    <button
                                        onClick={() => onUpdateSystemPrompt("")}
                                        className="text-zinc-400 transition-colors hover:text-zinc-100"
                                        title="Clear system prompt"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={session.systemPrompt}
                            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                            placeholder="Optional: Define system instructions (e.g., 'You are a concise technical architect. Respond with clear reasoning and production code.')."
                            rows={3}
                            className="w-full rounded-md border border-white/[0.08] bg-[#09090B] p-3 font-mono text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 transition-colors focus:border-white/[0.22] focus:outline-none"
                        />

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 font-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                                Presets:
                            </span>
                            {QUICK_STARTERS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onUpdateSystemPrompt(s.systemPrompt)}
                                    className="rounded border border-white/[0.07] bg-[#141418] px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:border-white/[0.16] hover:bg-[#1A1A20] hover:text-zinc-100"
                                >
                                    {s.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Conversation Timeline Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-6"
            >
                {session.messages.length === 0 ? (
                    // Empty State
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-[#121216] text-zinc-300 shadow-sm">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-base font-medium tracking-tight text-zinc-100">
                            New Session
                        </h2>
                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-zinc-500">
                            Connected to <span className="font-mono text-zinc-300">{selectedModel}</span>. Add custom system instructions above or begin your conversation below.
                        </p>

                        <div className="mt-8 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {QUICK_STARTERS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        onUpdateSystemPrompt(item.systemPrompt);
                                        onSendMessage(item.prompt);
                                    }}
                                    className="group flex flex-col items-start rounded-lg border border-white/[0.07] bg-[#101014] p-3.5 text-left transition-all hover:border-white/[0.18] hover:bg-[#15151A]"
                                >
                                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                                        {item.title}
                                    </span>
                                    <span className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 group-hover:text-zinc-400">
                                        {item.prompt}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-4xl space-y-5">
                        {session.messages.map((msg, idx) => {
                            const isUser = msg.role === "user";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col space-y-1.5 animate-fade-in ${
                                        isUser ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[88%] rounded-xl p-4 transition-colors ${
                                            isUser
                                                ? "rounded-tr-xs border border-white/[0.11] bg-[#18181D] text-zinc-100"
                                                : "rounded-tl-xs border border-white/[0.06] bg-[#101014] text-zinc-200"
                                        }`}
                                    >
                                        {/* Message Header */}
                                        <div className="mb-2.5 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-2 select-none">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono font-medium ${
                                                        isUser
                                                            ? "border border-white/[0.1] bg-[#222229] text-zinc-200"
                                                            : "bg-zinc-100 text-zinc-950 font-semibold"
                                                    }`}
                                                >
                                                    {isUser ? "U" : "AI"}
                                                </div>
                                                <span className="font-mono text-[11px] text-zinc-400">
                                                    {isUser ? "You" : selectedModel}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                                className="rounded px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
                                                title="Copy message content"
                                            >
                                                {copiedMessageId === msg.id ? (
                                                    <span className="text-zinc-200">Copied</span>
                                                ) : (
                                                    <span>Copy</span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Formatted Content */}
                                        <FormattedMessageContent content={msg.content} isUser={isUser} />

                                        {/* Message Footer */}
                                        <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2 font-mono text-[10px] text-zinc-500">
                                            <span>{msg.timestamp}</span>

                                            {!isUser && idx === session.messages.length - 1 && !isGenerating && (
                                                <button
                                                    onClick={onRegenerateLastTurn}
                                                    className="flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
                                                    title="Regenerate last response"
                                                >
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                                                    </svg>
                                                    <span>Regenerate</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Generating State */}
                        {isGenerating && (
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-3 rounded-xl rounded-tl-xs border border-white/[0.08] bg-[#101014] px-4 py-3">
                                    <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 font-mono text-[10px] font-semibold text-zinc-950">
                                        AI
                                    </div>
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />
                                    <span className="font-mono text-xs text-zinc-400">
                                        {selectedModel} is generating...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Floor */}
            <div className="shrink-0 border-t border-white/[0.07] bg-[#09090B] p-4 md:px-6 select-none">
                <form
                    onSubmit={handleSubmit}
                    className="relative mx-auto flex max-w-4xl items-end rounded-lg border border-white/[0.09] bg-[#121216] px-3.5 py-2.5 transition-colors focus-within:border-white/[0.24]"
                >
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating}
                        placeholder={
                            isGenerating
                                ? "Waiting for response..."
                                : `Message ${selectedModel}...`
                        }
                        rows={1}
                        className="max-h-48 min-h-[1.75rem] flex-1 resize-none bg-transparent px-1 py-1 font-sans text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isGenerating}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 transition-all hover:bg-white active:scale-95 disabled:scale-100 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:opacity-40"
                        title="Send message"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                        </svg>
                    </button>
                </form>

                <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between px-1 font-mono text-[10px] text-zinc-500">
                    <span>Enter to send · Shift+Enter for new line</span>
                    <span>Context: ~{totalTokens} tokens</span>
                </div>
            </div>
        </div>
    );
};
