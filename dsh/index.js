// DeepSeek Harness (DSH) host plugin. It mounts DSH's own MCP client on the bundled server
// (server.mjs, plain Node, no dependencies; tools appear as mcp__nmr-walkthrough__*) and a
// filesystem skill provider for skills/nmr-step-walkthrough.
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";
import * as mcpClient from "@deepseek-ai/dsh-mcp-client";
import * as skillFilesystem from "@deepseek-ai/dsh-skill-filesystem";

export const name = "dsh-nmr-walkthrough";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const Config = z.object({
  node: z.string().default("node").description("Node.js executable that runs the server (a full path if node is not on PATH)."),
  outputDir: z.string().default(join(homedir(), "nmr-walkthroughs")).description("Folder where built walkthrough pages are written."),
});

export function apply(ctx, config) {
  ctx.plugin(mcpClient, {
    serverName: "nmr-walkthrough",
    transport: "stdio",
    command: config.node,
    args: [join(root, "server.mjs")],
    env: { NMR_WALKTHROUGH_DIR: config.outputDir },
    cwd: homedir(),
  });
  ctx.plugin(skillFilesystem, {
    providerName: "nmr-walkthrough",
    includeDefaultRoots: false,
    customSkillDirs: [join(root, "skills")],
    watch: false,
  });
}
