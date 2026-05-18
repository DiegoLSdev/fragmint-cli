// `fm login` — store a Fragmint API token on this machine.
// The token is created in the web app (Settings → API Tokens) and pasted here.
// We validate it by hitting /api/me before writing to disk.

import readline from 'node:readline';
import { writeConfig, readConfig, DEFAULT_API } from '../config.js';
import { api } from '../api.js';
import { spinner, color, symbol } from '../ui.js';

function prompt(question, { silent = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

    if (silent && process.stdin.isTTY) {
      const onData = (char) => {
        char = char.toString();
        if (char === '\n' || char === '\r' || char === '') {
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
        } else {
          process.stdout.write('*');
        }
      };
      process.stdout.write(question);
      process.stdin.on('data', onData);
      rl.question('', (answer) => {
        process.stdin.removeListener('data', onData);
        rl.close();
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

export async function loginCommand(opts) {
  const existing = await readConfig();
  const apiUrl = (opts.api || existing.api || DEFAULT_API).replace(/\/$/, '');

  console.log(`Logging in to ${color.cyan(apiUrl)}`);
  console.log(color.dim('Create a token in the web app: Settings → API Tokens → Create token.\n'));

  const token = (await prompt('Paste your token: ', { silent: true })).trim();
  if (!token) {
    throw new Error('No token provided.');
  }

  const cfg = { api: apiUrl, token };

  const s = spinner('Validating token…').start();
  try {
    await api.get(cfg, '/api/me');
  } catch (err) {
    s.fail(`Token rejected by the server. ${err.message}`);
    throw new Error('Login aborted.');
  }
  s.succeed('Token validated');

  const file = await writeConfig(cfg);
  console.log(`${symbol.ok} Logged in. Token saved to ${color.dim(file)}`);
}
