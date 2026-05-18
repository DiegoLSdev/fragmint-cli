// Cross-platform clipboard write without bringing in `clipboardy`.
// Uses pbcopy / xclip / wl-copy / clip.exe depending on the platform.

import { spawn } from 'node:child_process';

function pickCommand() {
  if (process.platform === 'darwin') {
    return { cmd: 'pbcopy', args: [] };
  }
  if (process.platform === 'win32') {
    return { cmd: 'clip', args: [] };
  }
  // Linux/BSD: prefer Wayland, fall back to X11
  if (process.env.WAYLAND_DISPLAY) {
    return { cmd: 'wl-copy', args: [] };
  }
  return { cmd: 'xclip', args: ['-selection', 'clipboard'] };
}

export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const { cmd, args } = pickCommand();
    const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(
          `Clipboard tool '${cmd}' not found. ` +
          (process.platform === 'linux'
            ? 'Install xclip (X11) or wl-clipboard (Wayland), or pipe `fm show <id>` somewhere instead.'
            : 'Pipe `fm show <id>` somewhere instead.')
        ));
      } else {
        reject(err);
      }
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${stderr.trim()}`));
    });

    child.stdin.write(text);
    child.stdin.end();
  });
}
