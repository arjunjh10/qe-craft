import type { z } from 'zod';
import type { QeMode } from '../core/types.js';
import type {
  intelBaseSchema,
  intelRepoUatSchema,
  intelReviewSchema,
  intelUatSchema,
} from './schemas.js';

export type OutputTier = 'coach' | 'full';

export type IntelInputStatus = 'ready' | 'needs_input';

export const MODE_TO_INTEL_TOOL: Record<QeMode, string> = {
  REFINEMENT: 'qe_intel_refinement',
  UAT: 'qe_intel_uat',
  REPO_UAT: 'qe_intel_repo_uat',
  BUG: 'qe_intel_bug',
  REGRESSION: 'qe_intel_regression',
};

export type IntelBaseArgs = z.infer<typeof intelBaseSchema>;
export type IntelUatArgs = z.infer<typeof intelUatSchema>;
export type IntelRepoUatArgs = z.infer<typeof intelRepoUatSchema>;
export type IntelReviewArgs = z.infer<typeof intelReviewSchema>;

export type IntelRunArgs = IntelBaseArgs | IntelUatArgs | IntelRepoUatArgs;
