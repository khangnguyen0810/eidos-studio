// src/components/chat/StudioPanel.tsx

import React from "react";
import type { ChatSession, UserSettings } from "../../types/chat";
import { estimateTokens, estimateConversationTokens } from "../../utils/tokenEstimator";

interface StudioPanelProps {
    isOpen: boolean;
    onClose: () => void;
    session: ChatSession;
    settings: UserSettings;
    onUpdateSystemPrompt: (prompt: string) => void;
    onUpdateSettings: (newSettings: UserSettings) => void;
    onClearHistory: () => void;
    onOpenFullSettings: () => void;
}

const SYSTEM_PRESETS = [
    {
        label: "Coding Architect",
        prompt: "You are a senior software architect. Write clean, well-structured, production-ready code and explain trade-offs concisely.",
    },
    {
        label: "Concise Expert",
        prompt: "Answer clearly and concisely. Use direct bullet points and avoid unnecessary filler.",
    },
    {
        label: "Writing Editor",
        prompt: "You are a professional editor. Improve clarity, tone, and structure while preserving the author's intent.",
    },
];

export const StudioPanel: React.FC<StudioPanelProps> = ({
    isOpen,
    onClose,
    session,
    settings,
    onUpdateSystemPrompt,
    onUpdateSettings,
    onClearHistory,
    onOpenFullSettings,
}) => {
    if (!isOpen) return null;

    const systemTokens = estimateTokens(session.systemPrompt);
    const totalTokens = estimateConversationTokens(session.systemPrompt, session.messages);

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-2xs lg:hidden"
                onClick={onClose}
            />

            <aside className="fixed right-0 top-0 bottom-0 z-40 flex w-80 shrink-0 flex-col border-l border-zinc-200/80 bg-[#F9F9FB] transition-colors dark:border-white/[0.07] dark:bg-[#0B0B0D] lg:static lg:z-auto select-none">
                {/* Panel Header */}
                <div className="flex h-13 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-white/[0.07]">
                    <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Prompt & Parameters
                    </span>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                        title="Close panel"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Panel Body */}
                <div className="flex-1 space-y-6 overflow-y-auto p-4 text-xs">
                    {/* System Instructions Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                System Instructions
                            </label>
                            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                <span>{systemTokens}t</span>
                                {session.systemPrompt && (
                                    <button
                                        onClick={() => onUpdateSystemPrompt("")}
                                        className="text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:hover:text-zinc-200"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={session.systemPrompt}
                            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                            placeholder="Add custom instructions to shape the assistant's tone, expertise, or output format..."
                            rows={7}
                            className="w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 font-sans text-xs leading-relaxed text-zinc-800 placeholder-zinc-400 shadow-2xs transition-colors focus:border-zinc-400 focus:outline-none dark:border-white/[0.09] dark:bg-[#141418] dark:text-zinc-200 dark:placeholder-zinc-600 dark:focus:border-white/[0.24]"
                        />

                        {/* Subtle Preset Pills */}
                        <div className="space-y-1.5">
                            <span className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                Quick Presets
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {SYSTEM_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => onUpdateSystemPrompt(preset.prompt)}
                                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#141418] dark:text-zinc-400 dark:hover:border-white/[0.16] dark:hover:text-zinc-200"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-zinc-200/80 dark:border-white/[0.06]" />

                    {/* Model & Run Parameters */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                Run Settings
                            </span>
                            <button
                                onClick={onOpenFullSettings}
                                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                                Change Model →
                            </button>
                        </div>

                        {/* Active Model Card */}
                        <div
                            onClick={onOpenFullSettings}
                            className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-2.5 transition-colors hover:border-zinc-300 dark:border-white/[0.08] dark:bg-[#141418] dark:hover:border-white/[0.16]"
                        >
                            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                {settings.provider}
                            </div>
                            <div className="mt-0.5 truncate font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {settings.selectedModel}
                            </div>
                        </div>

                        {/* Temperature Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Temperature
                                </label>
                                <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:bg-white/[0.07] dark:text-zinc-200">
                                    {settings.temperature.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.05}
                                value={settings.temperature}
                                onChange={(e) =>
                                    onUpdateSettings({
                                        ...settings,
                                        temperature: parseFloat(e.target.value),
                                    })
                                }
                                className="w-full cursor-pointer accent-zinc-900 dark:accent-zinc-200"
                            />
                            <div className="flex justify-between font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                                <span>Precise</span>
                                <span>Balanced</span>
                                <span>Creative</span>
                            </div>
                        </div>

                        {/* Max Output Tokens Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Max Output Tokens
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onUpdateSettings({
                                                ...settings,
                                                maxTokens: settings.maxTokens === null ? 4096 : null,
                                            })
                                        }
                                        className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                                            settings.maxTokens === null
                                                ? "bg-zinc-900 text-white font-medium dark:bg-zinc-100 dark:text-zinc-950"
                                                : "bg-zinc-200/80 text-zinc-600 hover:text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-400 dark:hover:text-zinc-200"
                                        }`}
                                    >
                                        {settings.maxTokens === null ? "Unlimited" : "Set Limit"}
                                    </button>
                                    {settings.maxTokens !== null && (
                                        <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-800 dark:bg-white/[0.07] dark:text-zinc-200">
                                            {settings.maxTokens >= 1024
                                                ? `${(settings.maxTokens / 1024).toFixed(settings.maxTokens % 1024 === 0 ? 0 : 1)}k`
                                                : settings.maxTokens}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {settings.maxTokens !== null ? (
                                <>
                                    <input
                                        type="range"
                                        min={256}
                                        max={65536}
                                        step={settings.maxTokens > 16384 ? 2048 : settings.maxTokens > 4096 ? 1024 : 256}
                                        value={settings.maxTokens}
                                        onChange={(e) =>
                                            onUpdateSettings({
                                                ...settings,
                                                maxTokens: parseInt(e.target.value),
                                            })
                                        }
                                        className="w-full cursor-pointer accent-zinc-900 dark:accent-zinc-200"
                                    />
                                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                        {[2048, 4096, 8192, 16384, 32768, 65536].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() =>
                                                    onUpdateSettings({
                                                        ...settings,
                                                        maxTokens: num,
                                                    })
                                                }
                                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                                                    settings.maxTokens === num
                                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium"
                                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
                                                }`}
                                            >
                                                {num >= 1024 ? `${num / 1024}k` : num}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    No output cap applied. Model will generate up to its native capacity or natural completion.
                                </p>
                            )}
                        </div>

                        {/* Reasoning Effort (DeepSeek & Thinking Models) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Reasoning Effort
                                </label>
                                <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                                    {settings.reasoningEffort || (settings.provider === "deepseek" ? "max" : "none")}
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                {(["none", "low", "medium", "high", "max"] as const).map((level) => {
                                    const current = settings.reasoningEffort ?? (settings.provider === "deepseek" ? "max" : "none");
                                    const isSelected = current === level;
                                    return (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() =>
                                                onUpdateSettings({
                                                    ...settings,
                                                    reasoningEffort: level,
                                                })
                                            }
                                            className={`rounded py-1 text-center font-mono text-[10px] uppercase transition-colors ${
                                                isSelected
                                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium"
                                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                DeepSeek thinking mode intensity (<code className="font-mono">reasoning_effort: &quot;max&quot;</code>).
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-zinc-200/80 dark:border-white/[0.06]" />

                    {/* Session Utilities */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>Session Context</span>
                            <span className="font-mono">~{totalTokens} tokens</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClearHistory}
                            disabled={session.messages.length === 0}
                            className="w-full rounded-lg border border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#141418] dark:text-zinc-300 dark:hover:border-white/[0.16] dark:hover:text-zinc-100"
                        >
                            Clear Chat History
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
