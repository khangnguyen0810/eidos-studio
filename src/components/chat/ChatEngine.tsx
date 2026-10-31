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
        <div className="flex h-full flex-col bg-[#0B0C0E]">
            {/* Top Toolbar */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0E1013]/90 px-4 md:px-6 backdrop-blur-md select-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">
                            {session.title || "Conversation"}
                        </span>
                    </div>

                    <button
                        onClick={onOpenSettings}
                        className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300 transition-colors hover:bg-emerald-900/40"
                        title="Click to change model or API key"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{selectedModel}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                            isSystemPromptOpen
                                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                                : "border-white/10 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Toggle System Instructions panel"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M4.5 6h.008v.008H4.5V6zm0 6h.008v.008H4.5V12zm0 6h.008v.008H4.5V18z" />
                        </svg>
                        <span>System Prompt</span>
                        {systemPromptTokens > 0 && (
                            <span className="rounded bg-white/10 px-1 py-0.2 font-mono text-[10px]">
                                {systemPromptTokens}t
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onClearHistory}
                        disabled={isGenerating || session.messages.length === 0}
                        className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
                        title="Clear conversation messages"
                    >
                        Clear Chat
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="flex items-center justify-between border-b border-rose-500/30 bg-rose-950/80 px-4 py-2.5 text-xs text-rose-300 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenSettings}
                            className="rounded bg-rose-900/60 px-2 py-0.5 text-[11px] font-medium text-rose-200 hover:bg-rose-800"
                        >
                            Open Settings
                        </button>
                        <button
                            onClick={onDismissError}
                            className="rounded px-2 py-0.5 text-[11px] text-rose-400 hover:bg-rose-900/40 hover:text-rose-200"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* System Instructions Panel (Google AI Studio Style) */}
            {isSystemPromptOpen && (
                <div className="shrink-0 border-b border-white/[0.08] bg-[#111317] p-4 md:px-6">
                    <div className="mx-auto max-w-4xl space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                                    <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    System Instructions
                                </label>
                                <span className="font-mono text-[11px] text-zinc-500">
                                    (Guides model behavior across the conversation)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                                <span>{systemPromptTokens} tokens</span>
                                {session.systemPrompt && (
                                    <button
                                        onClick={() => onUpdateSystemPrompt("")}
                                        className="text-zinc-500 hover:text-zinc-300"
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
                            placeholder="Optional: Add system instructions to direct model behavior (e.g., 'You are a helpful assistant that explains concepts concisely with code examples.'). Leave empty for standard conversational responses."
                            rows={3}
                            className="w-full rounded-lg border border-white/10 bg-[#0B0C0E] p-2.5 font-mono text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 transition-colors focus:border-emerald-500/60 focus:outline-none"
                        />

                        {/* Quick Presets for System Instructions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="font-mono text-[10px] text-zinc-500">Quick Presets:</span>
                            {QUICK_STARTERS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onUpdateSystemPrompt(s.systemPrompt)}
                                    className="rounded border border-white/5 bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300 transition-colors hover:border-emerald-500/30 hover:bg-zinc-700 hover:text-zinc-100"
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
                className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-6"
            >
                {session.messages.length === 0 ? (
                    // Empty State: Welcoming Screen
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 shadow-lg shadow-emerald-950/20">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-zinc-100">
                            Chat & Prompt Studio
                        </h2>
                        <p className="mt-1 max-w-md text-xs text-zinc-400">
                            Start conversing with {selectedModel}. Add custom System Instructions above to guide responses without any rigid template.
                        </p>

                        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                            {QUICK_STARTERS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        onUpdateSystemPrompt(item.systemPrompt);
                                        onSendMessage(item.prompt);
                                    }}
                                    className="group flex flex-col items-start rounded-xl border border-white/[0.08] bg-[#111317] p-3 text-left transition-all hover:border-emerald-500/40 hover:bg-[#16181E]"
                                >
                                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                                        {item.title}
                                    </span>
                                    <span className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                                        {item.prompt}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-4xl space-y-6">
                        {session.messages.map((msg, idx) => {
                            const isUser = msg.role === "user";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col space-y-1.5 ${
                                        isUser ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[88%] rounded-2xl p-4 shadow-md transition-all ${
                                            isUser
                                                ? "rounded-tr-xs border border-white/20 bg-zinc-100 text-zinc-950"
                                                : "rounded-tl-xs border border-white/[0.08] bg-[#14171C] text-zinc-100"
                                        }`}
                                    >
                                        {/* Message Header */}
                                        <div
                                            className={`mb-2.5 flex items-center justify-between border-b pb-1.5 select-none ${
                                                isUser ? "border-zinc-300/60" : "border-white/[0.08]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                        isUser
                                                            ? "bg-zinc-800 text-zinc-100"
                                                            : "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                                                    }`}
                                                >
                                                    {isUser ? "U" : "AI"}
                                                </div>
                                                <span className="font-mono text-[11px] font-medium text-zinc-400">
                                                    {isUser ? "You" : selectedModel}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                                                    isUser
                                                        ? "text-zinc-600 hover:text-zinc-900"
                                                        : "text-zinc-400 hover:text-zinc-200"
                                                }`}
                                                title="Copy message content"
                                            >
                                                {copiedMessageId === msg.id ? (
                                                    <span className="text-emerald-500 font-semibold">Copied!</span>
                                                ) : (
                                                    <span>Copy</span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Formatted Content */}
                                        <FormattedMessageContent content={msg.content} isUser={isUser} />

                                        {/* Message Footer */}
                                        <div
                                            className={`mt-2.5 flex items-center justify-between border-t pt-1.5 font-mono text-[10px] ${
                                                isUser ? "border-zinc-300/40 text-zinc-500" : "border-white/[0.06] text-zinc-500"
                                            }`}
                                        >
                                            <span>{msg.timestamp}</span>

                                            {!isUser && idx === session.messages.length - 1 && !isGenerating && (
                                                <button
                                                    onClick={onRegenerateLastTurn}
                                                    className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-emerald-400"
                                                    title="Regenerate last response"
                                                >
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
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
                            <div className="flex flex-col items-start space-y-1.5">
                                <div className="flex items-center gap-3 rounded-2xl rounded-tl-xs border border-emerald-500/20 bg-[#14171C] px-4 py-3 shadow-lg">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-[10px] font-bold text-emerald-400">
                                        AI
                                    </div>
                                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                                    <span className="font-mono text-xs text-emerald-300">
                                        {selectedModel} is thinking...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Floor */}
            <div className="shrink-0 border-t border-white/[0.08] bg-[#0E1013]/90 p-4 md:px-6 backdrop-blur-md select-none">
                <form
                    onSubmit={handleSubmit}
                    className="relative mx-auto flex max-w-4xl items-end rounded-xl border border-white/[0.1] bg-[#14171C] px-3.5 py-2.5 shadow-inner transition-colors focus-within:border-emerald-500/50"
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
                                : `Message ${selectedModel}... (Enter to send, Shift + Enter for new line)`
                        }
                        rows={1}
                        className="max-h-48 min-h-[1.75rem] flex-1 resize-none bg-transparent px-1 py-1 font-sans text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isGenerating}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 transition-all hover:bg-white active:scale-95 disabled:scale-100 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:opacity-30"
                        title="Send message"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                        </svg>
                    </button>
                </form>

                <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between px-2 font-mono text-[10px] text-zinc-500">
                    <span>Shift + Enter for new line</span>
                    <span>Context: ~{totalTokens} tokens</span>
                </div>
            </div>
        </div>
    );
};
