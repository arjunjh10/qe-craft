import Anthropic from '@anthropic-ai/sdk';
import {
  ANTHROPIC_MAX_TOKENS,
  ANTHROPIC_MAX_TOKENS_JSON,
  ANTHROPIC_MODEL,
  ANTHROPIC_MODEL_JSON,
  ANTHROPIC_NO_TEXT_ERROR,
  buildSystemPrompt,
  type PromptContext,
} from './core/index.js';

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function runQeAnalysis(
  userMessage: string,
  promptContext: PromptContext,
): Promise<string> {
  const isJson = promptContext.outputFormat === 'json';
  const response = await getClient().messages.create({
    model: isJson ? ANTHROPIC_MODEL_JSON : ANTHROPIC_MODEL,
    max_tokens: isJson ? ANTHROPIC_MAX_TOKENS_JSON : ANTHROPIC_MAX_TOKENS,
    system: buildSystemPrompt(promptContext),
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n');

  if (!text.trim()) {
    throw new Error(ANTHROPIC_NO_TEXT_ERROR);
  }

  return text;
}
