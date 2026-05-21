#!/usr/bin/env node
import { runInit } from './init.js';

const subcommand = process.argv[2];

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
  console.log(`qe-refinement-mcp — Senior QE MCP server (stdio) + setup CLI

Usage:
  qe-refinement-mcp              Start MCP server (default for Cursor)
  qe-refinement-mcp init [opts]  Install qe-analysis Cursor skill from this package
  qe-refinement-mcp help         Show this help

Run "qe-refinement-mcp init --help" for init options.
`);
}
