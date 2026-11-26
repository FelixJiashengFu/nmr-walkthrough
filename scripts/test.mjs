// Smoke test: both examples build, a spec without sources is rejected, the MCP server answers.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build, validate } from '../lib/build.mjs';
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
process.exit(fail ? 1 : 0);
