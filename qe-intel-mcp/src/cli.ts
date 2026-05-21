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
  console.log(`qe-intel-mcp — Senior QE MCP server (stdio) + setup CLI

Usage:
  qe-intel-mcp              Start MCP server (default for Cursor)
  qe-intel-mcp init [opts]  Install qe-analysis Cursor skill from this package
  qe-intel-mcp help         Show this help

Run "qe-intel-mcp init --help" for init options.
`);
}
