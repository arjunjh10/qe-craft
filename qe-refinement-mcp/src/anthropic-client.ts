import Anthropic from '@anthropic-ai/sdk';
import {
  ANTHROPIC_MAX_TOKENS,
  ANTHROPIC_MODEL,
  ANTHROPIC_NO_TEXT_ERROR,
  QE_ANALYSIS_SYSTEM_PROMPT,
} from './core/index.js';

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function runQeAnalysis(userMessage: string): Promise<string> {
  const response = await getClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: QE_ANALYSIS_SYSTEM_PROMPT,
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
