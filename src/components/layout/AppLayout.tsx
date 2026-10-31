// src/components/layout/AppLayout.tsx

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { ChatSession } from "../../types/chat";

interface AppLayoutProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    selectedModel: string;
    onSelectSession: (id: string) => void;
    onCreateNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onOpenSettings: () => void;
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    sessions,
    activeSessionId,
    selectedModel,
    onSelectSession,
    onCreateNewSession,
    onDeleteSession,
    onOpenSettings,
    children,
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0B0C0E] font-sans text-zinc-100 antialiased">
            <Header
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                selectedModel={selectedModel}
                onOpenSettings={onOpenSettings}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    isOpen={isSidebarOpen}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    selectedModel={selectedModel}
                    onSelectSession={onSelectSession}
                    onCreateNewSession={onCreateNewSession}
                    onDeleteSession={onDeleteSession}
                    onOpenSettings={onOpenSettings}
                />

                <main className="flex flex-1 flex-col overflow-hidden bg-[#0B0C0E]">
                    {children}
                </main>
            </div>
        </div>
    );
};
