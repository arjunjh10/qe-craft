import { z } from 'zod';
import { EVIDENCE_CONTEXT_MAX_CHARS } from './constants.js';

export const saveFileSchema = z.boolean().default(true);

export const outputFormatSchema = z
  .enum(['markdown', 'json'])
  .default('markdown');

export const evidenceContextSchema = z
  .string()
  .max(EVIDENCE_CONTEXT_MAX_CHARS)
  .optional();

export const toolOutputFields = {
  output_format: outputFormatSchema,
  evidence_context: evidenceContextSchema,
} as const;

export const releaseSchema = z
  .object({
    type: z.string().optional(),
    timeline: z.string().optional(),
    rollback: z.string().optional(),
    monitoring: z.string().optional(),
  })
  .optional();

export const contextSchema = z.object({
  feature: z.string().min(1),
  title: z.string().min(1),
  api_context: z.string().optional(),
  system_context: z.string().optional(),
  user_context: z.string().optional(),
  risks: z.string().optional(),
  existing_coverage: z.string().optional(),
  scope_unknown: z.boolean().optional(),
  completeness: z.string().optional(),
  save_file: saveFileSchema,
  ...toolOutputFields,
});

export const uatSchema = contextSchema.extend({
  release: releaseSchema,
});

export const repoUatSchema = contextSchema.extend({
  repo_hints: z.string().optional(),
  release: releaseSchema,
  related_repos: z.string().optional(),
});

export const regressionSchema = contextSchema.extend({
  related_repos: z.string().optional(),
});

export const toolSchemas = {
  context: contextSchema,
  uat: uatSchema,
  repoUat: repoUatSchema,
  regression: regressionSchema,
} as const;
