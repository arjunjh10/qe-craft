import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runQeAnalysis } from './anthropic-client.js';
import { saveAnalysis, saveRawFailure, saveReportEnvelope } from './file-writer.js';
import {
  formatJsonReportFailureMessage,
  buildValidationContextFromInputs,
  formatJsonReportSuccessSummary,
  runJsonReportPipeline,
} from './json-report-pipeline.js';
import {
  API_KEY_MISSING_MESSAGE,
  CHAT_ONLY_FOOTER,
  ENV_ANTHROPIC_API_KEY,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  QE_TOOL_DEFINITIONS,
  buildUserMessage,
  contextSchema,
  resolvePromptContext,
  regressionSchema,
  repoUatSchema,
  saveFailedFooter,
  savedToFooter,
  uatSchema,
  type QeMode,
  type QeToolInputs,
  type ToolArgs,
} from './core/index.js';

const [refinement, uat, repoUat, bug, regression] = QE_TOOL_DEFINITIONS;

function toInputs(args: ToolArgs): QeToolInputs {
  return args;
}

async function handleQeTool(mode: QeMode, args: QeToolInputs) {
  const userMessage = buildUserMessage(mode, args);
  const promptContext = resolvePromptContext(mode, {
    outputFormat: args.output_format,
    relatedRepos: args.related_repos,
    scopeUnknown: args.scope_unknown,
  });
  const dateUtc = new Date().toISOString().slice(0, 10);
  const saveFile = args.save_file !== false;

  if (args.output_format === 'json') {
    const validationContext = buildValidationContextFromInputs(args);
    const result = await runJsonReportPipeline({
      userMessage,
      promptContext,
      validationContext,
    });

    if (!result.ok) {
      let responseText = formatJsonReportFailureMessage(result.errors);
      if (saveFile) {
        const saved = await saveRawFailure({
          mode,
          title: args.title,
          dateUtc,
          rawText: result.rawText,
        });
        if ('relativePath' in saved) {
          responseText = formatJsonReportFailureMessage(
            result.errors,
            saved.relativePath,
          );
        } else {
          responseText += saveFailedFooter(saved.error);
        }
      } else {
        responseText += CHAT_ONLY_FOOTER;
      }
      return { content: [{ type: 'text' as const, text: responseText }] };
    }

    let responseText = formatJsonReportSuccessSummary(result.envelope);
    if (saveFile) {
      const saved = await saveReportEnvelope({
        mode,
        title: args.title,
        dateUtc,
        envelope: result.envelope,
      });
      if ('relativePath' in saved) {
        responseText = formatJsonReportSuccessSummary(
          result.envelope,
          saved.relativePath,
        );
      } else {
        responseText += saveFailedFooter(saved.error);
      }
    } else {
      responseText += CHAT_ONLY_FOOTER;
    }
    return { content: [{ type: 'text' as const, text: responseText }] };
  }

  let responseText = await runQeAnalysis(userMessage, promptContext);

  if (saveFile) {
    const result = await saveAnalysis({
      mode,
      title: args.title,
      body: responseText,
      dateUtc,
    });

    if ('relativePath' in result) {
      responseText += savedToFooter(result.relativePath);
    } else {
      responseText += saveFailedFooter(result.error);
    }
  } else {
    responseText += CHAT_ONLY_FOOTER;
  }

  return { content: [{ type: 'text' as const, text: responseText }] };
}

async function main(): Promise<void> {
  if (!process.env[ENV_ANTHROPIC_API_KEY]) {
    console.error(API_KEY_MISSING_MESSAGE);
    process.exit(1);
  }

  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  server.registerTool(
    refinement.name,
    { description: refinement.description, inputSchema: contextSchema },
    async (args) => handleQeTool(refinement.mode, toInputs(args)),
  );

  server.registerTool(
    uat.name,
    { description: uat.description, inputSchema: uatSchema },
    async (args) => handleQeTool(uat.mode, toInputs(args)),
  );

  server.registerTool(
    repoUat.name,
    { description: repoUat.description, inputSchema: repoUatSchema },
    async (args) => handleQeTool(repoUat.mode, toInputs(args)),
  );

  server.registerTool(
    bug.name,
    { description: bug.description, inputSchema: contextSchema },
    async (args) => handleQeTool(bug.mode, toInputs(args)),
  );

  server.registerTool(
    regression.name,
    { description: regression.description, inputSchema: regressionSchema },
    async (args) => handleQeTool(regression.mode, toInputs(args)),
  );

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('qe-refinement MCP server failed:', err);
  process.exit(1);
});
