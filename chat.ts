import readline from 'node:readline';

const CHAT_URL = process.env.CHAT_URL ?? 'http://localhost:3000/api/chat';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type Completion = {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { promptTokens?: number; completionTokens?: number };
};

function printMissingKeyMessage() {
    console.error('OPENROUTER_API_KEY is missing. Create a key at https://openrouter.ai/settings/keys, then start Next.js with it.');
}

async function postChat(messages: Message[], stream: boolean): Promise<Response> {
    return fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream }),
    });
}

async function smokeTest() {
    const response = await postChat([{ role: 'user', content: 'Say hello in one sentence.' }], false);
    if (!response.ok) {
        throw new Error(await response.text());
    }

    const completion = (await response.json()) as Completion;
    console.log(completion.choices?.[0]?.message?.content ?? '');
    console.log('Usage:', completion.usage);
    console.log('Uses camelCase fields:', 'promptTokens' in (completion.usage ?? {}) && 'completionTokens' in (completion.usage ?? {}));
}

async function streamAssistant(messages: Message[]): Promise<string> {
    const response = await postChat(messages, true);
    if (!response.ok) {
        const message = await response.text();
        if (response.status === 500 && message.includes('OPENROUTER_API_KEY')) {
            printMissingKeyMessage();
        }
        throw new Error(message);
    }
    if (!response.body) {
        throw new Error('The chat route returned no response body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';

    const consumeEvent = (event: string) => {
        const data = event
            .split('\n')
            .filter((line) => line.startsWith('data: '))
            .map((line) => line.slice(6))
            .join('');
        if (!data || data === '[DONE]') {
            return data === '[DONE]';
        }

        const payload = JSON.parse(data) as { content?: string; error?: string };
        if (payload.error) {
            throw new Error(payload.error);
        }

        const content = payload.content;
        if (content) {
            process.stdout.write(content);
            answer += content;
        }
        return false;
    };

    while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        if (events.some(consumeEvent) || done) {
            break;
        }
    }
    if (buffer.trim()) {
        consumeEvent(buffer);
    }
    return answer;
}

async function chatLoop() {
    const messages: Message[] = [];
    const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = () => new Promise<string>((resolve) => terminal.question('You: ', resolve));

    try {
        while (true) {
            const input = (await ask()).trim();
            if (input.toLowerCase() === 'exit') {
                break;
            }
            if (!input) {
                continue;
            }

            messages.push({ role: 'user', content: input });
            process.stdout.write('Assistant: ');
            const answer = await streamAssistant(messages);
            process.stdout.write('\n');
            messages.push({ role: 'assistant', content: answer });
        }
    } finally {
        terminal.close();
    }
}

if (process.argv.includes('--smoke-test')) {
    smokeTest().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
} else {
    chatLoop().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
