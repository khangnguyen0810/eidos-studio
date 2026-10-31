// src/utils/aiService.tsx

import type { ChatMessage, UserSettings } from "../types/chat";

/**
 * Sends system prompt and conversation history to the configured AI API provider.
 */
export async function sendAiRequest(
    settings: UserSettings,
    systemPrompt: string,
    historyMessages: ChatMessage[],
): Promise<string> {
    const provider = settings.provider;
    const apiKey = settings.apiKey.trim();

    // Pre-validation check for providers requiring an API key
    if (provider !== "custom" && !apiKey) {
        throw new Error(
            `Missing API Key for ${provider.toUpperCase()}. Please configure your API key in Settings.`,
        );
    }

    // Filter chat history to user and assistant turns
    const conversation = historyMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

    if (conversation.length === 0) {
        throw new Error("Cannot send an empty conversation.");
    }

    // --- Google Gemini (Native API or OpenAI-compatible) ---
    if (provider === "gemini") {
        const baseUrl = (settings.baseUrl || "https://generativelanguage.googleapis.com").trim().replace(/\/+$/, "");
        const model = settings.selectedModel || "gemini-1.5-flash";

        // If user specified an OpenAI-compatible endpoint explicitly:
        if (baseUrl.includes("/chat/completions") || baseUrl.includes("/openai")) {
            const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
            const apiMessages: Array<{ role: string; content: string }> = [];
            if (systemPrompt && systemPrompt.trim()) {
                apiMessages.push({ role: "system", content: systemPrompt.trim() });
            }
            apiMessages.push(...conversation);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    temperature: settings.temperature ?? 0.7,
                    max_tokens: settings.maxTokens || 2048,
                    messages: apiMessages,
                }),
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                const msg = errJson.error?.message || errJson.message || response.statusText;
                throw new Error(`Gemini API Error (${response.status}): ${msg}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "No response generated.";
        }

        // Native Google Gemini REST Endpoint (default for Google AI Studio keys)
        const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const contents = conversation.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const body: Record<string, any> = {
            contents,
            generationConfig: {
                temperature: settings.temperature ?? 0.7,
                maxOutputTokens: settings.maxTokens || 2048,
            },
        };

        if (systemPrompt && systemPrompt.trim()) {
            body.system_instruction = {
                parts: [{ text: systemPrompt.trim() }],
            };
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const msg = errJson.error?.message || response.statusText;
            throw new Error(`Gemini API Error (${response.status}): ${msg}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (candidate?.finishReason === "SAFETY") {
            throw new Error("Response blocked by Gemini safety filters.");
        }

        const text = candidate?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n");
        return text || "No response generated.";
    }

    // --- Anthropic Claude ---
    if (provider === "anthropic") {
        const baseUrl = (settings.baseUrl || "https://api.anthropic.com/v1").trim().replace(/\/+$/, "");
        const endpoint = `${baseUrl}/messages`;

        const requestBody: Record<string, any> = {
            model: settings.selectedModel || "claude-3-5-sonnet-20241022",
            max_tokens: settings.maxTokens || 2048,
            temperature: settings.temperature ?? 0.7,
            messages: conversation,
        };

        if (systemPrompt && systemPrompt.trim()) {
            requestBody.system = systemPrompt.trim();
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const msg = errJson.error?.message || response.statusText;
            throw new Error(`Anthropic API Error (${response.status}): ${msg}`);
        }

        const data = await response.json();
        const textBlock = data.content?.find((b: any) => b.type === "text");
        return textBlock?.text || "No response generated.";
    }

    // --- OpenAI / DeepSeek / Custom (Compatible Chat Completions) ---
    let endpoint = (settings.baseUrl || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
    if (!endpoint.endsWith("/chat/completions")) {
        endpoint = `${endpoint}/chat/completions`;
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const apiMessages: Array<{ role: string; content: string }> = [];
    if (systemPrompt && systemPrompt.trim()) {
        apiMessages.push({ role: "system", content: systemPrompt.trim() });
    }
    apiMessages.push(...conversation);

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: settings.selectedModel || (provider === "deepseek" ? "deepseek-chat" : "gpt-4o"),
            temperature: settings.temperature ?? 0.7,
            max_tokens: settings.maxTokens || 2048,
            messages: apiMessages,
        }),
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.error?.message || errJson.message || response.statusText;
        throw new Error(`${provider.toUpperCase()} API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    return resultText || "No response generated.";
}
