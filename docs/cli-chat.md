# OpenRouter TypeScript CLI chat

This repository includes a small command-line chat tutorial built with Node.js,
TypeScript, Next.js, and `@openrouter/sdk`.

## Architecture

```text
chat.ts -> POST /api/chat -> app/api/chat/route.ts -> OpenRouter
```

The CLI acts like a frontend: it sends messages to the Next.js route handler.
The route handler owns the OpenRouter client and API key. The key is never sent
to the CLI or browser.

## Setup

Create an OpenRouter key at
[OpenRouter settings](https://openrouter.ai/settings/keys).

Start Next.js with the key in the environment:

```bash
OPENROUTER_API_KEY=sk-or-v1-... npm run dev
```

In another terminal, start the CLI:

```bash
npx tsx chat.ts
```

If `OPENROUTER_API_KEY` is missing, create one at
<https://openrouter.ai/settings/keys> and restart `npm run dev` with the
variable set.

### Troubleshooting request failures

The API key must be available to the **Next.js** process because
`app/api/chat/route.ts` makes the OpenRouter request. Setting the key only when
starting `chat.ts` is not enough. Stop the development server and start it
again with the key:

```bash
OPENROUTER_API_KEY=sk-or-v1-... npm run dev
```

Then run the CLI from a second terminal:

```bash
npx tsx chat.ts
```

The route now includes the provider's safe error detail in its response. Check
the Next.js terminal as well; it logs the same detail without printing the API
key. Confirm the model identifier is valid for your OpenRouter account if the
error mentions the model or provider.

## Multi-turn chat

Type a question after `You: `. The assistant response is streamed as it arrives.
The CLI keeps an in-memory `messages` array and sends the complete array with
every request, so follow-up questions can refer to earlier answers. Type `exit`
to close the readline interface cleanly.

The selected model is the single `MODEL` constant near the top of `chat.ts`:

```ts
const MODEL = 'google/gemini-3.1-flash-lite';
```

Change only that string to switch providers. Example model strings are included
in comments beside it:

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

`app/api/chat/route.ts` uses the named SDK import and creates the client on the
server:

```ts
import { OpenRouter } from '@openrouter/sdk';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
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
route reads each chunk's `chunk.choices[0]?.delta?.content` and forwards each
non-empty piece as an SSE event. The CLI reads those events and writes each
piece to `process.stdout` immediately.

The smoke test uses `stream: false`, allowing the complete completion to be
returned as JSON. Its usage object uses the SDK's camelCase fields
`promptTokens` and `completionTokens`.
