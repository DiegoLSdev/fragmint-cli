// `fm copy <id>` — copy a snippet's code to the system clipboard.

import { requireToken } from '../config.js';
import { copyToClipboard } from '../clipboard.js';
import { findSnippet } from '../snippets.js';
import { spinner, color, symbol } from '../ui.js';

export async function copyCommand(idOrPrefix) {
  const cfg = await requireToken();

  const s = spinner('Copying snippet…').start();
  let snippet;
  try {
    snippet = await findSnippet(cfg, idOrPrefix);
    await copyToClipboard(snippet.code);
  } catch (err) {
    s.fail(err.message);
    throw err;
  }

  s.stop();
  // Custom success line (not s.succeed) so we can colour the title and char count.
  console.log(
    `${symbol.ok} Copied ${color.cyan(`"${snippet.title}"`)} ${color.dim(`(${snippet.code.length} chars)`)}`
  );
}
