// src/App.tsx

import { useState, useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { ChatEngine } from "./components/chat/ChatEngine";
import { SettingsManager } from "./components/settings/SettingsManager";
import { sendAiRequest } from "./utils/aiService";
import type { ChatSession, ChatMessage, UserSettings } from "./types/chat";

const DEFAULT_SETTINGS: UserSettings = {
    provider: "gemini",
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com",
    selectedModel: "gemini-1.5-flash",
    temperature: 0.7,
    maxTokens: null,
};

const INITIAL_SESSION: ChatSession = {
    id: "session-1",
    title: "New Conversation",
    systemPrompt: "",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export function App() {
    // Theme state (Light / Dark)
    const [isDark, setIsDark] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem("ai_studio_theme");
            if (saved === "light") return false;
            if (saved === "dark") return true;
            return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add("dark");
            localStorage.setItem("ai_studio_theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("ai_studio_theme", "light");
        }
    }, [isDark]);

    // Settings state
    const [settings, setSettings] = useState<UserSettings>(() => {
        try {
            const saved = localStorage.getItem("ai_studio_settings") || localStorage.getItem("soul_chamber_settings");
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
            return DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    // Chat sessions state
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem("ai_studio_sessions");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
            return [INITIAL_SESSION];
        } catch {
            return [INITIAL_SESSION];
        }
    });

    const [activeSessionId, setActiveSessionId] = useState<string>(() => {
        return sessions[0]?.id || "session-1";
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Sync settings & sessions to LocalStorage
    useEffect(() => {
        localStorage.setItem("ai_studio_settings", JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem("ai_studio_sessions", JSON.stringify(sessions));
    }, [sessions]);

    const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || INITIAL_SESSION;

    const handleCreateNewSession = () => {
        const newId = `session-${Date.now()}`;
        const newSession: ChatSession = {
            id: newId,
            title: "New Conversation",
            systemPrompt: "",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newId);
        setErrorMessage(null);
    };

    const handleDeleteSession = (sessionId: string) => {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length === 0) {
            const fresh = {
                id: `session-${Date.now()}`,
                title: "New Conversation",
                systemPrompt: "",
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setSessions([fresh]);
            setActiveSessionId(fresh.id);
        } else {
            setSessions(remaining);
            if (activeSessionId === sessionId) {
                setActiveSessionId(remaining[0].id);
            }
        }
    };

    const handleUpdateSystemPrompt = (newPrompt: string) => {
        setSessions((prev) =>
            prev.map((s) =>
                s.id === activeSession.id
                    ? { ...s, systemPrompt: newPrompt, updatedAt: new Date().toISOString() }
                    : s,
            ),
        );
    };

    const handleClearHistory = () => {
        setErrorMessage(null);
        setSessions((prev) =>
            prev.map((s) =>
                s.id === activeSession.id
                    ? { ...s, messages: [], updatedAt: new Date().toISOString() }
                    : s,
            ),
        );
    };

    const handleSendMessage = async (content: string) => {
        setErrorMessage(null);
        const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        const userMessage: ChatMessage = {
            id: `msg-user-${Date.now()}`,
            role: "user",
            content,
            timestamp,
        };

        const currentMessages = activeSession.messages;
        let newTitle = activeSession.title;
        if (currentMessages.length === 0 || activeSession.title === "New Conversation") {
            newTitle = content.trim().slice(0, 36) + (content.length > 36 ? "..." : "");
        }

        const updatedHistory = [...currentMessages, userMessage];

        setSessions((prev) =>
            prev.map((s) =>
                s.id === activeSession.id
                    ? {
                          ...s,
                          title: newTitle,
                          messages: updatedHistory,
                          updatedAt: new Date().toISOString(),
                      }
                    : s,
            ),
        );

        setIsGenerating(true);

        try {
            const aiResponseText = await sendAiRequest(
                settings,
                activeSession.systemPrompt,
                updatedHistory,
            );

            const assistantMessage: ChatMessage = {
                id: `msg-ai-${Date.now()}`,
                role: "assistant",
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === activeSession.id
                        ? {
                              ...s,
                              messages: [...(s.messages || []), assistantMessage],
                              updatedAt: new Date().toISOString(),
                          }
                        : s,
                ),
            );
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to generate response.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateLastTurn = async () => {
        const currentMessages = activeSession.messages;
        if (currentMessages.length === 0) return;

        setErrorMessage(null);

        let sliced = [...currentMessages];
        if (sliced[sliced.length - 1].role === "assistant") {
            sliced = sliced.slice(0, -1);
        }

        if (sliced.length === 0) return;

        setSessions((prev) =>
            prev.map((s) =>
                s.id === activeSession.id
                    ? { ...s, messages: sliced, updatedAt: new Date().toISOString() }
                    : s,
            ),
        );

        setIsGenerating(true);

        try {
            const aiResponseText = await sendAiRequest(
                settings,
                activeSession.systemPrompt,
                sliced,
            );

            const assistantMessage: ChatMessage = {
                id: `msg-ai-${Date.now()}`,
                role: "assistant",
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === activeSession.id
                        ? {
                              ...s,
                              messages: [...s.messages, assistantMessage],
                              updatedAt: new Date().toISOString(),
                          }
                        : s,
                ),
            );
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to regenerate response.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportSessions = (importedList: ChatSession[]) => {
        if (!importedList || importedList.length === 0) return;
        setSessions(importedList);
        setActiveSessionId(importedList[0].id);
    };

    return (
        <>
            <AppLayout
                sessions={sessions}
                activeSessionId={activeSession.id}
                settings={settings}
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
                onSelectSession={setActiveSessionId}
                onCreateNewSession={handleCreateNewSession}
                onDeleteSession={handleDeleteSession}
                onUpdateSystemPrompt={handleUpdateSystemPrompt}
                onUpdateSettings={setSettings}
                onClearHistory={handleClearHistory}
                onOpenSettings={() => setIsSettingsOpen(true)}
            >
                {({ onOpenSystemPrompt }) => (
                    <ChatEngine
                        session={activeSession}
                        isGenerating={isGenerating}
                        errorMessage={errorMessage}
                        selectedModel={settings.selectedModel}
                        onSendMessage={handleSendMessage}
                        onRegenerateLastTurn={handleRegenerateLastTurn}
                        onDismissError={() => setErrorMessage(null)}
                        onOpenSystemPrompt={onOpenSystemPrompt}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                )}
            </AppLayout>

            <SettingsManager
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={setSettings}
                sessions={sessions}
                onImportSessions={handleImportSessions}
            />
        </>
    );
}

export default App;
