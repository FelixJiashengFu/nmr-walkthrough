#!/usr/bin/env node
// Build dist/nmr-walkthrough.mcpb, a Claude Desktop extension (an MCP Bundle: a zip with manifest.json at its root).
//   node scripts/pack-mcpb.mjs        needs the `zip` command (macOS/Linux; on Windows use Git Bash or WSL)
import { cpSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist'), stage = join(dist, 'mcpb');
rmSync(stage, { recursive: true, force: true });
mkdirSync(join(stage, 'examples'), { recursive: true });
for (const f of ['manifest.json', 'server.mjs', 'package.json', 'SCHEMA.md', 'STYLE-GUIDE.md', 'README.md', 'LICENSE']) cpSync(join(root, f), join(stage, f));
cpSync(join(root, 'lib'), join(stage, 'lib'), { recursive: true });
for (const f of ['ethyl-crotonate.json', 'vanillin.json', 'ibuprofen.json']) cpSync(join(root, 'examples', f), join(stage, 'examples', f));
const out = join(dist, 'nmr-walkthrough.mcpb');
rmSync(out, { force: true });
execFileSync('zip', ['-qr', out, '.'], { cwd: stage, stdio: 'inherit' });
const v = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')).version;
console.log(`wrote ${out} (v${v})`);
