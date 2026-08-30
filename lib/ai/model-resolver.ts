import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { isModelAllowed } from './chat-policy';

export type LlmProvider = 'ollama' | 'openrouter';

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

function createOpenAICompatibleChatModel(model: string): LanguageModel {
    const apiKey = process.env.LLM_API_KEY?.trim();
    if (!apiKey) {
        throw new ConfigurationError('LLM_API_KEY is missing for the remote OpenAI-compatible provider.');
    }

    const openAICompatible = createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
            ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
            ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
        },
    });
    return openAICompatible.chat(model);
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
    return provider === 'openrouter' ? createOpenAICompatibleChatModel(model) : createOllamaChatModel(model);
}
