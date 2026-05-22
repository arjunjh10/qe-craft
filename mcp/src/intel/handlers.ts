import type { z } from 'zod';
import type { QeMode } from '../core/types.js';
import { buildIntelRun } from './build-intel-run.js';
import { buildIntelReview } from './review.js';
import type {
  intelBaseSchema,
  intelRepoUatSchema,
  intelReviewSchema,
  intelUatSchema,
} from './schemas.js';

type TextToolResult = { content: [{ type: 'text'; text: string }] };

function textResult(text: string): TextToolResult {
  return { content: [{ type: 'text', text }] };
}

async function handleIntelMode(
  mode: QeMode,
  args: z.infer<typeof intelBaseSchema> &
    Partial<z.infer<typeof intelUatSchema>> &
    Partial<z.infer<typeof intelRepoUatSchema>>,
): Promise<TextToolResult> {
  const body = await buildIntelRun(mode, args);
  return textResult(body);
}

export async function handleIntelRefinement(
  args: z.infer<typeof intelBaseSchema>,
): Promise<TextToolResult> {
  return handleIntelMode('REFINEMENT', args);
}

export async function handleIntelUat(
  args: z.infer<typeof intelUatSchema>,
): Promise<TextToolResult> {
  return handleIntelMode('UAT', args);
}

export async function handleIntelRepoUat(
  args: z.infer<typeof intelRepoUatSchema>,
): Promise<TextToolResult> {
  return handleIntelMode('REPO_UAT', args);
}

export async function handleIntelBug(
  args: z.infer<typeof intelBaseSchema>,
): Promise<TextToolResult> {
  return handleIntelMode('BUG', args);
}

export async function handleIntelRegression(
  args: z.infer<typeof intelBaseSchema>,
): Promise<TextToolResult> {
  return handleIntelMode('REGRESSION', args);
}

export function handleIntelReview(
  args: z.infer<typeof intelReviewSchema>,
): TextToolResult {
  return textResult(buildIntelReview(args));
}
