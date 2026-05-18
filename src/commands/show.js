// `fm show <id>` — print snippet data to stdout. Pipe-friendly by design.
//
// Defaults to printing the code. Flags switch what gets dumped:
//   --notes       print the markdown notes attached to the snippet
//   --json        print the full snippet object as JSON
//   --meta        prepend title/lang/folder as comments above the code
//
// `--notes` and `--json` are mutually exclusive; `--meta` only applies
// when printing code.

import { requireToken } from '../config.js';
import { findSnippet } from '../snippets.js';

export async function showCommand(idOrPrefix, opts) {
  const cfg = await requireToken();
  // No spinner here on purpose: the output IS the data the caller asked for.
  // Adding chrome would break piping (`fm show id | bash`, `fm show id > f.sh`).
  const snippet = await findSnippet(cfg, idOrPrefix);

  // 1. JSON dump
  if (opts.json) {
    console.log(JSON.stringify(snippet, null, 2));
    return;
  }

  // 2. Notes-only output
  if (opts.notes) {
    const notes = (snippet.notes || '').trim();
    if (!notes) {
      // No notes is an info, not a failure. Print to stderr so stdout stays
      // empty — scripts can still test `[[ -z "$(fm show id --notes)" ]]`.
      process.stderr.write(`(no notes on "${snippet.title}")\n`);
      return;
    }
    process.stdout.write(notes);
    if (!notes.endsWith('\n')) process.stdout.write('\n');
    return;
  }

  // 3. Default — code, optionally with meta header
  if (opts.meta) {
    const commentChar = ['python', 'bash', 'ruby', 'sql', 'yaml'].includes(snippet.language) ? '#' : '//';
    console.log(`${commentChar} ${snippet.title}`);
    if (snippet.language) console.log(`${commentChar} language: ${snippet.language}`);
    if (snippet.category) console.log(`${commentChar} folder: ${snippet.category}`);
    console.log('');
  }

  process.stdout.write(snippet.code);
  if (!snippet.code.endsWith('\n')) process.stdout.write('\n');
}
