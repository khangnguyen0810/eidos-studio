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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-white/[0.1] bg-[#0E0E12] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex h-13 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
                    <div className="flex items-center gap-2.5">
                        <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h2 className="text-sm font-medium tracking-tight text-zinc-100">
                            Model & API Configuration
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-15 left-1/2 -translate-x-1/2 z-10 rounded-md border border-white/[0.14] bg-[#18181D] px-3.5 py-1.5 font-mono text-[11px] text-zinc-200 shadow-lg">
                        {toastMessage}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
                    {/* Provider Selection */}
                    <div>
                        <label className="mb-2 block font-mono text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
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
                                        className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors ${
                                            isSelected
                                                ? "border-white/[0.28] bg-[#1A1A20] text-zinc-100"
                                                : "border-white/[0.07] bg-[#09090B] text-zinc-400 hover:border-white/[0.15] hover:text-zinc-200"
                                        }`}
                                    >
                                        <span className="text-xs font-medium">
                                            {preset.name}
                                        </span>
                                        {isSelected && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block font-mono text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                                {currentPreset.name} API Key
                            </label>
                            {currentPreset.apiKeyUrl && (
                                <a
                                    href={currentPreset.apiKeyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-zinc-100 hover:decoration-zinc-400"
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
                                className="w-full rounded-md border border-white/[0.09] bg-[#09090B] px-3 py-2 pr-16 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-white/[0.24] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-200"
                            >
                                {showApiKey ? "Hide" : "Show"}
                            </button>
                        </div>
                        <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
                            Stored locally in browser storage; requests are sent directly from client to provider.
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                            Model Identifier
                        </label>
                        <input
                            type="text"
                            value={draft.selectedModel}
                            onChange={(e) => setDraft({ ...draft, selectedModel: e.target.value })}
                            placeholder="e.g. gemini-1.5-flash"
                            className="w-full rounded-md border border-white/[0.09] bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-white/[0.24] focus:outline-none"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-zinc-500">Presets:</span>
                            {currentPreset.models.map((modelName) => (
                                <button
                                    key={modelName}
                                    type="button"
                                    onClick={() => setDraft({ ...draft, selectedModel: modelName })}
                                    className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                                        draft.selectedModel === modelName
                                            ? "border-zinc-100 bg-zinc-100 text-zinc-950 font-medium"
                                            : "border-white/[0.07] bg-[#141418] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200"
                                    }`}
                                >
                                    {modelName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Base URL (Advanced) */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                            Base Endpoint <span className="font-normal text-zinc-600 normal-case">(Optional / Proxies)</span>
                        </label>
                        <input
                            type="text"
                            value={draft.baseUrl}
                            onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                            placeholder={currentPreset.defaultBaseUrl}
                            className="w-full rounded-md border border-white/[0.09] bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-white/[0.24] focus:outline-none"
                        />
                    </div>

                    {/* Parameters: Temperature & Max Tokens */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/[0.07] bg-[#121216] p-3.5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-mono text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                                    Temperature
                                </label>
                                <span className="font-mono text-xs text-zinc-200">{draft.temperature.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.05}
                                value={draft.temperature}
                                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
                                className="w-full accent-zinc-200 cursor-pointer"
                            />
                            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-zinc-600">
                                <span>0.0 Exact</span>
                                <span>1.0</span>
                                <span>2.0 Creative</span>
                            </div>
                        </div>

                        <div className="rounded-lg border border-white/[0.07] bg-[#121216] p-3.5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="font-mono text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                                    Max Tokens
                                </label>
                                <span className="font-mono text-xs text-zinc-200">{draft.maxTokens}</span>
                            </div>
                            <input
                                type="range"
                                min={256}
                                max={8192}
                                step={256}
                                value={draft.maxTokens}
                                onChange={(e) => setDraft({ ...draft, maxTokens: parseInt(e.target.value) })}
                                className="w-full accent-zinc-200 cursor-pointer"
                            />
                            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-zinc-600">
                                <span>256</span>
                                <span>4096</span>
                                <span>8192</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Backup & Restore */}
                    <div className="rounded-lg border border-white/[0.07] bg-[#121216] p-3.5">
                        <div className="mb-2.5 font-mono text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                            Workspace Data
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportBackup}
                                className="rounded-md border border-white/[0.09] bg-[#18181D] px-3 py-1.5 text-zinc-300 transition-colors hover:border-white/[0.18] hover:text-zinc-100"
                            >
                                Export History (JSON)
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-md border border-white/[0.09] bg-[#18181D] px-3 py-1.5 text-zinc-300 transition-colors hover:border-white/[0.18] hover:text-zinc-100"
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
                <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-t border-white/[0.07] px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-white/[0.09] bg-transparent px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-md bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-white active:scale-[0.99]"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
