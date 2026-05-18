// `fm save [file]` — save a new snippet from a file or stdin.
//   fm save script.js --title="deploy script"
//   cat config.yml | fm save --title=nginx --lang=yaml --category=ops
//
// Notes (markdown) can be attached via:
//   --notes "<inline text>"      short notes on the command line
//   --notes-file path/to/notes.md  longer markdown, read from a file
// These two are mutually exclusive; --notes-file wins if both are given.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireToken } from '../config.js';
import { api } from '../api.js';
import { spinner, color, symbol } from '../ui.js';

function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

const EXT_TO_LANG = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript',
  '.py': 'python',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
  '.html': 'html', '.htm': 'html',
  '.css': 'css',
  '.json': 'json',
  '.sql': 'sql',
  '.java': 'java',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp', '.h': 'cpp',
  '.go': 'go',
  '.xml': 'xml',
  '.rs': 'rust',
  '.php': 'php',
  '.rb': 'ruby',
  '.lua': 'lua',
};

export async function saveCommand(file, opts) {
  const cfg = await requireToken();

  let code;
  let title = opts.title;
  let language = opts.lang;

  if (file) {
    code = await fs.readFile(file, 'utf8');
    if (!title) title = path.basename(file);
    if (!opts.lang || opts.lang === 'plaintext') {
      const ext = path.extname(file).toLowerCase();
      if (EXT_TO_LANG[ext]) language = EXT_TO_LANG[ext];
    }
  } else {
    code = await readStdin();
    if (!code) {
      throw new Error('No input. Provide a file argument or pipe content via stdin.');
    }
    if (!title) {
      throw new Error('When saving from stdin, --title is required.');
    }
  }

  // Resolve notes: --notes-file wins, then --notes, otherwise empty string.
  let notes = '';
  if (opts.notesFile) {
    notes = await fs.readFile(opts.notesFile, 'utf8');
  } else if (opts.notes) {
    notes = opts.notes;
  }

  const payload = {
    title,
    code,
    language: language || 'plaintext',
    category: opts.category || 'General',
    notes,
    tags: [],
  };

  const s = spinner(`Saving ${color.cyan(`"${title}"`)}…`).start();
  let result;
  try {
    result = await api.post(cfg, '/api/snippets', payload);
  } catch (err) {
    s.fail(err.message);
    throw err;
  }

  s.stop();
  const id = result?.id || result?.snippet?.id || '(saved)';
  const shortId = String(id).slice(0, 8);
  const notesNote = notes ? ` ${color.dim(`(${notes.length} chars of notes)`)}` : '';
  console.log(
    `${symbol.ok} Saved ${color.cyan(`"${title}"`)} ${color.dim('—')} id: ${color.magenta(shortId)}${notesNote}`
  );
}
