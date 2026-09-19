import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { isModelAllowed } from './chat-policy';

export type LlmProvider = 'ollama' | 'openrouter';
type OpenRouterProviderSort = 'price' | 'throughput' | 'latency';

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

export function getProvider(): LlmProvider {
    const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
    if (provider !== 'ollama' && provider !== 'openrouter') {
        throw new ConfigurationError('LLM_PROVIDER must be set to "ollama" or "openrouter".');
    }
    return provider;
}

export function getModel() {
    const model = process.env.LLM_MODEL?.trim();
    if (!model) {
        throw new ConfigurationError('LLM_MODEL is missing.');
    }
    if (!isModelAllowed(model)) {
        throw new ConfigurationError('LLM_MODEL is not included in LLM_ALLOWED_MODELS.');
    }
    return model;
}

function getOpenRouterProviderSort(): OpenRouterProviderSort {
    const sort = process.env.OPENROUTER_PROVIDER_SORT?.trim().toLowerCase();
    return sort === 'price' || sort === 'latency' ? sort : 'throughput';
}

function getBooleanEnvironmentVariable(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.trim().toLowerCase();
    if (!value) {
        return defaultValue;
    }
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    throw new ConfigurationError(`${name} must be set to "true" or "false".`);
}

function getCsvEnvironmentVariable(name: string): string[] | undefined {
    const value = process.env[name]?.trim();
    if (!value) {
        return undefined;
    }

    const entries = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    return entries.length > 0 ? entries : undefined;
}

function isOpenRouterReasoningEnabled(): boolean {
    return process.env.OPENROUTER_REASONING?.trim().toLowerCase() === 'true';
}

function createOpenRouterChatModel(model: string): LanguageModel {
    const apiKey = process.env.LLM_API_KEY?.trim();
    if (!apiKey) {
        throw new ConfigurationError('LLM_API_KEY is missing for the remote OpenAI-compatible provider.');
    }

    const openrouter = createOpenRouter({
        apiKey,
        headers: {
            ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
            ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
        },
    });

    const quantizations = getCsvEnvironmentVariable('OPENROUTER_QUANTIZATIONS');
    const ignoredProviders = getCsvEnvironmentVariable('OPENROUTER_IGNORE_PROVIDERS');

    // Reasoning tokens and load-balanced routing are the most common causes of slow,
    // inconsistent responses for interactive/quiz-style chats through OpenRouter. Default to
    // a low-effort/fast routing configuration unless the operator opts back into full reasoning.
    // Requiring requested parameters keeps tool-calling requests on compatible providers. The
    // environment switch is an emergency rollback if the free-provider pool becomes too small.
    return openrouter.chat(model, {
        ...(isOpenRouterReasoningEnabled() ? {} : { reasoning: { effort: 'low' as const } }),
        provider: {
            sort: getOpenRouterProviderSort(),
            allow_fallbacks: true,
            require_parameters: getBooleanEnvironmentVariable('OPENROUTER_REQUIRE_PARAMETERS', true),
            ...(quantizations ? { quantizations } : {}),
            ...(ignoredProviders ? { ignore: ignoredProviders } : {}),
        },
        usage: { include: true },
    });
}

function createOllamaChatModel(model: string): LanguageModel {
    const baseUrl = process.env.OLLAMA_BASE_URL?.trim().replace(/\/$/, '');
    if (!baseUrl) {
        throw new ConfigurationError('OLLAMA_BASE_URL is missing for the ollama provider.');
    }

    const ollama = createOpenAI({
        apiKey: 'ollama',
        baseURL: `${baseUrl}/v1`,
    });
    return ollama.chat(model);
}

export function getLanguageModel(provider: LlmProvider, model: string): LanguageModel {
    return provider === 'openrouter' ? createOpenRouterChatModel(model) : createOllamaChatModel(model);
}
