// src/types/chat.ts

export type APIProvider = "gemini" | "openai" | "anthropic" | "deepseek" | "custom";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    tokenCount?: number;
}

export interface ChatSession {
    id: string;
    title: string;
    systemPrompt: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface UserSettings {
    provider: APIProvider;
    apiKey: string;
    baseUrl: string;
    selectedModel: string;
    temperature: number;
    maxTokens: number;
}

export interface ModelPreset {
    id: string;
    name: string;
    provider: APIProvider;
    description?: string;
}
