// src/components/layout/Sidebar.tsx

import React from "react";
import type { ChatSession } from "../../types/chat";

interface SidebarProps {
    isOpen: boolean;
    sessions: ChatSession[];
    activeSessionId: string | null;
    selectedModel: string;
    onSelectSession: (id: string) => void;
    onCreateNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    sessions,
    activeSessionId,
    selectedModel,
    onSelectSession,
    onCreateNewSession,
    onDeleteSession,
    onOpenSettings,
}) => {
    if (!isOpen) return null;

    return (
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0C0C0F] select-none">
            {/* Header: New Chat Button */}
            <div className="border-b border-white/[0.06] p-3">
                <button
                    onClick={onCreateNewSession}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-950 shadow-xs transition-all hover:bg-white active:scale-[0.99]"
                >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Chat Sessions List */}
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
                <div className="px-2 py-1.5 font-mono text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                    Sessions ({sessions.length})
                </div>

                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                        No conversations yet.
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const messageCount = session.messages.length;

                        return (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group relative flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 transition-colors ${
                                    isActive
                                        ? "border border-white/[0.1] bg-[#16161B] text-zinc-100"
                                        : "border border-transparent text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                                }`}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <svg
                                        className={`h-3.5 w-3.5 shrink-0 ${
                                            isActive ? "text-zinc-300" : "text-zinc-600"
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-medium">
                                            {session.title || "Untitled Chat"}
                                        </div>
                                        <div className="truncate font-mono text-[10px] text-zinc-500">
                                            {messageCount} {messageCount === 1 ? "turn" : "turns"}
                                            {session.systemPrompt ? " · Prompt" : ""}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete conversation "${session.title}"?`)) {
                                            onDeleteSession(session.id);
                                        }
                                    }}
                                    className="rounded p-1 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-950/50 hover:text-red-400"
                                    title="Delete conversation"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Footer: Quick Model info & Settings */}
            <div className="border-t border-white/[0.06] p-3">
                <button
                    onClick={onOpenSettings}
                    className="flex w-full items-center justify-between rounded-md border border-white/[0.07] bg-[#121216] px-2.5 py-2 text-xs text-zinc-300 transition-colors hover:border-white/[0.15] hover:bg-[#17171C] hover:text-zinc-100"
                >
                    <div className="flex items-center gap-2">
                        <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                    </div>
                    <span className="max-w-[90px] truncate font-mono text-[10px] text-zinc-500">
                        {selectedModel}
                    </span>
                </button>
            </div>
        </aside>
    );
};
