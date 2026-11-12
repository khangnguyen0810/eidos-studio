// src/components/layout/Sidebar.tsx

import React from "react";
import type { ChatSession } from "../../types/chat";

interface SidebarProps {
    isOpen: boolean;
    onCloseMobile?: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    selectedModel: string;
    isDark: boolean;
    onToggleTheme: () => void;
    onSelectSession: (id: string) => void;
    onCreateNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onCloseMobile,
    sessions,
    activeSessionId,
    selectedModel,
    isDark,
    onToggleTheme,
    onSelectSession,
    onCreateNewSession,
    onDeleteSession,
    onOpenSettings,
}) => {
    if (!isOpen) return null;

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-[#F9F9FB] text-zinc-700 transition-colors dark:border-white/[0.07] dark:bg-[#0B0B0D] dark:text-zinc-300 select-none">
            {/* Top Brand & New Chat Button */}
            <div className="space-y-3 p-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 shadow-2xs dark:border-white/[0.12] dark:bg-[#141418] dark:text-zinc-100">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3L21 12L12 21L3 12L12 3Z" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            AI Studio
                        </span>
                    </div>

                    {onCloseMobile && (
                        <button
                            onClick={onCloseMobile}
                            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 md:hidden"
                            title="Close sidebar"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <button
                    onClick={onCreateNewSession}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-2xs transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] dark:border-white/[0.1] dark:bg-[#16161B] dark:text-zinc-100 dark:hover:border-white/[0.18] dark:hover:bg-[#1C1C22]"
                >
                    <span>New Chat</span>
                    <svg className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>
            </div>

            {/* Chat Sessions List */}
            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    Chats
                </div>

                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                        No conversations yet.
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const hasSystemPrompt = Boolean(session.systemPrompt?.trim());

                        return (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 transition-colors ${
                                    isActive
                                        ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-100"
                                        : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
                                }`}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <span className="truncate text-xs font-medium">
                                        {session.title || "Untitled Chat"}
                                    </span>
                                    {hasSystemPrompt && (
                                        <span
                                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
                                            title="Custom System Prompt Active"
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete conversation "${session.title}"?`)) {
                                            onDeleteSession(session.id);
                                        }
                                    }}
                                    className="ml-1 rounded p-1 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-300/70 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-white/[0.08] dark:hover:text-red-400"
                                    title="Delete chat"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.6}
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Controls: Theme Toggle & Settings */}
            <div className="space-y-1.5 border-t border-zinc-200/80 p-3 dark:border-white/[0.06]">
                <button
                    onClick={onToggleTheme}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                    title="Switch appearance theme"
                >
                    <div className="flex items-center gap-2.5">
                        {isDark ? (
                            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        {isDark ? "Dark" : "Light"}
                    </span>
                </button>

                <button
                    onClick={onOpenSettings}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                >
                    <div className="flex items-center gap-2.5">
                        <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>API & Settings</span>
                    </div>
                    <span className="max-w-[76px] truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        {selectedModel}
                    </span>
                </button>
            </div>
        </aside>
    );
};
