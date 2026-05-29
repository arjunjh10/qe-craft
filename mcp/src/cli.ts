#!/usr/bin/env node
import { runInit, runSetup } from './setup.js';

const subcommand = process.argv[2];

if (subcommand === 'setup') {
  const exitCode = await runSetup(process.argv.slice(3));
  process.exit(exitCode);
}

if (subcommand === 'init') {
  const exitCode = await runInit(process.argv.slice(3));
  process.exit(exitCode);
}

if (subcommand === undefined) {
  await import('./server.js');
} else if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
  printCliHelp();
  process.exit(0);
} else {
  console.error(`Unknown command: ${subcommand}\n`);
  printCliHelp();
  process.exit(1);
}

function printCliHelp(): void {
  console.log(`@qe-craft/mcp — Senior QE MCP server (stdio) + setup CLI

Usage:
  qe-craft-mcp                  Start MCP server (default)
  qe-craft-mcp setup [opts]     Install skills / MCP config for Cursor, Claude, or VS Code
  qe-craft-mcp init [opts]      Alias for setup --ide cursor (legacy)
  qe-craft-mcp help             Show this help

Run "qe-craft-mcp setup --help" for setup options.
`);
}
