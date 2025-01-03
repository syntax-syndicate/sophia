import { OpenAIProvider, createOpenAI } from '@ai-sdk/openai';
import { AiLLM } from '#llm/services/ai-llm';
import { currentUser } from '#user/userService/userContext';
import { LLM } from '../llm';

export const DEEPINFRA_SERVICE = 'deepinfra';

export class Deepinfra extends AiLLM<OpenAIProvider> {
	constructor(
		displayName: string,
		model: string,
		maxTokens: number,
		calculateInputCost: (input: string) => number,
		calculateOutputCost: (output: string) => number,
	) {
		super(displayName, DEEPINFRA_SERVICE, model, maxTokens, calculateInputCost, calculateOutputCost);
	}

	protected apiKey(): string {
		return currentUser().llmConfig.deepinfraKey?.trim() || process.env.DEEPINFRA_API_KEY;
	}

	provider(): OpenAIProvider {
		if (!this.aiProvider) {
			const apiKey = this.apiKey();
			if (!apiKey) throw new Error('No API key provided');
			this.aiProvider = createOpenAI({
				apiKey,
				baseURL: 'https://api.deepinfra.com/v1/openai',
			});
		}
		return this.aiProvider;
	}
}

export function deepinfraLLMRegistry(): Record<string, () => LLM> {
	return {
		[`${DEEPINFRA_SERVICE}:Qwen/QwQ-32B-Preview`]: deepinfraQwQ_32B,
		[`${DEEPINFRA_SERVICE}:Qwen/Qwen2.5-Coder-32B-Instruct`]: deepinfraQwen2_5_Coder32B,
		[`${DEEPINFRA_SERVICE}:Qwen/Qwen2.5-72B-Instruct`]: deepinfraQwen2_5_72B,
	};
}

// https://deepinfra.com/Qwen/QwQ-32B-Preview
export function deepinfraQwQ_32B(): LLM {
	return new Deepinfra(
		'QwQ-32B-Preview (deepinfra)',
		'Qwen/QwQ-32B-Preview',
		32_768,
		(input: string) => (input.length * 0.15) / 1_000_000 / 4,
		(output: string) => (output.length * 0.6) / 1_000_000 / 4,
	);
}

// https://deepinfra.com/Qwen/Qwen2.5-Coder-32B-Instruct
export function deepinfraQwen2_5_Coder32B(): LLM {
	return new Deepinfra(
		'Qwen2.5-Coder-32B-Instruct (deepinfra)',
		'Qwen/Qwen2.5-Coder-32B-Instruct',
		32_768,
		(input: string) => (input.length * 0.08) / 1_000_000 / 4,
		(output: string) => (output.length * 0.18) / 1_000_000 / 4,
	);
}

// https://deepinfra.com/Qwen/Qwen2.5-72B-Instruct
export function deepinfraQwen2_5_72B(): LLM {
	return new Deepinfra(
		'Qwen2.5-72B-Instruct (deepinfra)',
		'Qwen/Qwen2.5-72B-Instruct',
		32_768,
		(input: string) => (input.length * 0.23) / 1_000_000 / 4,
		(output: string) => (output.length * 0.4) / 1_000_000 / 4,
	);
}
