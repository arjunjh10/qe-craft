import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { z } from 'zod';
import {
  handleGetJsonSchema,
  handleGetSystemPrompt,
  handleSaveMarkdown,
  handleSaveReport,
  handleValidateReport,
} from './deterministic-tools.js';
import {
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  getSystemPromptSchema,
  saveMarkdownSchema,
  saveReportSchema,
  validateReportSchema,
} from './core/index.js';
import {
  handleIntelBug,
  handleIntelRefinement,
  handleIntelRegression,
  handleIntelRepoUat,
  handleIntelReview,
  handleIntelUat,
} from './intel/handlers.js';
import { intelToolSchemas } from './intel/schemas.js';

function registerIntelTools(server: McpServer): void {
  const intelDescription =
    'Start a guided QE Intel run (coach-first). Returns phased playbook for Cursor to execute. No API key.';

  server.registerTool(
    'qe_intel_refinement',
    {
      description: `${intelDescription} Mode: REFINEMENT (story grooming, AC gaps).`,
      inputSchema: intelToolSchemas.refinement,
    },
    async (args) => handleIntelRefinement(args),
  );

  server.registerTool(
    'qe_intel_uat',
    {
      description: `${intelDescription} Mode: UAT (release GO/NO-GO).`,
      inputSchema: intelToolSchemas.uat,
    },
    async (args) => handleIntelUat(args),
  );

  server.registerTool(
    'qe_intel_repo_uat',
    {
      description: `${intelDescription} Mode: REPO_UAT (no ticket, repo charter).`,
      inputSchema: intelToolSchemas.repoUat,
    },
    async (args) => handleIntelRepoUat(args),
  );

  server.registerTool(
    'qe_intel_bug',
    {
      description: `${intelDescription} Mode: BUG (incident, root cause).`,
      inputSchema: intelToolSchemas.bug,
    },
    async (args) => handleIntelBug(args),
  );

  server.registerTool(
    'qe_intel_regression',
    {
      description: `${intelDescription} Mode: REGRESSION (change impact, retest).`,
      inputSchema: intelToolSchemas.regression,
    },
    async (args) => handleIntelRegression(args),
  );

  server.registerTool(
    'qe_intel_review',
    {
      description:
        'Plain-language critique of a draft QE scenario list or report section. Use before saving artifacts. No API key.',
      inputSchema: intelToolSchemas.review,
    },
    async (args) => handleIntelReview(args),
  );
}

function registerArtifactTools(server: McpServer): void {
  server.registerTool(
    'qe_get_system_prompt',
    {
      description:
        'Return assembled senior-QE prompt (full tier / debug). Prefer qe_intel_* for guided runs.',
      inputSchema: getSystemPromptSchema,
    },
    async (args: z.infer<typeof getSystemPromptSchema>) =>
      handleGetSystemPrompt(args),
  );

  server.registerTool(
    'qe_get_json_schema',
    {
      description: 'JSON report schema (Phase E / full tier). No API key.',
    },
    async () => handleGetJsonSchema(),
  );

  server.registerTool(
    'qe_validate_report',
    {
      description: 'Validate agent JSON + evidence guards (Phase E). No API key.',
      inputSchema: validateReportSchema,
    },
    async (args: z.input<typeof validateReportSchema>) =>
      handleValidateReport(args),
  );

  server.registerTool(
    'qe_save_report',
    {
      description: 'Save validated JSON + HTML under docs/qe-analysis/ (Phase E).',
      inputSchema: saveReportSchema,
    },
    async (args: z.infer<typeof saveReportSchema>) => handleSaveReport(args),
  );

  server.registerTool(
    'qe_save_markdown',
    {
      description: 'Save markdown report under docs/qe-analysis/ (Phase E).',
      inputSchema: saveMarkdownSchema,
    },
    async (args: z.infer<typeof saveMarkdownSchema>) =>
      handleSaveMarkdown(args),
  );
}

async function main(): Promise<void> {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  registerIntelTools(server);
  registerArtifactTools(server);

  console.error(
    'qe-intel MCP: primary qe_intel_* (guided runs); artifact qe_validate_report, qe_save_*; debug qe_get_system_prompt.',
  );

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('qe-intel MCP server failed:', err);
  process.exit(1);
});
