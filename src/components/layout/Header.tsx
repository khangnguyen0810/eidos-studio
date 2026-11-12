// src/components/layout/Header.tsx

import React from "react";

interface HeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    selectedModel: string;
    isSystemPromptActive: boolean;
    systemPromptTokens: number;
    onToggleSystemPrompt: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    isSidebarOpen,
    onToggleSidebar,
    selectedModel,
    isSystemPromptActive,
    systemPromptTokens,
    onToggleSystemPrompt,
    isDark,
    onToggleTheme,
    onOpenSettings,
}) => {
    return (
        <header className="relative flex h-13 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-3 md:px-4 backdrop-blur-md transition-colors dark:border-white/[0.07] dark:bg-[#0E0E10]/90 select-none">
            {/* Left Section: Sidebar Toggle & Model Pill */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleSidebar}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
                    title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {/* Model Selector Pill (ChatGPT / Claude style) */}
                <button
                    onClick={onOpenSettings}
                    className="group flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-200 hover:bg-zinc-100/80 dark:text-zinc-200 dark:hover:border-white/[0.09] dark:hover:bg-[#16161B]"
                    title="Change active model or provider"
                >
                    <span className="font-sans text-xs font-semibold">{selectedModel}</span>
                    <svg className="h-3 w-3 text-zinc-400 transition-transform group-hover:translate-y-0.5 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            </div>

            {/* Right Section: System Prompt Toggle, Theme Toggle & Settings */}
            <div className="flex items-center gap-1.5">
                {/* System Prompt Pill */}
                <button
                    onClick={onToggleSystemPrompt}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        isSystemPromptActive
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-2xs dark:border-white dark:bg-white dark:text-zinc-950"
                            : "border-zinc-200/80 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-[#141418] dark:text-zinc-400 dark:hover:border-white/[0.16] dark:hover:text-zinc-200"
                    }`}
                    title="Toggle System Instructions Drawer"
                >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                    <span>System Prompt</span>
                    {systemPromptTokens > 0 && (
                        <span className={`rounded-sm px-1 py-0.2 font-mono text-[10px] ${
                            isSystemPromptActive
                                ? "bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950"
                                : "bg-zinc-200/80 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-300"
                        }`}>
                            {systemPromptTokens}t
                        </span>
                    )}
                </button>

                {/* Quick Light / Dark Theme Button */}
                <button
                    onClick={onToggleTheme}
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {/* Settings Button */}
                <button
                    onClick={onOpenSettings}
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
                    title="Settings"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.826 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </header>
    );
};
