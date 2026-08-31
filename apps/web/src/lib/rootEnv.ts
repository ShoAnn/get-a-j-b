import fs from "fs";
import path from "path";

const ROOT_ENV_CANDIDATES = ["../../.env", "../../.env.local"];

export function loadRootEnv() {
    for (const candidate of ROOT_ENV_CANDIDATES) {
        const filePath = path.resolve(process.cwd(), candidate);
        if (!fs.existsSync(filePath)) continue;

        for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
            const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (!match) continue;
            const [, key, raw] = match;
            const value = raw
                .replace(/^["']|["']$/g, "")
                .trim();
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    }
}
