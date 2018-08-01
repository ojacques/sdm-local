/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { exec } from "child_process";
import * as fs from "fs";
import { promisify } from "util";
import { Argv } from "yargs";
import { addGitHooks } from "../../setup/addGitHooks";
import { AutomationClientInfo } from "../../AutomationClientInfo";
import { logExceptionsToConsole, infoMessage } from "./support/consoleOutput";
import { sendRepoOnboardingEvent, sendChannelLinkEvent } from "../../../sdm/binding/event/repoOnboardingEvents";

export function addImportFromGitRemoteCommand(ai: AutomationClientInfo, yargs: Argv) {
    yargs.command({
        command: "import <owner> <repo> [remoteBase]",
        aliases: "i",
        describe: "Import from Git remote. Remote base defaults to https://github.com",
        handler: argv => {
            return logExceptionsToConsole(async () => {
                const remoteBase = !!argv.base ? argv.base : "https://github.com";
                await importFromGitRemote(ai, argv.owner, argv.repo, remoteBase);
            }, ai.connectionConfig.showErrorStacks);
        },
    });
}

async function importFromGitRemote(ai: AutomationClientInfo,
                                   owner: string,
                                   repo: string,
                                   remoteBase: string): Promise<any> {
    infoMessage(`Importing Git remote project ${remoteBase}/${owner}/${repo}`);
    const orgDir = `${ai.localConfig.repositoryOwnerParentDirectory}/${owner}`;
    if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir);
    }
    await promisify(exec)(`git clone ${remoteBase}/${owner}/${repo}`,
        { cwd: orgDir });
    await addGitHooks(new GitHubRepoRef(owner, repo),
        `${orgDir}/${repo}`);
    await sendRepoOnboardingEvent(ai.connectionConfig, { owner, repo});
    await sendChannelLinkEvent(ai.connectionConfig, { owner, repo});
}