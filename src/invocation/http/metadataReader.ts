import axios from "axios";
import { LocalMachineConfig } from "../..";
import { AutomationClientInfo } from "../AutomationClientInfo";
import { AutomationClientConnectionConfig } from "./AutomationClientConnectionConfig";
import { errorMessage } from "../cli/support/consoleOutput";

/**
 * Call into an SDM at the given location and retrieve metadata
 * @param {AutomationClientConnectionConfig} connectionConfig
 * @return {Promise<AutomationClientInfo>}
 */
export async function getMetadata(connectionConfig: AutomationClientConnectionConfig): Promise<AutomationClientInfo> {
    try {
        const resp = await axios.get(connectionConfig.baseEndpoint + "/registration");
        const commandsMetadata = resp.data.commands;
        let localConfig: LocalMachineConfig;
        try {
            localConfig = (await axios.get(connectionConfig.baseEndpoint + "/localConfiguration")).data;
        } catch {
            // Do nothing
        }
        return {
            commandsMetadata,
            localConfig,
            connectionConfig,
        };
    } catch (e) {
        errorMessage("Unable to connect to '%s': Is the automation client running?", connectionConfig.baseEndpoint);
        process.exit(1);
    }
}