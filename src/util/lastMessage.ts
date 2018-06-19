import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { exec } from "child_process";
import { promisify } from "util";

export async function lastCommitMessage(p: GitProject): Promise<string> {
    const r = await promisify(exec)("git log -1 --pretty=%B", { cwd: p.baseDir});
    return r.stdout.trim();
}
