// src/utils/aiService.tsx

import type { ChatMessage, UserSettings } from "../types/chat";

export interface AiResponseResult {
    content: string;
    reasoning?: string;
}

/**
 * Sends system prompt and conversation history to the configured AI API provider.
 */
export async function sendAiRequest(
    settings: UserSettings,
    systemPrompt: string,
    historyMessages: ChatMessage[],
): Promise<AiResponseResult> {
    const provider = settings.provider;
    const apiKey = settings.apiKey.trim();
    const hasTokenCap = typeof settings.maxTokens === "number" && settings.maxTokens > 0;

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

            const payload: Record<string, any> = {
                model,
                temperature: settings.temperature ?? 0.7,
                messages: apiMessages,
            };
            if (hasTokenCap) {
                payload.max_tokens = settings.maxTokens;
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                const msg = errJson.error?.message || errJson.message || response.statusText;
                throw new Error(`Gemini API Error (${response.status}): ${msg}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const message = choice?.message;
            const content = message?.content || "No response generated.";
            const reasoning = message?.reasoning_content || message?.reasoning || undefined;

            return { content, reasoning };
        }

        // Native Google Gemini REST Endpoint (default for Google AI Studio keys)
        const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const contents = conversation.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const generationConfig: Record<string, any> = {
            temperature: settings.temperature ?? 0.7,
        };
        if (hasTokenCap) {
            generationConfig.maxOutputTokens = settings.maxTokens;
        }

        const body: Record<string, any> = {
            contents,
            generationConfig,
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

        const parts: any[] = candidate?.content?.parts || [];
        const thoughtParts = parts.filter((p) => p.thought).map((p) => p.text).filter(Boolean);
        const regularParts = parts.filter((p) => !p.thought).map((p) => p.text).filter(Boolean);

        const reasoning = thoughtParts.length > 0 ? thoughtParts.join("\n") : undefined;
        const content = regularParts.length > 0
            ? regularParts.join("\n")
            : parts.map((p) => p.text).filter(Boolean).join("\n") || "No response generated.";

        return { content, reasoning };
    }

    // --- Anthropic Claude ---
    if (provider === "anthropic") {
        const baseUrl = (settings.baseUrl || "https://api.anthropic.com/v1").trim().replace(/\/+$/, "");
        const endpoint = `${baseUrl}/messages`;
        const model = settings.selectedModel || "claude-3-5-sonnet-20241022";

        // Anthropic requires max_tokens in /v1/messages; when Unlimited is selected, use model's max safe ceiling
        const isHighOutputClaude = /3-7|3\.7|claude-4|sonnet-4|opus-4|haiku-4/i.test(model);
        const anthropicMaxTokens = hasTokenCap
            ? settings.maxTokens
            : isHighOutputClaude
                ? 64000
                : 8192;

        const requestBody: Record<string, any> = {
            model,
            max_tokens: anthropicMaxTokens,
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
        const thinkingBlock = data.content?.find((b: any) => b.type === "thinking");

        return {
            content: textBlock?.text || "No response generated.",
            reasoning: thinkingBlock?.thinking,
        };
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

    const isDeepSeek = provider === "deepseek" || /deepseek/i.test(settings.selectedModel || "");
    const model = settings.selectedModel || (provider === "deepseek" ? "deepseek-chat" : "gpt-4o");

    const payload: Record<string, any> = {
        model,
        temperature: settings.temperature ?? 0.7,
        messages: apiMessages,
    };

    if (hasTokenCap) {
        payload.max_tokens = settings.maxTokens;
    }

    // Determine reasoning effort (default to 'max' for DeepSeek if not explicitly set to 'none')
    const reasoningEffort = settings.reasoningEffort ?? (isDeepSeek ? "max" : undefined);

    if (reasoningEffort && reasoningEffort !== "none") {
        payload.reasoning_effort = reasoningEffort;

        // DeepSeek thinking mode configuration (supporting both direct and extra_body schemas)
        payload.extra_body = {
            thinking: {
                type: "enabled",
            },
            reasoning_effort: reasoningEffort,
        };

        payload.thinking = {
            type: "enabled",
        };
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.error?.message || errJson.message || response.statusText;
        throw new Error(`${provider.toUpperCase()} API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const content = message?.content || "";
    const reasoning = message?.reasoning_content || message?.reasoning || choice?.reasoning || undefined;

    return {
        content: content || (reasoning ? "" : "No response generated."),
        reasoning,
    };
}
