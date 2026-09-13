import { readFile, mkdir, writeFile } from "node:fs/promises";
const canonical = await readFile(new URL("../../../docs/AGENT-PROMPT.md", import.meta.url));
await mkdir(new URL("../public/", import.meta.url), { recursive: true });
await Promise.all(["agent-prompt.md", "agent-prompt.txt"].map(name => writeFile(new URL(`../public/${name}`, import.meta.url), canonical)));
