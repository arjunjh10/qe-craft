import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './core/index.js';

async function main(): Promise<void> {
  console.error(
    'qe-refinement MCP: deterministic tools pending (Phase 1). Use qe-analysis skill for analysis.',
  );

  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('qe-refinement MCP server failed:', err);
  process.exit(1);
});
