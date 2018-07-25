import { Configuration, HandlerContext, HandlerResult, logger } from "@atomist/automation-client";
import { createSdmOptions } from "./createSdmOptions";
import { LocalMachineConfig } from "./LocalMachineConfig";

import { CommandInvocation } from "@atomist/automation-client/internal/invoker/Payload";
import { AutomationEventListenerSupport } from "@atomist/automation-client/server/AutomationEventListener";
import { CustomEventDestination } from "@atomist/automation-client/spi/message/MessageClient";
import * as _ from "lodash";
import { LocalGraphClient } from "../binding/LocalGraphClient";
import { DefaultAutomationClientConnectionConfig } from "../entry/resolveConnectionConfig";
import { AllMessagesPort } from "../invocation/cli/command/addStartListenerCommand";
import { BroadcastingMessageClient } from "../invocation/cli/io/BroadcastingMessageClient";
import { GoalEventForwardingMessageClient } from "../invocation/cli/io/GoalEventForwardingMessageClient";
import { HttpClientMessageClient } from "../invocation/cli/io/HttpClientMessageClient";
import { SystemNotificationMessageClient } from "../invocation/cli/io/SystemNotificationMessageClient";
import { channelFor, clientIdentifier } from "./correlationId";
import { isLocal } from "./isLocal";

/**
 * Configures an automation client in local mode
 * @param {LocalMachineConfig} localMachineConfig
 * @return {(configuration: Configuration) => Promise<Configuration>}
 */
export function configureLocal(localMachineConfig: LocalMachineConfig): (configuration: Configuration) => Promise<Configuration> {
    return async configuration => {

        // Don't mess with a non local machine
        if (!isLocal()) {
            return configuration;
        }

        logger.info("Disable web socket connection");
        configuration.ws.enabled = false;

        configureWebEndpoints(configuration, localMachineConfig);

        setMessageClient(configuration);
        setGraphClient(configuration);

        if (!configuration.listeners) {
            configuration.listeners = [];
        }
        configuration.listeners.push(new NotifyOnCompletionAutomationEventListener());

        const localModeSdmConfigurationElements = createSdmOptions(localMachineConfig);

        // Need extra config to know how to set things in the SDM
        configuration.sdm = {
            ...configuration.sdm,
            ...localModeSdmConfigurationElements,
        };
        return configuration;
    };
}

export const CommandCompletionDestination = new CustomEventDestination("completion");

class NotifyOnCompletionAutomationEventListener extends AutomationEventListenerSupport {

    public commandSuccessful(payload: CommandInvocation, ctx: HandlerContext, result: HandlerResult): Promise<void> {
        return ctx.messageClient.send("Success", CommandCompletionDestination);
    }

    public commandFailed(payload: CommandInvocation, ctx: HandlerContext, err: any): Promise<void> {
        return ctx.messageClient.send("Failure", CommandCompletionDestination);
    }
}

function configureWebEndpoints(configuration: Configuration, localMachineConfig: LocalMachineConfig) {
    // Disable auth as we're only expecting local clients
    // TODO what if not basic
    _.set(configuration, "http.auth.basic.enabled", false);

    configuration.http.customizers = [
        exp => {
            // TODO could use this to set local mode for a server - e.g. the name to send to
            exp.get("/localConfiguration", async (req, res) => {
                res.json(localMachineConfig);
            });
        },
    ];
}

function setMessageClient(configuration: Configuration) {
    configuration.http.messageClientFactory =
        aca => {
            const channel = channelFor(aca.context.correlationId);
            return new BroadcastingMessageClient(
                new HttpClientMessageClient(channel, AllMessagesPort),
                new GoalEventForwardingMessageClient(DefaultAutomationClientConnectionConfig),
                new HttpClientMessageClient(channel, clientIdentifier(aca.context.correlationId)),
                new SystemNotificationMessageClient(channel),
            );
        };
}

function setGraphClient(configuration: Configuration) {
    configuration.http.graphClientFactory =
        () => new LocalGraphClient(false);
}
