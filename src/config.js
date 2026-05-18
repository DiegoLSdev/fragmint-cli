// Cross-platform config storage for the fm CLI.
// Linux/macOS: $XDG_CONFIG_HOME/fragmint/config.json (defaults to ~/.config/fragmint)
// Windows:     %APPDATA%/fragmint/config.json
//
// Stored: { api: <base-url>, token: <plaintext-token> }
// The token sits on disk in plaintext — same trust model as ~/.npmrc and ~/.gitconfig.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_API = process.env.FRAGMINT_API || 'https://fragmint.dev';

function configDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || os.homedir(), 'fragmint');
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, 'fragmint');
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

export async function readConfig() {
  try {
    const raw = await fs.readFile(configPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      api: parsed.api || DEFAULT_API,
      token: parsed.token || null,
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { api: DEFAULT_API, token: null };
    }
    throw err;
  }
}

export async function writeConfig(config) {
  const dir = configDir();
  await fs.mkdir(dir, { recursive: true });
  const file = configPath();
  await fs.writeFile(file, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
  return file;
}

export async function requireToken() {
  const cfg = await readConfig();
  if (!cfg.token) {
    throw new Error("Not logged in. Run `fm login` first (create a token at Settings → API Tokens in the web app).");
  }
  return cfg;
}

export { DEFAULT_API };
