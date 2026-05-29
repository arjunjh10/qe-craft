/**
 * Sync mcp/skills → plugin/skills, copy mcp.json → .mcp.json, verify bundle.
 * Run from mcp/: npm run build:plugin
 */
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const mcpRoot = join(__dirname, '..');
const pluginRoot = join(repoRoot, 'plugin');
const skillsSrc = join(mcpRoot, 'skills');
const skillsDest = join(pluginRoot, 'skills');
const mcpJsonPath = join(pluginRoot, 'mcp.json');
const dotMcpJsonPath = join(pluginRoot, '.mcp.json');

async function syncSkills() {
  await rm(skillsDest, { recursive: true, force: true });
  await cp(skillsSrc, skillsDest, { recursive: true });
}

async function syncMcpJson() {
  const content = await readFile(mcpJsonPath, 'utf8');
  await writeFile(dotMcpJsonPath, content, 'utf8');
}

async function main() {
  await syncSkills();
  await syncMcpJson();

  const verifyUrl = pathToFileURL(join(__dirname, 'verify-plugin-bundle.mjs')).href;
  const { verifyPluginBundle } = await import(verifyUrl);
  verifyPluginBundle({ repoRoot, mcpRoot, pluginRoot });
  console.log('build:plugin OK — skills synced, .mcp.json updated, bundle verified');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
