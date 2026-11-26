#!/usr/bin/env node
// Build a self-contained copy of the skill: SKILL.md plus the builder, in one folder that can be
// dragged into an agent that only accepts a skill folder (e.g. Doubao Work "上传技能").
//   node scripts/pack-skill.mjs [outDir]     default: standalone-skill/nmr-step-walkthrough
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function pack(out = join(root, 'standalone-skill', 'nmr-step-walkthrough')) {
  rmSync(out, { recursive: true, force: true });
  const b = join(out, 'builder');
  mkdirSync(join(b, 'examples'), { recursive: true });
  for (const f of ['server.mjs', 'SCHEMA.md', 'STYLE-GUIDE.md', 'LICENSE']) cpSync(join(root, f), join(b, f));
  cpSync(join(root, 'lib'), join(b, 'lib'), { recursive: true });
  for (const f of readdirSync(join(root, 'examples')).filter(f => f.endsWith('.json'))) cpSync(join(root, 'examples', f), join(b, 'examples', f));
  const md = readFileSync(join(root, 'skills', 'nmr-step-walkthrough', 'SKILL.md'), 'utf8');
  const from = md.indexOf('2. Otherwise, if this skill sits inside'), to = md.indexOf('\n3. Otherwise hand-write');
  if (from < 0 || to < 0) throw new Error('SKILL.md: build steps not found');
  const step = '2. Otherwise use the builder bundled in this skill folder. Read `builder/SCHEMA.md` and `builder/examples/vanillin.json`, write a spec, and run `node builder/server.mjs --build spec.json out.html --standalone` (needs Node.js 18+, no other dependencies). The method is in `builder/STYLE-GUIDE.md`.';
  writeFileSync(join(out, 'SKILL.md'), md.slice(0, from) + step + md.slice(to));
  return out;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log('packed ' + pack(process.argv[2] && resolve(process.argv[2])));
