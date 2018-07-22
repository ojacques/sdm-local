import {
    Destination,
    isSlackMessage,
    MessageClient,
    MessageOptions,
    SlackDestination,
    SlackMessageClient,
} from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";

import { logger } from "@atomist/automation-client";
import { toStringArray } from "@atomist/automation-client/internal/util/string";
import * as _ from "lodash";
import * as marked from "marked";
import { MarkedOptions } from "marked";

import * as slack from "@atomist/slack-messages/SlackMessages";
import * as TerminalRenderer from "marked-terminal";
import { AutomationClientConnectionConfig } from "../../http/AutomationClientConnectionConfig";
import { isSdmGoalStoreOrUpdate } from "./GoalEventForwardingMessageClient";

// import { notifier } from "node-notifier";

// const notifier = require("node-notifier");

const open = require("open");

const NotificationCenter = require("node-notifier").NotificationCenter;

marked.setOptions({
    // Define custom renderer
    renderer: new TerminalRenderer(),
});

/**
 * Message client logging to System notifications.
 */
export class SystemNotificationMessageClient implements MessageClient, SlackMessageClient {

    public async respond(msg: string | SlackMessage, options?: MessageOptions): Promise<any> {
        logger.info("MessageClient.respond: Raw mesg=\n%j\n", msg);
        return this.addressChannels(msg, this.linkedChannel, options);
    }

    public async send(msg: any, destinations: Destination | Destination[], options?: MessageOptions): Promise<any> {
        if (isSdmGoalStoreOrUpdate(msg)) {
            return;
        }
        const dests: SlackDestination[] =
            (Array.isArray(destinations) ? destinations : [destinations] as any)
                .filter(a => a.userAgent !== "ingester");
        return this.addressChannels(
            msg,
            _.flatten(dests.map(d => d.channels)),
            options);
    }

    public async addressChannels(msg: string | SlackMessage, channels: string | string[], options?: MessageOptions): Promise<any> {
        logger.info("MessageClient.addressChannels: Raw mesg=\n%j\nChannels=%s\n", msg, channels);
        const chans = toStringArray(channels);
        chans.forEach(channel => {
            // TODO isSlackMessage doesn't return right
            if (isSlackMessage(msg)) {
                if (!!msg.text) {
                    this.writeToChannel(channel, msg.text);
                }
                msg.attachments.forEach(att => {
                    this.writeToChannel(channel, att.text);
                    att.actions.forEach(action => {
                        this.renderAction(channel, action);
                    });
                });
            } else if (typeof msg === "string") {
                this.writeToChannel(channel, msg);
            } else {
                const m = msg as any;
                if (!!m.content) {
                    this.writeToChannel(channel, m.content);
                } else {
                    this.writeToChannel(channel, "???? What is " + JSON.stringify(msg));
                }
            }
        });
    }

    public async addressUsers(msg: string | SlackMessage, users: string | string[], options?: MessageOptions): Promise<any> {
        logger.info("MessageClient.addressUsers: Raw mesg=\n%j\nUsers=%s", msg, users);
        process.stdout.write(`#${users} ${msg}\n`);
    }

    private renderAction(channel: string, action: slack.Action) {
        if (action.type === "button") {
            // TODO fix hardcoding (use config), and need to update to call local client
            const a = action as any;
            let url = `http://localhost:6660/command/${a.command.name}?`;
            Object.getOwnPropertyNames(a.command.parameters).forEach(prop => {
                url += `${prop}=${a.command.parameters[prop]}`;
            });
            this.writeToChannel(channel, `${action.text} - ${url}`);
        } else {
            process.stdout.write(JSON.stringify(action) + "\n");
        }
    }

    /**
     * Apply consistent formatting to mimic writing to a Slack channel
     * @param {string[] | string} channels
     * @param {string} markdown
     */
    private async writeToChannel(channels: string[] | string, markdown: string) {
        const notifier = new NotificationCenter({
            withFallback: false, // Use Growl Fallback if <= 10.8
        });
        notifier.notify({
            title: `Atomist2: [${channels}]`,
            message: markdown,
            wait: true,
        });
        notifier.on("click", (notifierObject, options) => {
            // Triggers if `wait: true` and user clicks notification
            open("http://127.0.0.1:2866/log/messages");
        });
    }

    constructor(private readonly linkedChannel: string,
                private readonly connectionConfig: AutomationClientConnectionConfig,
                public readonly markedOptions: MarkedOptions = {
                    breaks: false,
                }) {
    }

}