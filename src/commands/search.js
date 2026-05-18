// `fm search <query>` — match against title, code, category, notes and tags.
// Client-side substring search; revisit with server-side ?q= when volumes grow.

import { requireToken } from '../config.js';
import { api } from '../api.js';
import { spinner, color, isTTY } from '../ui.js';
import { formatSnippetLine } from '../snippets.js';

export async function searchCommand(query, opts) {
  const cfg = await requireToken();

  const s = spinner(`Searching for ${color.cyan(query)}…`).start();
  let all;
  try {
    const data = await api.get(cfg, '/api/snippets');
    all = Array.isArray(data) ? data : data.snippets || [];
  } catch (err) {
    s.fail(err.message);
    throw err;
  }

  const needle = query.toLowerCase();
  const matches = all.filter((sn) => {
    const haystack = [
      sn.title,
      sn.code,
      sn.category,
      sn.notes,
      Array.isArray(sn.tags) ? sn.tags.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });

  if (opts.json) {
    s.stop();
    console.log(JSON.stringify(matches, null, 2));
    return;
  }

  if (matches.length === 0) {
    s.fail(`No matches for "${query}".`);
    return;
  }

  s.succeed(`${matches.length} match${matches.length === 1 ? '' : 'es'} for ${color.cyan(query)}`);

  const useColor = isTTY();
  for (const sn of matches) {
    console.log(formatSnippetLine(sn, { useColor, color }));
  }
}
