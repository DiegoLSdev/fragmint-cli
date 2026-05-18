# `fm` — the Fragmint CLI

A small, pipe-friendly command-line client for [Fragmint](https://fragmint.dev).
Search, save, and reuse code snippets from your terminal.

```
$ fm search docker
abc123ef  docker compose up [bash] · ops
def45678  Dockerfile node 18 [docker] · ops

$ fm show abc123 | bash
$ fm copy def45678
✓ Copied "Dockerfile node 18" to clipboard (412 chars)

$ cat ~/.zshrc | fm save --title=zshrc --category=dotfiles
✓ Saved "zshrc" — id: 9af0c1e2
```

## Install

`fm` is published to the npm registry. **Any** modern JavaScript package
manager that talks to the npm registry can install it — pick whichever
you already use:

```bash
# npm
npm install -g @fragmint/cli

# pnpm — see "first-time pnpm" note below
pnpm add -g @fragmint/cli

# yarn
yarn global add @fragmint/cli

# bun
bun add -g @fragmint/cli
```

All four download the same tarball from `registry.npmjs.org`. Requires
Node.js 18 or newer.

> ⚠️ **Common gotcha**: `npm install @fragmint/cli` (without `-g`)
> installs the package as a **local** dependency in your current
> directory, not as a CLI on your PATH. The `fm` command will not work.
> Always use `-g` for the global install. Same for pnpm, yarn, and bun.

### First-time pnpm users

pnpm requires a one-time setup of its global directory before `-g`
installs work. If `fm` is not found after `pnpm add -g`, run:

```bash
pnpm setup            # adds the global dir to your PATH (edits your shell rc)
exec $SHELL           # reload the shell so the new PATH takes effect
pnpm add -g @fragmint/cli
which fm              # should now print a path
```

> The CLI command is `fm` (short, ergonomic). The npm package is
> `@fragmint/cli` because the unscoped `fm` package on npm is taken — a
> common pattern for short CLI binaries.

### Verifying the package before you install

Publishing is hardened with OIDC (GitHub Actions exchanges a short-lived
token with npm — no long-lived `NPM_TOKEN` lives anywhere). Cryptographic
**provenance attestations** are attached to every release so you can
independently verify the source that produced the tarball:

```bash
# Check the published version + maintainer
npm view @fragmint/cli

# Confirm only one maintainer (dlsdev)
npm view @fragmint/cli maintainers

# Verify provenance attestation
npm view @fragmint/cli --json | jq .dist.attestations
```
See [`SECURITY.md`](https://github.com/DiegoLSdev/fragmint-cli/blob/main/SECURITY.md)
for the full security model.

### Installing without postinstall scripts (extra paranoid)

The CLI declares **no** `postinstall`, `preinstall`, or `prepare`
scripts. You can confirm by installing with scripts disabled:

```bash
npm install -g @fragmint/cli --ignore-scripts
# or
pnpm add -g @fragmint/cli --ignore-scripts
```

`fm --version` will still work. If a future release ever needs install
scripts, we'll call it out in the release notes.

## Login

The CLI authenticates with personal access tokens, not your password.

1. Open the Fragmint web app and go to **Settings → API Tokens**.
2. Click **Create token**, give it a name (e.g. `laptop`), and copy the value.
3. Run `fm login` and paste the token when prompted.

```bash
$ fm login
Logging in to https://fragmint.dev
Create a token in the web app: Settings → API Tokens → Create token.

Paste your token: ***************
✓ Logged in. Token saved to /home/you/.config/fragmint/config.json
```

The token is validated against the server before being saved. You can
revoke it any time from the Settings page; revoked tokens stop working
immediately.

### Where the token is stored

| Platform   | Path                                                   |
| ---------- | ------------------------------------------------------ |
| Linux/macOS | `$XDG_CONFIG_HOME/fragmint/config.json` (default `~/.config/fragmint/config.json`) |
| Windows    | `%APPDATA%\fragmint\config.json`                       |

The file is written with mode `0600` (owner-only). The trust model is the
same as `~/.npmrc` and `~/.gitconfig` — anyone with read access to your
home directory can read your tokens. Treat the file accordingly.

### Pointing at a different API

For self-hosted instances or local development:

```bash
fm login --api http://localhost:3000
```

Or set the `FRAGMINT_API` environment variable before the first login.

## Commands

### `fm list`

List your snippets.

```bash
fm list                       # all snippets
fm list --folder ops          # only the "ops" folder
fm list --json                # machine-readable output
```

### `fm search <query>`

Match against title, code, category, notes, and tags. Case-insensitive
substring search.

```bash
fm search "nginx"
fm search "JWT" --json | jq '.[].title'
```

### `fm show <id>`

Print a snippet's data to stdout. ID can be a prefix (8 chars is plenty).
By default prints the code. Flags switch what gets dumped.

```bash
fm show abc12345              # print the code (default)
fm show abc12345 --meta       # prepend title/lang/folder as comments
fm show abc12345 --notes      # print the markdown notes instead of code
fm show abc12345 --json       # print the full snippet object as JSON
fm show abc12345 | bash       # pipe to a shell
fm show abc12345 > script.sh  # redirect to a file
fm show abc12345 --notes | glow    # render notes with a markdown pager
fm show abc12345 --json | jq .tags # extract specific fields
```

`--notes` and `--json` are mutually exclusive (JSON wins if both are
passed). When a snippet has no notes attached, `--notes` prints nothing
to stdout and a small info line to stderr — so scripts can still test
emptiness with `[[ -z "$(fm show id --notes)" ]]`.

### `fm copy <id>`

Copy a snippet's code to the system clipboard.

```bash
fm copy abc12345
```

Requires a clipboard tool to be installed:

| Platform   | Tool                                                |
| ---------- | --------------------------------------------------- |
| macOS      | `pbcopy` (built-in)                                 |
| Windows    | `clip` (built-in)                                   |
| Linux X11  | `xclip` (`apt install xclip`)                       |
| Linux Wayland | `wl-clipboard` (`apt install wl-clipboard`)      |

If the tool isn't available, use `fm show <id>` and pipe it somewhere
useful instead.

### `fm save [file]`

Save a new snippet from a file or stdin. Markdown notes can be attached
inline or from a file.

```bash
# from a file (title and language inferred)
fm save script.js

# explicit title/lang
fm save Dockerfile --title="node 18 base" --lang=docker --category=ops

# from stdin
cat ~/.zshrc | fm save --title=zshrc --category=dotfiles
kubectl get pods -o yaml | fm save --title="prod pods" --lang=yaml

# with inline notes
fm save deploy.sh --title=deploy --notes "Runs before every prod push"

# with markdown notes loaded from a file
fm save deploy.sh --title=deploy --notes-file ./deploy-notes.md
```

When saving from stdin, `--title` is required. When saving from a file,
the title defaults to the filename and the language is inferred from the
extension when possible. `--notes-file` wins over `--notes` if both are
given.

## Exit codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 0    | Success                          |
| 1    | Any error (network, auth, usage) |

Errors are printed to stderr. Successful output goes to stdout, so
piping (`fm show id | bash`) does the right thing.

## Scripting examples

```bash
# Open the most recent snippet matching "deploy" in $EDITOR
id=$(fm search deploy --json | jq -r '.[0].id')
fm show "$id" > /tmp/deploy && $EDITOR /tmp/deploy

# Append a snippet to a fresh shell session
echo "alias dc='fm show $(fm search docker-compose --json | jq -r .[0].id)'" >> ~/.zshrc

# Back up all snippets as JSON
fm list --json > fragmint-backup.json
```

## Logging out

There's no `fm logout` — just delete the config file:

```bash
rm ~/.config/fragmint/config.json   # Linux/macOS
del %APPDATA%\fragmint\config.json  # Windows
```

Or revoke the token from the web app, which is the preferred method
since it kills the token everywhere immediately.

## Reporting issues

This CLI talks to the same API as the web app. If something doesn't
work, check the web app first — if it works there, it's a CLI bug;
if it doesn't, it's a server bug. Open an issue at
<https://github.com/DiegoLSdev/fragmint-cli> with the command you ran
and the error you saw.
