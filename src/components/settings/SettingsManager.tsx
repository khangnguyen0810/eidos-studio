// src/components/settings/SettingsManager.tsx

import React, { useState, useEffect, useRef } from "react";
import type { UserSettings, ChatSession } from "../../types/chat";

interface SettingsManagerProps {
    isOpen: boolean;
    onClose: () => void;
    settings: UserSettings;
    onUpdateSettings: (newSettings: UserSettings) => void;
    sessions: ChatSession[];
    onImportSessions: (sessions: ChatSession[]) => void;
}

const PROVIDER_PRESETS: Record<UserSettings["provider"], {
    name: string;
    defaultModel: string;
    defaultBaseUrl: string;
    models: string[];
    apiKeyUrl?: string;
    apiKeyHint: string;
}> = {
    gemini: {
        name: "Google Gemini",
        defaultModel: "gemini-1.5-flash",
        defaultBaseUrl: "https://generativelanguage.googleapis.com",
        models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-flash"],
        apiKeyUrl: "https://aistudio.google.com/app/apikey",
        apiKeyHint: "Google AI Studio Key",
    },
    anthropic: {
        name: "Anthropic Claude",
        defaultModel: "claude-3-5-sonnet-20241022",
        defaultBaseUrl: "https://api.anthropic.com/v1",
        models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
        apiKeyUrl: "https://console.anthropic.com/settings/keys",
        apiKeyHint: "Anthropic Console Key",
    },
    openai: {
        name: "OpenAI",
        defaultModel: "gpt-4o",
        defaultBaseUrl: "https://api.openai.com/v1",
        models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o3-mini"],
        apiKeyUrl: "https://platform.openai.com/api-keys",
        apiKeyHint: "OpenAI API Key",
    },
    deepseek: {
        name: "DeepSeek",
        defaultModel: "deepseek-chat",
        defaultBaseUrl: "https://api.deepseek.com",
        models: ["deepseek-chat", "deepseek-reasoner"],
        apiKeyUrl: "https://platform.deepseek.com/api_keys",
        apiKeyHint: "DeepSeek API Key",
    },
    custom: {
        name: "Custom / Local",
        defaultModel: "llama3",
        defaultBaseUrl: "http://localhost:11434/v1",
        models: ["llama3", "mistral", "qwen2.5", "local-model"],
        apiKeyHint: "Optional for local endpoints",
    },
};

export const SettingsManager: React.FC<SettingsManagerProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    sessions,
    onImportSessions,
}) => {
    const [draft, setDraft] = useState<UserSettings>(settings);
    const [showApiKey, setShowApiKey] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDraft(settings);
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleProviderChange = (provider: UserSettings["provider"]) => {
        const preset = PROVIDER_PRESETS[provider];
        setDraft((prev) => ({
            ...prev,
            provider,
            selectedModel: preset.defaultModel,
            baseUrl: preset.defaultBaseUrl,
        }));
    };

    const handleSave = () => {
        onUpdateSettings(draft);
        showToast("Settings saved");
        setTimeout(() => {
            onClose();
        }, 400);
    };

    const handleExportBackup = () => {
        const backupData = {
            app: "AIStudio",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            sessions,
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${sessions.length} sessions`);
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.sessions && Array.isArray(json.sessions)) {
                    onImportSessions(json.sessions);
                    showToast(`Imported ${json.sessions.length} sessions`);
                } else if (Array.isArray(json)) {
                    onImportSessions(json);
                    showToast(`Imported ${json.length} sessions`);
                } else {
                    alert("Invalid JSON backup file format.");
                }
            } catch {
                alert("Failed to read JSON backup file.");
            }
        };
        reader.readAsText(file);
    };

    const currentPreset = PROVIDER_PRESETS[draft.provider] || PROVIDER_PRESETS.gemini;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs dark:bg-black/75"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl transition-colors dark:border-white/[0.1] dark:bg-[#0E0E12]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex h-13 shrink-0 items-center justify-between border-b border-zinc-200/80 px-6 dark:border-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                        <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Model & API Configuration
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-15 left-1/2 -translate-x-1/2 z-10 rounded-md border border-zinc-200 bg-zinc-900 px-3.5 py-1.5 font-mono text-[11px] text-white shadow-lg dark:border-white/[0.14] dark:bg-[#18181D] dark:text-zinc-200">
                        {toastMessage}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
                    {/* Provider Selection */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                            Provider
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {(Object.keys(PROVIDER_PRESETS) as UserSettings["provider"][]).map((pKey) => {
                                const preset = PROVIDER_PRESETS[pKey];
                                const isSelected = draft.provider === pKey;
                                return (
                                    <button
                                        key={pKey}
                                        type="button"
                                        onClick={() => handleProviderChange(pKey)}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                            isSelected
                                                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white/[0.28] dark:bg-[#1A1A20] dark:text-zinc-100"
                                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-white/[0.07] dark:bg-[#09090B] dark:text-zinc-400 dark:hover:border-white/[0.15] dark:hover:text-zinc-200"
                                        }`}
                                    >
                                        <span className="text-xs font-medium">
                                            {preset.name}
                                        </span>
                                        {isSelected && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-200" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block font-mono text-[10px] font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                                {currentPreset.name} API Key
                            </label>
                            {currentPreset.apiKeyUrl && (
                                <a
                                    href={currentPreset.apiKeyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-100 dark:hover:decoration-zinc-400"
                                >
                                    {currentPreset.apiKeyHint} →
                                </a>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={draft.apiKey}
                                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                                placeholder={draft.provider === "custom" ? "Optional for local endpoints" : "Enter your API key..."}
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 pr-16 font-mono text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-white/[0.09] dark:bg-[#09090B] dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/[0.24]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                                {showApiKey ? "Hide" : "Show"}
                            </button>
                        </div>
                        <p className="mt-1.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                            Stored locally in browser storage; requests are sent directly from client to provider.
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                            Model Identifier
                        </label>
                        <input
                            type="text"
                            value={draft.selectedModel}
                            onChange={(e) => setDraft({ ...draft, selectedModel: e.target.value })}
                            placeholder="e.g. gemini-1.5-flash"
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-white/[0.09] dark:bg-[#09090B] dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/[0.24]"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">Presets:</span>
                            {currentPreset.models.map((modelName) => (
                                <button
                                    key={modelName}
                                    type="button"
                                    onClick={() => setDraft({ ...draft, selectedModel: modelName })}
                                    className={`rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                                        draft.selectedModel === modelName
                                            ? "border-zinc-900 bg-zinc-900 text-white font-medium dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-white/[0.07] dark:bg-[#141418] dark:text-zinc-400 dark:hover:border-white/[0.16] dark:hover:text-zinc-200"
                                    }`}
                                >
                                    {modelName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Base URL (Advanced) */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                            Base Endpoint <span className="font-normal text-zinc-400 normal-case dark:text-zinc-600">(Optional / Proxies)</span>
                        </label>
                        <input
                            type="text"
                            value={draft.baseUrl}
                            onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                            placeholder={currentPreset.defaultBaseUrl}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-white/[0.09] dark:bg-[#09090B] dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/[0.24]"
                        />
                    </div>

                    {/* Parameters: Temperature & Max Tokens */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-white/[0.07] dark:bg-[#121216]">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-mono text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                                    Temperature
                                </label>
                                <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-200">
                                    {draft.temperature.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.05}
                                value={draft.temperature}
                                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
                                className="w-full cursor-pointer accent-zinc-900 dark:accent-zinc-200"
                            />
                            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                                <span>0.0 Exact</span>
                                <span>1.0</span>
                                <span>2.0 Creative</span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-white/[0.07] dark:bg-[#121216]">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-mono text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                                    Max Output Tokens
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDraft({
                                                ...draft,
                                                maxTokens: draft.maxTokens === null ? 4096 : null,
                                            })
                                        }
                                        className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                                            draft.maxTokens === null
                                                ? "bg-zinc-900 text-white font-medium dark:bg-zinc-100 dark:text-zinc-950"
                                                : "bg-zinc-200/80 text-zinc-600 hover:text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-400 dark:hover:text-zinc-200"
                                        }`}
                                    >
                                        {draft.maxTokens === null ? "Unlimited" : "Set Limit"}
                                    </button>
                                    {draft.maxTokens !== null && (
                                        <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-200">
                                            {draft.maxTokens >= 1024
                                                ? `${(draft.maxTokens / 1024).toFixed(draft.maxTokens % 1024 === 0 ? 0 : 1)}k`
                                                : draft.maxTokens}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {draft.maxTokens !== null ? (
                                <>
                                    <input
                                        type="range"
                                        min={256}
                                        max={65536}
                                        step={draft.maxTokens > 16384 ? 2048 : draft.maxTokens > 4096 ? 1024 : 256}
                                        value={draft.maxTokens}
                                        onChange={(e) =>
                                            setDraft({ ...draft, maxTokens: parseInt(e.target.value) })
                                        }
                                        className="w-full cursor-pointer accent-zinc-900 dark:accent-zinc-200"
                                    />
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {[2048, 4096, 8192, 16384, 32768, 65536].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setDraft({ ...draft, maxTokens: num })}
                                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                                                    draft.maxTokens === num
                                                        ? "bg-zinc-900 text-white font-medium dark:bg-zinc-100 dark:text-zinc-950"
                                                        : "bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:text-zinc-200"
                                                }`}
                                            >
                                                {num >= 1024 ? `${num / 1024}k` : num}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    Unlimited: Output length will not be constrained, allowing models to generate full responses up to their maximum context limits.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Data Backup & Restore */}
                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-white/[0.07] dark:bg-[#121216]">
                        <div className="mb-2.5 font-mono text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                            Workspace Data
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportBackup}
                                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-white/[0.09] dark:bg-[#18181D] dark:text-zinc-300 dark:hover:border-white/[0.18] dark:hover:text-zinc-100"
                            >
                                Export History (JSON)
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-white/[0.09] dark:bg-[#18181D] dark:text-zinc-300 dark:hover:border-white/[0.18] dark:hover:text-zinc-100"
                            >
                                Import Backup
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-t border-zinc-200/80 px-6 dark:border-white/[0.07]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-zinc-200 bg-transparent px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.09] dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
