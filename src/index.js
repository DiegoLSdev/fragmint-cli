#!/usr/bin/env node
// fm — the Fragmint CLI
// =====================
// A small, pipe-friendly CLI for searching, saving, and reusing
// code snippets from the terminal.

import { createRequire } from 'node:module';
import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { showCommand } from './commands/show.js';
import { copyCommand } from './commands/copy.js';
import { saveCommand } from './commands/save.js';
import { symbol } from './ui.js';

const pkg = createRequire(import.meta.url)('../package.json');

const program = new Command();

program
  .name('fm')
  .description('Fragmint CLI — search, save, and reuse code snippets from your terminal')
  .version(pkg.version);

program
  .command('login')
  .description('Save a Fragmint API token (create one in the web app under Settings → API Tokens)')
  .option('--api <url>', 'Override the API base URL (defaults to https://fragmint.dev)')
  .action(loginCommand);

program
  .command('list')
  .description('List your snippets')
  .option('-f, --folder <name>', 'Filter by folder/category')
  .option('--json', 'Output JSON for scripting')
  .action(listCommand);

program
  .command('search <query>')
  .description('Search snippets by title, content, notes or tag')
  .option('--json', 'Output JSON for scripting')
  .action(searchCommand);

program
  .command('show <id>')
  .description("Print a snippet's data to stdout (default: code). Pipe-friendly.")
  .option('--meta', 'Prepend title/language/folder as comments above the code')
  .option('--notes', 'Print the markdown notes instead of the code')
  .option('--json', 'Print the full snippet object as JSON')
  .action(showCommand);

program
  .command('copy <id>')
  .description('Copy a snippet to the system clipboard')
  .action(copyCommand);

program
  .command('save [file]')
  .description('Save a snippet from a file or stdin (e.g. `cat foo.js | fm save --title=foo`)')
  .option('-t, --title <title>', 'Snippet title')
  .option('-l, --lang <language>', 'Language (e.g. javascript, python, bash)', 'plaintext')
  .option('-c, --category <name>', 'Folder/category')
  .option('-n, --notes <text>', 'Inline markdown notes attached to the snippet')
  .option('--notes-file <path>', 'Read markdown notes from a file (wins over --notes)')
  .action(saveCommand);

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`\n${symbol.fail} ${err.message || err}\n`);
  process.exit(1);
});
