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

function registerDeterministicTools(server: McpServer): void {
  server.registerTool(
    'qe_get_system_prompt',
    {
      description:
        'Return the assembled QE system prompt for the given mode and output format. Use with the Cursor agent for analysis (no API key).',
      inputSchema: getSystemPromptSchema,
    },
    async (args: z.infer<typeof getSystemPromptSchema>) =>
      handleGetSystemPrompt(args),
  );

  server.registerTool(
    'qe_get_json_schema',
    {
      description:
        'Return the JSON report schema description for structured QE output. No API key required.',
    },
    async () => handleGetJsonSchema(),
  );

  server.registerTool(
    'qe_validate_report',
    {
      description:
        'Parse, Zod-validate, apply evidence guards, and build the report envelope from agent-produced JSON. No API key required.',
      inputSchema: validateReportSchema,
    },
    async (args: z.input<typeof validateReportSchema>) =>
      handleValidateReport(args),
  );

  server.registerTool(
    'qe_save_report',
    {
      description:
        'Write validated JSON envelope and tabbed HTML under docs/qe-analysis/. No API key required.',
      inputSchema: saveReportSchema,
    },
    async (args: z.infer<typeof saveReportSchema>) => handleSaveReport(args),
  );

  server.registerTool(
    'qe_save_markdown',
    {
      description:
        'Write markdown QE analysis under docs/qe-analysis/. No API key required.',
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

  registerDeterministicTools(server);

  console.error(
    'qe-intel MCP: deterministic tools ready (qe_get_system_prompt, qe_validate_report, qe_save_report, qe_save_markdown, qe_get_json_schema).',
  );

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('qe-intel MCP server failed:', err);
  process.exit(1);
});
