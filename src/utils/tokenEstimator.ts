// src/utils/tokenEstimator.ts
import type { ChatMessage } from "../types/chat";

/**
 * Roughly estimates token count (approx 4 characters per token for English text)
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    return Math.ceil(trimmed.length / 4);
}

/**
 * Calculates estimated token count for the complete context window (system instructions + message history)
 */
export function estimateConversationTokens(
    systemPrompt: string,
    messages: ChatMessage[],
): number {
    let count = estimateTokens(systemPrompt);
    for (const msg of messages) {
        count += estimateTokens(msg.content) + 4; // Add slight overhead per message turn
    }
    return count;
}
