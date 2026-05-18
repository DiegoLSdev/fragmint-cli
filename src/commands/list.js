// `fm list` — list snippets for the logged-in user.

import { requireToken } from '../config.js';
import { api } from '../api.js';
import { spinner, color, isTTY } from '../ui.js';
import { formatSnippetLine } from '../snippets.js';

export async function listCommand(opts) {
  const cfg = await requireToken();

  const s = spinner('Loading snippets…').start();
  let snippets;
  try {
    const data = await api.get(cfg, '/api/snippets');
    snippets = Array.isArray(data) ? data : data.snippets || [];
  } catch (err) {
    s.fail(err.message);
    throw err;
  }

  if (opts.folder) {
    const needle = opts.folder.toLowerCase();
    snippets = snippets.filter((sn) => (sn.category || '').toLowerCase() === needle);
  }

  // JSON output is a pipe target — never colour it, and use stop() not
  // succeed() so the spinner clears without adding a chrome line.
  if (opts.json) {
    s.stop();
    console.log(JSON.stringify(snippets, null, 2));
    return;
  }

  if (snippets.length === 0) {
    s.stop();
    const tip = opts.folder
      ? `No snippets in folder "${opts.folder}".`
      : 'No snippets yet. Create one with `fm save` or in the web app.';
    console.log(tip);
    return;
  }

  s.succeed(
    `${snippets.length} snippet${snippets.length === 1 ? '' : 's'}${opts.folder ? ` in ${color.magenta(opts.folder)}` : ''}`
  );

  const useColor = isTTY();
  for (const sn of snippets) {
    console.log(formatSnippetLine(sn, { useColor, color }));
  }
}
