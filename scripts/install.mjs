#!/usr/bin/env node
// Install the MCP server entry and the skill for one coding agent.
//   node scripts/install.mjs <claude|codex|antigravity|qoder|workbuddy|dsh|doubao> [--dry-run]
// It copies skills/nmr-step-walkthrough into the agent's user-level skills folder and adds a
// "nmr-walkthrough" stdio server to the agent's MCP config. Existing entries of other servers are kept.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = join(root, 'server.mjs');
const home = homedir();
const dry = process.argv.includes('--dry-run');
const tool = (process.argv[2] || '').toLowerCase();
const NAME = 'nmr-walkthrough';
const entry = { command: 'node', args: [server] };

const TOOLS = {
  claude:      { skills: join(home, '.claude', 'skills'),            hint: `claude mcp add ${NAME} --scope user -- node "${server}"` },
  codex:       { skills: join(home, '.agents', 'skills'),            toml: join(home, '.codex', 'config.toml') },
  antigravity: { skills: join(home, '.gemini', 'config', 'skills'),  json: join(home, '.gemini', 'config', 'mcp_config.json') },
  qoder:       { skills: join(home, '.qoder', 'skills'),             json: join(home, '.qoder', 'settings.json') },
  workbuddy:   { skills: join(home, '.workbuddy', 'skills'),         json: join(home, '.workbuddy', 'mcp.json') },
  dsh:         { hint: `dsh plugin --profile desktop add "${root}"   (quit the DSH desktop app first; the plugin brings both the server and the skill)` },
  doubao:      { hint: [
    '豆包工作 (Doubao Work) is set up in its own window, not through config files:',
    `  1. Skill: open 豆包电脑版 → 「技能 · 连接器 · 伙伴」 → 「我的技能」 → 「新建」 → 「上传技能」, then drag in this folder:`,
    `       ${join(root, 'standalone-skill', 'nmr-step-walkthrough')}`,
    '     It is self-contained (SKILL.md plus the builder), so the skill works without the connector.',
    '  2. Connector (optional): start the server over HTTP and keep it running:',
    `       node "${server}" --http 8765`,
    '     then 「新建」 → 「新建自定义连接器」: 传输类型 HTTP, 服务器 URL http://127.0.0.1:8765/mcp',
    '     If Doubao Work cannot reach a local address, host the server at a public HTTPS URL and set NMR_MCP_TOKEN (sent as "Authorization: Bearer <token>").',
  ].join('\n  ') },
};

const t = TOOLS[tool];
if (!t) { console.error(`usage: node scripts/install.mjs <${Object.keys(TOOLS).join('|')}> [--dry-run]`); process.exit(2); }
const say = m => console.log((dry ? '[dry-run] ' : '') + m);

if (t.skills) {
  const dest = join(t.skills, 'nmr-step-walkthrough');
  say(`skill  -> ${dest}`);
  if (!dry) {
    mkdirSync(t.skills, { recursive: true });
    cpSync(join(root, 'skills', 'nmr-step-walkthrough'), dest, { recursive: true });
    const f = join(dest, 'SKILL.md');
    writeFileSync(f, readFileSync(f, 'utf8').trimEnd() + `\n\n## Where the builder lives\n\nThe repository with \`server.mjs\`, \`SCHEMA.md\`, \`STYLE-GUIDE.md\` and \`examples/\` is at \`${root}\`.\n`);
  }
}
if (t.json) {
  let cfg = {};
  if (existsSync(t.json)) { try { cfg = JSON.parse(readFileSync(t.json, 'utf8') || '{}'); } catch { console.error(`${t.json} is not valid JSON. Fix it, or add this by hand:\n` + JSON.stringify({ mcpServers: { [NAME]: entry } }, null, 2)); process.exit(1); } }
  cfg.mcpServers = { ...(cfg.mcpServers || {}), [NAME]: entry };
  say(`server -> ${t.json}`);
  if (!dry) { mkdirSync(dirname(t.json), { recursive: true }); writeFileSync(t.json, JSON.stringify(cfg, null, 2) + '\n'); }
}
if (t.toml) {
  const block = `\n[mcp_servers.${NAME}]\ncommand = "node"\nargs = [${JSON.stringify(server)}]\n`;
  const cur = existsSync(t.toml) ? readFileSync(t.toml, 'utf8') : '';
  if (cur.includes(`[mcp_servers.${NAME}]`)) say(`server already present in ${t.toml}`);
  else { say(`server -> ${t.toml}`); if (!dry) { mkdirSync(dirname(t.toml), { recursive: true }); appendFileSync(t.toml, block); } }
}
if (t.hint) console.log(`run this yourself:\n  ${t.hint}`);
console.log('Restart the agent (or reload its MCP servers and skills) to pick this up.');
