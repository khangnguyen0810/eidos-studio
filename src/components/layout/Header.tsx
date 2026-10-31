// src/components/layout/Header.tsx

import React from "react";

interface HeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    selectedModel: string;
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    isSidebarOpen,
    onToggleSidebar,
    selectedModel,
    onOpenSettings,
}) => {
    return (
        <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0B0C0E] px-4 select-none">
            {/* Left Section: Sidebar Toggle & Brand */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
                    title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
                        ✦
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-zinc-100">
                        AI Studio
                    </span>
                    <span className="rounded border border-white/[0.06] bg-zinc-800/60 px-1.5 py-0.2 font-mono text-[10px] text-zinc-400">
                        Prompt & Chat
                    </span>
                </div>
            </div>

            {/* Right Section: Model info & Settings Button */}
            <div className="flex items-center gap-2.5">
                <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px]">{selectedModel}</span>
                    <svg className="h-3.5 w-3.5 text-zinc-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </header>
    );
};
