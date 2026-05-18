// Shared UI helpers for the CLI.
// - `spinner(text)`     — wrapper around ora with our defaults.
// - `color`             — picocolors instance for direct colour access.
// - `symbol`            — semantic glyphs (success, fail, info).
// - `isTTY()`           — true when stdout is an interactive terminal.
//
// Design rule: anything that writes to stdout AS DATA (snippet code, JSON,
// markdown) must NEVER be coloured here. Only "chrome" output — list rows,
// status messages, success/failure lines — gets colour. That keeps the CLI
// pipe-friendly: `fm show id | bash` and `fm list --json | jq` stay clean.

import ora from 'ora';
import pc from 'picocolors';

export const color = pc;

export const symbol = {
  ok: pc.green('✓'),
  fail: pc.red('✗'),
  info: pc.cyan('ℹ'),
  warn: pc.yellow('⚠'),
  bullet: pc.dim('·'),
};

export function isTTY() {
  return Boolean(process.stdout.isTTY);
}

/**
 * Create a spinner with sensible defaults. ora auto-detects non-TTY contexts
 * (pipes, CI) and silently suppresses the animation there.
 *
 * Usage:
 *   const s = spinner('Loading snippets…').start();
 *   try { ...; s.succeed(`Found ${n}`); }
 *   catch (err) { s.fail(err.message); throw err; }
 */
export function spinner(text) {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
    // Write the spinner to stderr so stdout stays clean for pipes.
    stream: process.stderr,
  });
}
