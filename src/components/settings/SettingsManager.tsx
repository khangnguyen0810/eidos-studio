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
        apiKeyHint: "Get a free Gemini API key from Google AI Studio",
    },
    anthropic: {
        name: "Anthropic Claude",
        defaultModel: "claude-3-5-sonnet-20241022",
        defaultBaseUrl: "https://api.anthropic.com/v1",
        models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
        apiKeyUrl: "https://console.anthropic.com/settings/keys",
        apiKeyHint: "Anthropic Console API key",
    },
    openai: {
        name: "OpenAI",
        defaultModel: "gpt-4o",
        defaultBaseUrl: "https://api.openai.com/v1",
        models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o3-mini"],
        apiKeyUrl: "https://platform.openai.com/api-keys",
        apiKeyHint: "OpenAI Platform API key",
    },
    deepseek: {
        name: "DeepSeek",
        defaultModel: "deepseek-chat",
        defaultBaseUrl: "https://api.deepseek.com",
        models: ["deepseek-chat", "deepseek-reasoner"],
        apiKeyUrl: "https://platform.deepseek.com/api_keys",
        apiKeyHint: "DeepSeek API key",
    },
    custom: {
        name: "Custom / Local (Ollama, LM Studio)",
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
        showToast("Settings saved successfully!");
        setTimeout(() => {
            onClose();
        }, 500);
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
        showToast(`Exported ${sessions.length} conversations`);
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
                    showToast(`Imported ${json.sessions.length} conversations`);
                } else if (Array.isArray(json)) {
                    onImportSessions(json);
                    showToast(`Imported ${json.length} conversations`);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#121418] shadow-2xl">
                {/* Modal Header */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-6">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h2 className="text-base font-semibold text-zinc-100">Model & API Settings</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 rounded-full border border-emerald-500/40 bg-emerald-950/90 px-4 py-1.5 text-xs text-emerald-300 shadow-lg">
                        {toastMessage}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
                    {/* Provider Selection */}
                    <div>
                        <label className="mb-2 block font-medium text-zinc-300">
                            AI Provider
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
                                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                                            isSelected
                                                ? "border-emerald-500/60 bg-emerald-950/30 text-zinc-100 shadow-sm"
                                                : "border-white/[0.08] bg-[#0E1013] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                                        }`}
                                    >
                                        <span className={`text-xs font-semibold ${isSelected ? "text-emerald-400" : ""}`}>
                                            {preset.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block font-medium text-zinc-300">
                                {currentPreset.name} API Key
                            </label>
                            {currentPreset.apiKeyUrl && (
                                <a
                                    href={currentPreset.apiKeyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 underline hover:text-emerald-300"
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
                                className="w-full rounded-lg border border-white/10 bg-[#0B0C0E] px-3 py-2 pr-16 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-emerald-500/60 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[10px] text-zinc-400 hover:text-zinc-200"
                            >
                                {showApiKey ? "Hide" : "Show"}
                            </button>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-zinc-500">
                            Keys are stored solely in your browser's localStorage and dispatched directly to the provider.
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="mb-1.5 block font-medium text-zinc-300">
                            Model Name
                        </label>
                        <input
                            type="text"
                            value={draft.selectedModel}
                            onChange={(e) => setDraft({ ...draft, selectedModel: e.target.value })}
                            placeholder="e.g. gemini-1.5-flash"
                            className="w-full rounded-lg border border-white/10 bg-[#0B0C0E] px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-emerald-500/60 focus:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="font-mono text-[10px] text-zinc-500">Popular models:</span>
                            {currentPreset.models.map((modelName) => (
                                <button
                                    key={modelName}
                                    type="button"
                                    onClick={() => setDraft({ ...draft, selectedModel: modelName })}
                                    className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                                        draft.selectedModel === modelName
                                            ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-300"
                                            : "border-white/5 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    {modelName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Base URL (Advanced) */}
                    <div>
                        <label className="mb-1.5 block font-medium text-zinc-300">
                            API Base URL <span className="font-normal text-zinc-500">(Optional / Proxies)</span>
                        </label>
                        <input
                            type="text"
                            value={draft.baseUrl}
                            onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                            placeholder={currentPreset.defaultBaseUrl}
                            className="w-full rounded-lg border border-white/10 bg-[#0B0C0E] px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-emerald-500/60 focus:outline-none"
                        />
                    </div>

                    {/* Parameters: Temperature & Max Tokens */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.06] bg-[#0E1013] p-3.5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-medium text-zinc-300">Temperature</label>
                                <span className="font-mono text-emerald-400">{draft.temperature.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.05}
                                value={draft.temperature}
                                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
                                className="w-full accent-emerald-400"
                            />
                            <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
                                <span>0.0 (Deterministic)</span>
                                <span>1.0</span>
                                <span>2.0 (Creative)</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-[#0E1013] p-3.5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-medium text-zinc-300">Max Tokens</label>
                                <span className="font-mono text-emerald-400">{draft.maxTokens}</span>
                            </div>
                            <input
                                type="range"
                                min={256}
                                max={8192}
                                step={256}
                                value={draft.maxTokens}
                                onChange={(e) => setDraft({ ...draft, maxTokens: parseInt(e.target.value) })}
                                className="w-full accent-emerald-400"
                            />
                            <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
                                <span>256</span>
                                <span>4096</span>
                                <span>8192</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Backup & Restore */}
                    <div className="rounded-xl border border-white/[0.06] bg-[#0E1013] p-3.5">
                        <div className="mb-2 font-medium text-zinc-300">Conversation Data</div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportBackup}
                                className="rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                            >
                                Export Chat History (JSON)
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
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
                <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-t border-white/[0.08] px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white active:scale-98"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
