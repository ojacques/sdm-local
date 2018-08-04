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

import { automationClientInstance, logger, } from "@atomist/automation-client";
import { Arg, } from "@atomist/automation-client/internal/invoker/Payload";
import { CommandIncoming } from "@atomist/automation-client/internal/transport/RequestProcessor";
import * as assert from "power-assert";
import { isArray } from "util";
import { newCorrelationId } from "../../../sdm/configuration/correlationId";
import { CommandHandlerInvoker } from "../../../common/CommandHandlerInvocation";

export function invokeCommandHandlerInProcess(): CommandHandlerInvoker {
    return async invocation => {
        const parameters = propertiesToArgs(invocation.parameters);
        const data = {
            command: invocation.name,
            parameters,
            mapped_parameters: propertiesToArgs(invocation.mappedParameters || {}).concat([
                { name: "slackTeam", value: invocation.atomistTeamId },
            ]).concat(parameters), // mapped parameters can also be passed in
            secrets: (invocation.secrets || []).concat([
                { uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN },
            ]),
            correlation_id: invocation.correlationId || await newCorrelationId(),
            api_version: "1",
            team: {
                id: invocation.atomistTeamId,
                name: invocation.atomistTeamName,
            },
        };

        if (!automationClientInstance()) {
            throw new Error("This function must be invoked inside an automation client locally");
        } else {
            logger.debug("Invoking command %s using %j", invocation.name, data);
            return automationClientInstance().processCommand(data as CommandIncoming, async result => {
                const r = await result;
                if(r.code !== 0) {
                    logger.error("Command handler did not succeed. Returned: " + JSON.stringify(r, null, 2));
                }
                return r;
            });
        }
    };
}

function propertiesToArgs(o: any): Arg[] {
    if (isArray(o)) {
        return o;
    }
    const args = Object.keys(o).map(k => ({ name: k, value: o[k] }));
    return args;
}