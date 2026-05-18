// Shared snippet helpers used by show / copy / future commands.

import { api } from './api.js';

/**
 * Fetch all snippets and find one by exact ID or unique ID prefix.
 *
 * The server currently has no `/api/snippets/:id` endpoint, so we list and
 * filter client-side. With small libraries (<500 snippets per user) the
 * overhead is invisible. Revisit when server-side `?id=` lands.
 */
export async function findSnippet(cfg, idOrPrefix) {
  const data = await api.get(cfg, '/api/snippets');
  const all = Array.isArray(data) ? data : data.snippets || [];
  const matches = all.filter((s) => String(s.id).startsWith(idOrPrefix));

  if (matches.length === 0) {
    throw new Error(`No snippet matching "${idOrPrefix}".`);
  }
  if (matches.length > 1) {
    const titles = matches
      .map((s) => `  ${String(s.id).slice(0, 8)}  ${s.title}`)
      .join('\n');
    throw new Error(
      `Multiple snippets match "${idOrPrefix}":\n${titles}\nUse a longer prefix.`
    );
  }
  return matches[0];
}

/**
 * Format a snippet as a single line for `fm list` / `fm search`.
 * Uses colour when `useColor` is true, plain text otherwise.
 *
 * Output shape:
 *   <id-prefix>  <title>  [<lang>]  · <folder>
 */
export function formatSnippetLine(snippet, { useColor, color }) {
  const id = String(snippet.id).slice(0, 8);
  const lang = snippet.language || '';
  const folder = snippet.category || '';

  if (!useColor) {
    const langPart = lang ? ` [${lang}]` : '';
    const folderPart = folder ? ` · ${folder}` : '';
    return `${id}  ${snippet.title}${langPart}${folderPart}`;
  }

  const langPart = lang ? ` ${color.dim(`[${lang}]`)}` : '';
  const folderPart = folder
    ? ` ${color.dim('·')} ${color.magenta(folder)}`
    : '';
  return `${color.cyan(id)}  ${snippet.title}${langPart}${folderPart}`;
}
