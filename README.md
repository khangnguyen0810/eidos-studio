# AI Studio — Simple Chat & System Prompt Studio

A fast, lightweight, client-side conversation and prompt studio inspired by **Google AI Studio**. Chat naturally with modern LLMs and add custom system prompts freely without rigid templates or roleplay boilerplate.

---

## Highlights

- **Google AI Studio Style System Instructions**: Prominent, expandable System Instructions box right above the conversation timeline. Write any freeform system instructions with real-time token budgeting (~4 chars/token).
- **Zero Rigid Templates**: No forced roleplay schemas, persona macros (`{{char}}`, `{{user}}`), lorebook triggers, or mandatory character traits. Pure, unrestricted prompt experimentation.
- **Client-Side BYOK (Bring Your Own Key)**: Directly calls Google Gemini, Anthropic Claude, OpenAI, DeepSeek, or custom local endpoints (Ollama, LM Studio, vLLM). API keys are stored securely in browser `localStorage` and never touch a middleman server.
- **Rich Markdown Formatting**: Clean rendering for code blocks with 1-click copy buttons, syntax tags, bold/italic formatting, blockquotes, lists, and headers.
- **Session Management**: Create multiple conversations, switch seamlessly, clear history, or export/import conversation backups.
- **Model Tuning**: Real-time sliders for temperature (0.0 to 2.0) and max output tokens.

---

## Supported Providers & Models

| Provider | Recommended Models | API Key Source |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.5-flash` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Anthropic** | `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229` | [Anthropic Console](https://console.anthropic.com/settings/keys) |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o1-preview`, `o3-mini` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| **DeepSeek** | `deepseek-chat`, `deepseek-reasoner` | [DeepSeek Platform](https://platform.deepseek.com/api_keys) |
| **Custom / Local** | `llama3`, `mistral`, `qwen2.5`, any local model | Ollama / LM Studio (e.g. `http://localhost:11434/v1`) |

---

## Tech Stack

- **Framework**: React 19 (Vite 8)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Storage**: Browser `localStorage` (Client-side only)

---

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm

### Installation & Run

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
