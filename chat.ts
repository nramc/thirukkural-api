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

async function postChat(messages: Message[], stream: boolean | 'text'): Promise<Response> {
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
    const response = await postChat(messages, 'text');
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
    let answer = '';

    while (true) {
        const { done, value } = await reader.read();
        const content = decoder.decode(value, { stream: !done });
        if (content) {
            process.stdout.write(content);
            answer += content;
        }
        if (done) break;
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
