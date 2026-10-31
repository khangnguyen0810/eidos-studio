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
    maxTokens: 2048,
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

        // Determine title if this is the first user turn in the session
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

        // Remove last assistant turn if present
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
        <AppLayout
            sessions={sessions}
            activeSessionId={activeSession.id}
            selectedModel={settings.selectedModel}
            onSelectSession={setActiveSessionId}
            onCreateNewSession={handleCreateNewSession}
            onDeleteSession={handleDeleteSession}
            onOpenSettings={() => setIsSettingsOpen(true)}
        >
            <ChatEngine
                session={activeSession}
                isGenerating={isGenerating}
                errorMessage={errorMessage}
                selectedModel={settings.selectedModel}
                onSendMessage={handleSendMessage}
                onUpdateSystemPrompt={handleUpdateSystemPrompt}
                onClearHistory={handleClearHistory}
                onRegenerateLastTurn={handleRegenerateLastTurn}
                onDismissError={() => setErrorMessage(null)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <SettingsManager
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={setSettings}
                sessions={sessions}
                onImportSessions={handleImportSessions}
            />
        </AppLayout>
    );
}

export default App;
