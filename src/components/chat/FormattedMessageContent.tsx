// src/components/chat/FormattedMessageContent.tsx

import React, { useState } from "react";

interface FormattedMessageContentProps {
    content: string;
    isUser?: boolean;
}

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-900 text-xs shadow-xs dark:border-white/[0.08] dark:bg-[#09090C]">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-3.5 py-1.5 font-mono text-[11px] text-zinc-400 select-none dark:border-white/[0.06] dark:bg-[#121216]">
                <span className="uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500">
                    {language || "code"}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded px-2 py-0.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed text-zinc-100">
                <code>{code}</code>
            </pre>
        </div>
    );
};

function renderInlineText(text: string): React.ReactNode[] {
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
    const parts = text.split(inlineRegex);

    return parts.map((part, index) => {
        if (!part) return null;

        // Inline code: `example`
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            const code = part.slice(1, -1);
            return (
                <code
                    key={index}
                    className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200"
                >
                    {code}
                </code>
            );
        }

        // Bold: **example**
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            const boldText = part.slice(2, -2);
            return (
                <strong key={index} className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {boldText}
                </strong>
            );
        }

        // Italic: *example* or _example_
        if (
            (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
            (part.startsWith("_") && part.endsWith("_") && part.length > 2)
        ) {
            const italicText = part.slice(1, -1);
            return (
                <em key={index} className="italic text-zinc-700 dark:text-zinc-300">
                    {italicText}
                </em>
            );
        }

        return <span key={index}>{part}</span>;
    });
}

export const FormattedMessageContent: React.FC<FormattedMessageContentProps> = ({
    content,
    isUser = false,
}) => {
    if (!content) return null;

    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const sections = content.split(codeBlockRegex);

    return (
        <div
            className={`space-y-2.5 text-sm leading-relaxed ${
                isUser
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-800 dark:text-zinc-200"
            }`}
        >
            {sections.map((section, sIndex) => {
                if (!section) return null;

                // Fenced code block
                if (section.startsWith("```") && section.endsWith("```")) {
                    const match = section.match(/^```(\w*)\n?([\s\S]*?)```$/);
                    const lang = match ? match[1].trim() : "";
                    const code = match ? match[2].trim() : section.slice(3, -3).trim();
                    return <CodeBlock key={sIndex} language={lang} code={code} />;
                }

                // Regular text lines
                const lines = section.split("\n");
                return (
                    <div key={sIndex} className="space-y-1.5">
                        {lines.map((line, lIndex) => {
                            if (line.trim() === "") {
                                return <div key={lIndex} className="h-1.5" />;
                            }

                            // Headers
                            if (line.startsWith("### ")) {
                                return (
                                    <h4 key={lIndex} className="pt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {renderInlineText(line.slice(4))}
                                    </h4>
                                );
                            }
                            if (line.startsWith("## ")) {
                                return (
                                    <h3 key={lIndex} className="pt-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                        {renderInlineText(line.slice(3))}
                                    </h3>
                                );
                            }
                            if (line.startsWith("# ")) {
                                return (
                                    <h2 key={lIndex} className="pt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                                        {renderInlineText(line.slice(2))}
                                    </h2>
                                );
                            }

                            // Blockquote
                            if (line.startsWith("> ")) {
                                return (
                                    <blockquote
                                        key={lIndex}
                                        className="my-1.5 border-l-2 border-zinc-300 pl-3 italic text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                                    >
                                        {renderInlineText(line.slice(2))}
                                    </blockquote>
                                );
                            }

                            // Bullet list
                            if (/^[-*]\s+/.test(line)) {
                                return (
                                    <div key={lIndex} className="flex items-start gap-2.5 pl-1.5">
                                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500 dark:bg-zinc-400" />
                                        <span>{renderInlineText(line.replace(/^[-*]\s+/, ""))}</span>
                                    </div>
                                );
                            }

                            // Numbered list
                            if (/^\d+\.\s+/.test(line)) {
                                const num = line.match(/^(\d+)\.\s+/)?.[1];
                                return (
                                    <div key={lIndex} className="flex items-start gap-2 pl-1.5">
                                        <span className="font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">{num}.</span>
                                        <span>{renderInlineText(line.replace(/^\d+\.\s+/, ""))}</span>
                                    </div>
                                );
                            }

                            // Normal paragraph text
                            return (
                                <p key={lIndex} className="min-h-[1.25rem]">
                                    {renderInlineText(line)}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
