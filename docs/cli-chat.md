# OpenRouter TypeScript CLI chat

This repository includes a small command-line chat tutorial built with Node.js,
TypeScript, Next.js, and `@openrouter/sdk`. The route supports Ollama for local
development and OpenRouter for deployment.

## Architecture

```text
chat.ts -> POST /api/chat -> app/api/chat/route.ts -> configured LLM provider
```

The CLI acts like a frontend: it sends messages to the Next.js route handler.
The route handler owns provider access and the API key. The key is never sent to
the CLI or browser.

## Setup

The route uses three shared environment variables:

| Variable       | Local Ollama                              | Vercel/OpenRouter   |
| -------------- | ----------------------------------------- | ------------------- |
| `LLM_PROVIDER` | `ollama`                                  | `openrouter`        |
| `LLM_MODEL`    | Installed Ollama model, such as `mistral` | OpenRouter model ID |
| `LLM_API_KEY`  | Not required                              | OpenRouter key      |
| `CHAT_URL`     | `http://localhost:3000/api/chat`          | CLI target URL      |

The local configuration is provided by `.env.local` with
`LLM_PROVIDER=ollama`, `LLM_MODEL=mistral`, and an empty `LLM_API_KEY`. This file
is ignored by Git. To create it from the safe template:

```bash
cp .env.example .env.local
```

### Local development with Ollama

Install Ollama, start it, and download a model:

```bash
ollama serve
ollama pull mistral
```

Start Next.js with the local configuration:

```bash
npm run dev
```

In another terminal, start the CLI:

```bash
npx tsx chat.ts
```

Ollama defaults to `http://localhost:11434`. For a non-default Ollama host,
also set `OLLAMA_BASE_URL` in the Next.js process.

### Vercel with OpenRouter

Add these server-side environment variables in Vercel. Create the key at
[OpenRouter settings](https://openrouter.ai/settings/keys).

```text
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-3.1-flash-lite
LLM_API_KEY=sk-or-v1-...
```

Do not use `NEXT_PUBLIC_` for `LLM_API_KEY`, commit a key, or place it in
`chat.ts`. Redeploy after changing Vercel environment variables.

### Troubleshooting request failures

The provider variables must be available to the **Next.js** process because
`app/api/chat/route.ts` makes the LLM request. Stop the development server and
start it again with the desired configuration:

```bash
LLM_PROVIDER=ollama LLM_MODEL=mistral npm run dev
```

Then run the CLI from a second terminal:

```bash
npx tsx chat.ts
```

The route includes safe provider error detail in its response and logs the same
detail in the Next.js terminal without printing the API key. Confirm Ollama is
running and the model is installed locally, or confirm the OpenRouter model ID,
credits, and key permissions.

## Multi-turn chat

Type a question after `You: `. The assistant response is streamed as it arrives.
The CLI keeps an in-memory `messages` array and sends the complete array with
every request, so follow-up questions can refer to earlier answers. Type `exit`
to close the readline interface cleanly.

Set `LLM_MODEL` to switch models without changing application code. Example
OpenRouter model strings include:

- `openai/gpt-chat-latest`
- `anthropic/claude-sonnet-latest`
- `baidu/cobuddy:free`

## Smoke test

Run the one-message smoke test instead of the interactive loop:

```bash
npx tsx chat.ts --smoke-test
```

It sends:

```text
Say hello in one sentence.
```

The CLI prints `completion.choices[0]?.message.content`, prints
`completion.usage`, and checks that usage includes the camelCase fields
`promptTokens` and `completionTokens`.

## How the route works

For OpenRouter, `app/api/chat/route.ts` uses the named SDK import and creates the
client on the server:

```ts
import { OpenRouter } from '@openrouter/sdk';

const client = new OpenRouter({ apiKey: process.env.LLM_API_KEY });
```

The request parameters are passed inside the `chatRequest` wrapper:

```ts
const completion = await client.chat.send({
    chatRequest: {
        model,
        messages,
        stream: true,
    },
});
```

When streaming is enabled, OpenRouter returns an async iterable of chunks. The
route reads each chunk's `chunk.choices[0]?.delta?.content`. Ollama provides
newline-delimited JSON chunks. The route normalizes both formats into the same
SSE events, and the CLI writes each piece to `process.stdout` immediately.

The smoke test uses `stream: false`, allowing the complete completion to be
returned as JSON. Its usage object uses the SDK's camelCase fields
`promptTokens` and `completionTokens`.
