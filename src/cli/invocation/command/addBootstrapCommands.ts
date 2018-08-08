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
import { GitHubNameRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { GeneratorRegistration } from "@atomist/sdm";
import { Argv } from "yargs";
import { adviceDoc, infoMessage } from "../../ui/consoleOutput";
import { NodeProjectCreationParameters, NodeProjectCreationParametersDefinition } from "./generator/NodeProjectCreationParameters";
import { UpdatePackageJsonIdentification } from "./generator/updatePackageJsonIdentification";
import { addEmbeddedCommand } from "./support/embeddedCommandExecution";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as inquirer from "inquirer";
import { Inquirer, Question } from "inquirer";

/**
 * Generator that can create a new SDM
 */
function sdmGenerator(name: string,
                      startingPoint: RemoteRepoRef): GeneratorRegistration<NodeProjectCreationParameters> {
    return {
        name,
        startingPoint,
        parameters: NodeProjectCreationParametersDefinition,
        transform: [
            UpdatePackageJsonIdentification,
        ],
    };
}


/**
 * Creates a new repo based on the content of an existing repo
 * without making any changes
 */
const superforkGenerator: GeneratorRegistration<{ owner: string, repo: string }> = {
    name: "superfork",
    startingPoint: params => new GitHubRepoRef(params.owner, params.repo),
    parameters: {
        owner: { ...GitHubNameRegExp, description: "GitHub owner" },
        repo: { ...GitHubNameRegExp, description: "GitHub repo" },
    },
    transform: async p => p,
};

/**
 * Add bootstrap commands to generate a new SDM
 * and add local capability to an existing SDM
 * @param {yargs.Argv} yargs
 */
export function addBootstrapCommands(yargs: Argv) {
    addSdmGenerator(yargs);
    addSuperforkGenerator(yargs);
}

function addSdmGenerator(yargs: Argv) {
    const choices = ["spring", "blank"];
    const name = "newSdm";
    addEmbeddedCommand(yargs, {
        name,
        cliCommand: "new sdm",
        cliDescription: "Create an SDM",
        parameters: sdmGenerator(name, undefined).parameters,
        configurer: async () => {
            const questions: Question[] = [{
                name: "type",
                message: "Type of SDM to create",
                choices,
                default: "spring",
                validate: input =>
                    choices.includes(input) ?
                        true :
                        `Please enter one of following values: ${choices}`,
            }];
            const answers = await inquirer.prompt(questions);
            switch (answers.type) {
                case "spring":
                    return sdm => sdm.addGeneratorCommand(sdmGenerator(name,
                        new GitHubRepoRef("atomist", "sample-sdm")));
                case "blank":
                    // TODO should be a basic seed
                    return sdm => sdm.addGeneratorCommand(sdmGenerator(name,
                        new GitHubRepoRef("atomist", "sample-sdm")));
                default:
                    throw new Error("Unknown SDM type " + answers.type);
            }
        },
        beforeAction: async () => {
            infoMessage("Please follow the prompts to create a new SDM\n\n");
        },
        afterAction: async (hr, chm) => {
            switch (chm.name) {
                case "springSdm":
                    adviceDoc("docs/springSdm.md");
                    break;
            }
            infoMessage("Type 'atomist deliver' to start CD for your new SDM\n");
        },
    });
}

function addSuperforkGenerator(yargs: Argv) {
    const name = "superfork";
    addEmbeddedCommand(yargs, {
        name,
        cliCommand: "superfork",
        cliDescription: "Superfork a repo",
        parameters: superforkGenerator.parameters,
        configurer: async () => sdm => sdm.addGeneratorCommand(superforkGenerator),
        beforeAction: async () => {
            infoMessage("Please follow the prompts to create a new repo based on a GitHub repo\n\n");
        },
        afterAction: async () => {
            infoMessage("Superfork complete\n");
        },
    });
}
