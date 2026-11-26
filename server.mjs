#!/usr/bin/env node
// NMR walkthrough MCP server (no dependencies).
//   node server.mjs                      stdio transport (default)
//   node server.mjs --http [port]        Streamable HTTP transport on /mcp (default port 8765)
//   node server.mjs --build spec.json out.html [--standalone]   CLI
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { build, validate } from './lib/build.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(here, f), 'utf8');

if (process.argv[2] === '--build') {
  const [, , , specPath, outPath] = process.argv;
  if (!specPath || !outPath) { console.error('usage: node server.mjs --build spec.json out.html [--standalone]'); process.exit(2); }
  try {
    const { html, warnings } = build(JSON.parse(readFileSync(specPath, 'utf8')), { format: process.argv.includes('--standalone') ? 'standalone' : 'artifact' });
    writeFileSync(outPath, html);
    for (const w of warnings) console.error('warning: ' + w);
    console.log(`wrote ${outPath} (${html.length} bytes)`);
  } catch (e) { console.error(e.message); process.exit(1); }
  process.exit(0);
}

const SPEC_SCHEMA = { type: 'object', description: 'Walkthrough spec. Call nmr_walkthrough_guide first for the full schema, the teaching method and a complete example.', additionalProperties: true };
const TOOLS = [
  { name: 'nmr_walkthrough_guide',
    description: 'Read this before writing a walkthrough. Ground rule: all data must be real, i.e. taken from the user\'s own spectra or a cited measured source, never recalled from memory. Returns the teaching method (how to order and word the steps), the spec schema, and a complete example spec.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'validate_nmr_walkthrough',
    description: 'Check a walkthrough spec without building it. Returns errors (must fix; a spec without data sources is an error) and warnings (teaching-quality hints, e.g. unassigned peaks, steps without a conclusion).',
    inputSchema: { type: 'object', properties: { spec: SPEC_SCHEMA }, required: ['spec'] } },
  { name: 'build_nmr_walkthrough',
    description: 'Build a click-to-advance, bilingual (中文/English) NMR structure-solving walkthrough as one self-contained HTML page: 1D spectra drawn from the peak list and 2D maps (COSY/HSQC/HMBC...) with zoom and highlighting, a structure that grows step by step with correlation arrows, a running assignment table, read-aloud and a full transcript. Refuses specs without `sources`: every shift, J and cross peak must come from the user\'s spectra or a cited measured source; flag anything else with est / Jest / expected. Returns the file path (and the HTML if return_html is true).',
    inputSchema: { type: 'object', required: ['spec'], properties: {
      spec: SPEC_SCHEMA,
      output_path: { type: 'string', description: 'Where to write the .html file. Default: ./nmr-walkthroughs/<slug>.html (or $NMR_WALKTHROUGH_DIR).' },
      format: { type: 'string', enum: ['artifact', 'standalone'], description: 'artifact (default): a page fragment ready to publish as a Claude Artifact, also opens directly in a browser. standalone: a complete HTML document.' },
      return_html: { type: 'boolean', description: 'Also return the HTML text in the result.' } } } },
];

function call(name, args = {}) {
  if (name === 'nmr_walkthrough_guide')
    return [read('STYLE-GUIDE.md'), '# Spec schema\n\n' + read('SCHEMA.md'), '# Example spec\n\n```json\n' + read('examples/ethyl-crotonate.json') + '\n```'].join('\n\n---\n\n');
  if (name === 'validate_nmr_walkthrough') {
    const r = validate(args.spec);
    return JSON.stringify({ ok: !r.errors.length, ...r }, null, 2);
  }
  if (name === 'build_nmr_walkthrough') {
    const { html, warnings } = build(args.spec, { format: args.format });
    const t = typeof args.spec.title === 'string' ? args.spec.title : args.spec.title.en || args.spec.title.zh;
    const slug = String(args.spec.shortTitle || t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'walkthrough';
    const out = resolve(args.output_path || join(process.env.NMR_WALKTHROUGH_DIR || 'nmr-walkthroughs', slug + '.html'));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    const head = JSON.stringify({ path: out, bytes: html.length, steps: args.spec.steps.length, warnings }, null, 2);
    return args.return_html ? head + '\n\n' + html : head;
  }
  throw new Error('Unknown tool: ' + name);
}

// One JSON-RPC message in, one response out (null for notifications). Shared by both transports.
function handle(msg, { http = false } = {}) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return null; // notification
  const ok = result => ({ jsonrpc: '2.0', id, result });
  if (method === 'initialize') return ok({ protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'nmr-walkthrough', version: '1.2.0' },
    instructions: 'Builds click-to-advance bilingual NMR structure-solving walkthroughs. Call nmr_walkthrough_guide first, write the spec, then build_nmr_walkthrough. All data must be real: use the user\'s own spectra or a cited measured source, list it in spec.sources, and never present recalled or guessed values as measured.' });
  if (method === 'ping') return ok({});
  if (method === 'tools/list') return ok({ tools: TOOLS });
  if (method === 'tools/call') {
    try {
      const args = { ...(params?.arguments || {}) };
      // Over HTTP the caller usually cannot read this machine's disk, so hand the page back in the result.
      if (http && params?.name === 'build_nmr_walkthrough' && args.return_html === undefined) args.return_html = true;
      return ok({ content: [{ type: 'text', text: call(params?.name, args) }] });
    } catch (e) { return ok({ content: [{ type: 'text', text: e.message }], isError: true }); }
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } };
}

if (process.argv.includes('--http')) {
  // Streamable HTTP transport (JSON responses, stateless):  node server.mjs --http [port] [--host 0.0.0.0]
  // For agents that only accept a server URL, e.g. Doubao Work custom connectors. Endpoint: /mcp
  const { createServer } = await import('node:http');
  const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
  const port = Number(arg('--http')) || Number(process.env.PORT) || 8765;
  const host = arg('--host') || '127.0.0.1';
  const token = process.env.NMR_MCP_TOKEN || '';
  const MAX = 4 * 1024 * 1024;
  createServer((req, res) => {
    const reply = (code, body, type = 'application/json') => { res.writeHead(code, { 'content-type': type, 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization, mcp-protocol-version, mcp-session-id', 'access-control-allow-methods': 'POST, OPTIONS' }); res.end(body); };
    const path = (req.url || '/').split('?')[0];
    if (req.method === 'OPTIONS') return reply(204, '');
    if (req.method === 'GET' && (path === '/' || path === '/health')) return reply(200, 'nmr-walkthrough MCP server. POST JSON-RPC to /mcp\n', 'text/plain; charset=utf-8');
    if (path !== '/mcp') return reply(404, '{"error":"not found"}');
    if (req.method !== 'POST') return reply(405, '{"error":"use POST"}');
    if (token && req.headers.authorization !== 'Bearer ' + token) return reply(401, '{"error":"unauthorized"}');
    let body = '', size = 0;
    req.on('data', c => { size += c.length; if (size > MAX) { reply(413, '{"error":"too large"}'); req.destroy(); } else body += c; });
    req.on('end', () => {
      if (res.writableEnded) return;
      let msg; try { msg = JSON.parse(body); } catch { return reply(400, JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })); }
      const out = Array.isArray(msg) ? msg.map(m => handle(m, { http: true })).filter(Boolean) : handle(msg, { http: true });
      if (!out || (Array.isArray(out) && !out.length)) return reply(202, '');
      reply(200, JSON.stringify(out));
    });
  }).listen(port, host, () => {
    console.error(`nmr-walkthrough MCP server listening on http://${host}:${port}/mcp` + (token ? ' (bearer token required)' : ''));
    if (host !== '127.0.0.1' && host !== 'localhost' && !token) console.error('warning: reachable from other machines without a token. Set NMR_MCP_TOKEN to require "Authorization: Bearer <token>".');
  });
} else {
  const send = m => process.stdout.write(JSON.stringify(m) + '\n');
  createInterface({ input: process.stdin }).on('line', line => {
    if (!line.trim()) return;
    let msg; try { msg = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
    const out = handle(msg);
    if (out) send(out);
  });
}
