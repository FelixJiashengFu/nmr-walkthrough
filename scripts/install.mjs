#!/usr/bin/env node
// Install the MCP server entry and the skill for one coding agent.
//   node scripts/install.mjs <tool> [--dry-run]      (run without a tool to list them)
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
const typed = { type: 'stdio', ...entry };   // Cursor and VS Code Copilot document "type": "stdio"

const TOOLS = {
  claude:      { skills: join(home, '.claude', 'skills'),            hint: `claude mcp add ${NAME} --scope user -- node "${server}"` },
  codex:       { skills: join(home, '.agents', 'skills'),            toml: join(home, '.codex', 'config.toml') },
  antigravity: { skills: join(home, '.gemini', 'config', 'skills'),  json: join(home, '.gemini', 'config', 'mcp_config.json') },
  qoder:       { skills: join(home, '.qoder', 'skills'),             json: join(home, '.qoder', 'settings.json') },
  workbuddy:   { skills: join(home, '.workbuddy', 'skills'),         json: join(home, '.workbuddy', 'mcp.json') },
  cursor:      { skills: join(home, '.cursor', 'skills'),            json: join(home, '.cursor', 'mcp.json'), entry: typed },
  vscode:      { skills: join(home, '.copilot', 'skills'),           json: join(home, '.copilot', 'mcp-config.json'), entry: typed },
  gemini:      { hint: `gemini extensions install https://github.com/FelixJiashengFu/nmr-walkthrough   (or the local folder: gemini extensions install "${root}")\n  The extension brings both the MCP server and the skill.` },
  windsurf:    { json: join(home, '.codeium', 'windsurf', 'mcp_config.json'), skills: join(home, '.agents', 'skills'),
                 note: 'Windsurf documents no skills folder; the skill was copied to ~/.agents/skills, the shared location many agents read. If Cascade does not see the MCP server, open "Open MCP config file" in Cascade and paste the same entry there.' },
  kiro:        { skills: join(home, '.kiro', 'skills'),              json: join(home, '.kiro', 'settings', 'mcp.json') },
  cline:       { skills: join(home, '.cline', 'skills'),             json: join(home, '.cline', 'data', 'settings', 'cline_mcp_settings.json'),
                 note: 'That MCP file is the one Cline CLI reads. In the VS Code extension, open Cline → "Configure MCP Servers" and paste the same "nmr-walkthrough" entry.' },
  zed:         { skills: join(home, '.agents', 'skills'),
                 hint: `Zed keeps MCP servers in its settings file, which may contain comments, so this script does not edit it.\n  Run "zed: open settings file" and add:\n  "context_servers": { "${NAME}": { "command": "node", "args": [${JSON.stringify(server)}], "env": {} } }` },
  opencode:    { skills: join(home, '.config', 'opencode', 'skills'),
                 hint: `opencode mcp add ${NAME} --global -- node "${server}"` },
  codebuddy:   { skills: join(home, '.codebuddy', 'skills'),         json: join(home, '.codebuddy', 'mcp.json') },
  qwen:        { skills: join(home, '.qwen', 'skills'),              json: join(home, '.qwen', 'settings.json') },
  lingma:      { skills: join(home, '.lingma', 'skills'),
                 hint: `通义灵码 adds MCP servers in its own settings: 个人设置 → MCP 服务 → "+" → 手工添加 (STDIO), command: node, args: "${server}"\n  or paste: {"mcpServers":{"${NAME}":{"command":"node","args":[${JSON.stringify(server)}]}}}` },
  trae:        { skills: join(home, '.agents', 'skills'),
                 hint: `Trae adds MCP servers in its own settings: 设置 → MCP → 添加 → 手动添加, then paste:\n  {"mcpServers":{"${NAME}":{"command":"node","args":[${JSON.stringify(server)}]}}}\n  (Per project: turn on 项目级 MCP and put the same JSON in .trae/mcp.json.)`,
                 note: 'Trae documents no skills folder; the skill was copied to ~/.agents/skills. If Trae does not pick it up, paste the content of SKILL.md into a Trae rule.' },
  kimi:        { skills: join(home, '.kimi-code', 'skills'),         json: join(home, '.kimi-code', 'mcp.json'),
                 note: 'Kimi Code CLI reads $KIMI_CODE_HOME if set (default ~/.kimi-code). You can also run /mcp-config inside kimi to check the server.' },
  comate:      { skills: join(home, '.comate', 'skills'),            json: join(home, '.comate', 'mcp.json'),
                 note: '文心快码 Comate: if the server does not show up, open "···" → MCP → 手动配置 and paste the same entry.' },
  cherry:      { hint: `Cherry Studio adds MCP servers in its own settings (MCP servers → add). Choose the STDIO type with\n  command: node\n  args:    ${server}\n  Cherry Studio's MCP help page could not be read when this was written, so the exact menu names are not given here. This script installs no skill for Cherry Studio; paste SKILL.md into an assistant prompt if you want the method.` },
  agents:      { skills: join(home, '.agents', 'skills'), note: 'Skill only, in the shared ~/.agents/skills folder (read by Codex, Cursor, Gemini CLI, Zed, opencode and others).' },
  'claude-desktop': { hint: 'Download nmr-walkthrough.mcpb from the latest GitHub release (or build it: node scripts/pack-mcpb.mjs) and double-click it, or drag it into Claude Desktop → Settings → Extensions.' },
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
if (!t) { console.error(`usage: node scripts/install.mjs <tool> [--dry-run]\ntools: ${Object.keys(TOOLS).join(', ')}`); process.exit(2); }
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
  if (existsSync(t.json)) { try { cfg = JSON.parse(readFileSync(t.json, 'utf8') || '{}'); } catch { console.error(`${t.json} is not valid JSON. Fix it, or add this by hand:\n` + JSON.stringify({ mcpServers: { [NAME]: t.entry || entry } }, null, 2)); process.exit(1); } }
  cfg.mcpServers = { ...(cfg.mcpServers || {}), [NAME]: t.entry || entry };
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
if (t.note) console.log('note: ' + t.note);
console.log('Restart the agent (or reload its MCP servers and skills) to pick this up.');
