// Smoke test: both examples build, a spec without sources is rejected, the MCP server answers.
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build, validate } from '../lib/build.mjs';
import { pack } from './pack-skill.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
for (const ex of ['ethyl-crotonate', 'vanillin', 'ibuprofen']) {
  const spec = JSON.parse(readFileSync(join(root, 'examples', ex + '.json'), 'utf8'));
  const { html, warnings } = build(spec, { format: 'standalone' });
  ok(html.length > 20000 && warnings.length === 0, `${ex}: builds with no warnings`);
  const bare = { ...spec, sources: undefined };
  ok(validate(bare).errors.some(e => e.startsWith('no sources')), `${ex}: rejected without sources`);
  ok(!validate({ ...bare, unverified: true }).errors.length, `${ex}: unverified:true downgrades it to a warning`);
}
const req = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }].map(x => JSON.stringify(x)).join('\n') + '\n';
const r = spawnSync(process.execPath, [join(root, 'server.mjs')], { input: req, encoding: 'utf8' });
const tools = JSON.parse(r.stdout.trim().split('\n')[1]).result.tools.map(t => t.name);
ok(tools.length === 3 && tools.includes('build_nmr_walkthrough'), 'MCP server lists 3 tools');
// The committed standalone skill must match what pack-skill produces from the current sources.
const fresh = pack(mkdtempSync(join(tmpdir(), 'nmr-skill-')));
const same = ['SKILL.md', 'builder/server.mjs', 'builder/lib/build.mjs', 'builder/lib/player.html', 'builder/SCHEMA.md', 'builder/STYLE-GUIDE.md', 'builder/examples/ibuprofen.json']
  .every(f => { try { return readFileSync(join(fresh, f), 'utf8') === readFileSync(join(root, 'standalone-skill', 'nmr-step-walkthrough', f), 'utf8'); } catch { return false; } });
ok(same, 'standalone-skill/ is in sync (run: node scripts/pack-skill.mjs)');
// HTTP transport
const port = 18000 + Math.floor(Math.random() * 2000);
const srv = spawn(process.execPath, [join(root, 'server.mjs'), '--http', String(port)], { stdio: 'ignore' });
try {
  let j;
  for (let i = 0; i < 40 && !j; i++) {
    await new Promise(r => setTimeout(r, 100));
    try { j = await (await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })).json(); } catch {}
  }
  ok(j?.result?.tools?.length === 3, 'HTTP transport lists 3 tools');
} finally { srv.kill(); }
// Every manifest carries the same version.
const ver = f => JSON.parse(readFileSync(join(root, f), 'utf8')).version;
const vs = ['package.json', '.claude-plugin/plugin.json', 'gemini-extension.json', 'manifest.json', 'server.json'].map(ver);
const srvVer = (readFileSync(join(root, 'server.mjs'), 'utf8').match(/version: '([^']+)'/) || [])[1];
const reg = JSON.parse(readFileSync(join(root, 'server.json'), 'utf8'));
ok(new Set([...vs, srvVer, reg.packages[0].version]).size === 1, `all manifests at the same version (${vs.join(', ')}, server ${srvVer})`);
ok(reg.name === JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).mcpName, 'server.json name matches package.json mcpName');
process.exit(fail ? 1 : 0);
