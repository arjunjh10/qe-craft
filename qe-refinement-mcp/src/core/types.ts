import type { z } from 'zod';
import type {
  contextSchema,
  regressionSchema,
  repoUatSchema,
  uatSchema,
} from './schemas.js';

export const QE_MODES = [
  'REFINEMENT',
  'UAT',
  'REPO_UAT',
  'BUG',
  'REGRESSION',
] as const;

export type QeMode = (typeof QE_MODES)[number];

export interface QeRelease {
  type?: string;
  timeline?: string;
  rollback?: string;
  monitoring?: string;
}

export interface QeToolInputs {
  feature: string;
  title: string;
  api_context?: string;
  system_context?: string;
  user_context?: string;
  risks?: string;
  existing_coverage?: string;
  scope_unknown?: boolean;
  completeness?: string;
  save_file?: boolean;
  repo_hints?: string;
  related_repos?: string;
  release?: QeRelease;
}

export interface SaveAnalysisParams {
  mode: QeMode;
  title: string;
  body: string;
  dateUtc: string;
}

export type SaveAnalysisResult =
  | { relativePath: string }
  | { error: string };

export type ContextArgs = z.infer<typeof contextSchema>;
export type UatArgs = z.infer<typeof uatSchema>;
export type RepoUatArgs = z.infer<typeof repoUatSchema>;
export type RegressionArgs = z.infer<typeof regressionSchema>;

export type ToolArgs = ContextArgs | UatArgs | RepoUatArgs | RegressionArgs;
