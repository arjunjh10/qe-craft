import { z } from 'zod';
import { releaseSchema } from '../core/schemas.js';

export const outputTierSchema = z.enum(['coach', 'full']);

export const outputFormatSchema = z.enum(['markdown', 'json']);

const intelContextFields = {
  feature: z.string().min(1),
  title: z.string().min(1).optional(),
  api_context: z.string().optional(),
  system_context: z.string().optional(),
  user_context: z.string().optional(),
  risks: z.string().optional(),
  existing_coverage: z.string().optional(),
  scope_unknown: z.boolean().optional(),
  completeness: z.string().optional(),
  repo_hints: z.string().optional(),
  related_repos: z.string().optional(),
  output_tier: outputTierSchema.default('coach'),
  output_format: outputFormatSchema.default('markdown'),
  save_file: z.boolean().default(false),
} as const;

export const intelBaseSchema = z.object(intelContextFields);

export const intelUatSchema = intelBaseSchema.extend({
  release: releaseSchema,
});

export const intelRepoUatSchema = intelBaseSchema.extend({
  release: releaseSchema,
});

export const intelRegressionSchema = intelBaseSchema;

export const intelBugSchema = intelBaseSchema;

export const intelReviewSchema = z.object({
  mode: z.enum(['REFINEMENT', 'UAT', 'REPO_UAT', 'BUG', 'REGRESSION']),
  draft_text: z.string().min(1),
  feature: z.string().optional(),
  evidence_context: z.string().optional(),
});

export const intelToolSchemas = {
  refinement: intelBaseSchema,
  uat: intelUatSchema,
  repoUat: intelRepoUatSchema,
  bug: intelBugSchema,
  regression: intelRegressionSchema,
  review: intelReviewSchema,
} as const;
