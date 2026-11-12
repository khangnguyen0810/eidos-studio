// src/components/layout/AppLayout.tsx

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StudioPanel } from "../chat/StudioPanel";
import type { ChatSession, UserSettings } from "../../types/chat";
import { estimateTokens } from "../../utils/tokenEstimator";

interface AppLayoutProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    settings: UserSettings;
    isDark: boolean;
    onToggleTheme: () => void;
    onSelectSession: (id: string) => void;
    onCreateNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onUpdateSystemPrompt: (prompt: string) => void;
    onUpdateSettings: (newSettings: UserSettings) => void;
    onClearHistory: () => void;
    onOpenSettings: () => void;
    children: (props: { onOpenSystemPrompt: () => void }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    sessions,
    activeSessionId,
    settings,
    isDark,
    onToggleTheme,
    onSelectSession,
    onCreateNewSession,
    onDeleteSession,
    onUpdateSystemPrompt,
    onUpdateSettings,
    onClearHistory,
    onOpenSettings,
    children,
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

    const activeSession =
        sessions.find((s) => s.id === activeSessionId) || sessions[0];
    const systemPromptTokens = activeSession
        ? estimateTokens(activeSession.systemPrompt)
        : 0;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-zinc-900 transition-colors dark:bg-[#0E0E10] dark:text-zinc-100">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onCloseMobile={() => setIsSidebarOpen(false)}
                sessions={sessions}
                activeSessionId={activeSessionId}
                selectedModel={settings.selectedModel}
                isDark={isDark}
                onToggleTheme={onToggleTheme}
                onSelectSession={onSelectSession}
                onCreateNewSession={onCreateNewSession}
                onDeleteSession={onDeleteSession}
                onOpenSettings={onOpenSettings}
            />

            {/* Central Stage */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    selectedModel={settings.selectedModel}
                    isSystemPromptActive={isSystemPromptOpen}
                    systemPromptTokens={systemPromptTokens}
                    onToggleSystemPrompt={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                    isDark={isDark}
                    onToggleTheme={onToggleTheme}
                    onOpenSettings={onOpenSettings}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Chat Area */}
                    <main className="flex flex-1 overflow-hidden">
                        {children({
                            onOpenSystemPrompt: () => setIsSystemPromptOpen(true),
                        })}
                    </main>

                    {/* Studio Panel (Prompt & Parameters Drawer) */}
                    {activeSession && (
                        <StudioPanel
                            isOpen={isSystemPromptOpen}
                            onClose={() => setIsSystemPromptOpen(false)}
                            session={activeSession}
                            settings={settings}
                            onUpdateSystemPrompt={onUpdateSystemPrompt}
                            onUpdateSettings={onUpdateSettings}
                            onClearHistory={onClearHistory}
                            onOpenFullSettings={onOpenSettings}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
