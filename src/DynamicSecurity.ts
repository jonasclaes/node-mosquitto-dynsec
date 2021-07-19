import { AclType, DefaultAclType } from "MosquittoDynSec";
import { MqttClient, IClientOptions, connect } from "mqtt";
import { ICommandPayload, IDefaultACLAccess, IResponseTopicPayload } from "./interfaces";

enum SendCommand {
    "getDefaultACLAccess" = "getDefaultACLAccess",
    "setDefaultACLAccess" = "setDefaultACLAccess",
    "getAnonymousGroup" = "getAnonymousGroup",
    "setAnonymousGroup" = "setAnonymousGroup",
    "createClient" = "createClient",
    "deleteClient" = "deleteClient",
    "setClientPassword" = "setClientPassword",
    "setClientId" = "setClientId",
    "addClientRole" = "addClientRole",
    "removeClientRole" = "removeClientRole",
    "getClient" = "getClient",
    "listClients" = "listClients",
    "enableClient" = "enableClient",
    "disableClient" = "disableClient",
    "createGroup" = "createGroup",
    "deleteGroup" = "deleteGroup",
    "addGroupRole" = "addGroupRole",
    "removeGroupRole" = "removeGroupRole",
    "addGroupClient" = "addGroupClient",
    "removeGroupClient" = "removeGroupClient",
    "getGroup" = "getGroup",
    "listGroups" = "listGroups",
    "createRole" = "createRole",
    "deleteRole" = "deleteRole",
    "addRoleACL" = "addRoleACL",
    "removeRoleACL" = "removeRoleACL",
    "getRole" = "getRole",
    "listRoles" = "listRoles"
}

export class MosquittoDynSec {
    // Constants.
    private static API_VERSION = "v1";
    private static readonly MGMT_TOPIC = `$CONTROL/dynamic-security/${MosquittoDynSec.API_VERSION}`;
    private static readonly RESPONSE_TOPIC = `${MosquittoDynSec.MGMT_TOPIC}/response`;

    // Class instance variables.
    private mqttClient?: MqttClient;

    /**
     * Node.JS Mosquitto Dynamic Security Plugin constructor.
     */
    constructor() {

    }

    /**
     * Connect to MQTT server.
     * @param {IClientOptions} opts
     */
    public async connect(opts: IClientOptions = {}): Promise<void> {
        opts.hostname ? null : opts.hostname = "localhost";
        opts.port ? null : opts.port = 1883;
        opts.protocol ? null : opts.protocol = "mqtt";
        opts.username ? null : opts.username = "admin-user";

        // Connect to MQTT server.
        const mqtt = connect(opts);

        mqtt.on("message", (topic, payload) => {
            this.onCommandResponse.call(this, topic, JSON.parse(String(payload)));
        });

        return new Promise<void>((resolve, reject) => {
            mqtt.on("error", () => { reject(); });
            mqtt.on("connect", () => {
                console.debug("Connected to MQTT server.");

                mqtt.subscribe(MosquittoDynSec.RESPONSE_TOPIC);
                this.mqttClient = mqtt;

                resolve();
            });
        });
    }

    /**
     * Disconnect from MQTT server.
     * @returns 
     */
    public async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.mqttClient) return resolve();
            this.mqttClient.end(true, {}, (error?: Error) => {
                if (!error) resolve();
                reject();
            });
        });
    }

    /**
     * Send a command to the MQTT server.
     * @param commandName 
     * @param commandParams 
     * @returns 
     */
    protected sendCmd(commandName: string, commandParams: object = {}): void {
        // Check if client is connected.
        if (!this.mqttClient)
            throw new Error("Can't send command: not connected yet.");
        
        // Execute command.
        const command: ICommandPayload = Object.assign({}, commandParams, { command: commandName });
        const payload = JSON.stringify({ commands: [command] });
        this.mqttClient.publish(MosquittoDynSec.MGMT_TOPIC, payload);

        return;
    }

    /**
     * Handle a command response from the MQTT server.
     * @param topic 
     * @param payload 
     */
    protected onCommandResponse(topic: string, payload: IResponseTopicPayload): void {
        console.info(JSON.stringify(payload, null, 4));
    }

    // General
    /**
     * Get default ACL access.
     * @returns 
     */
    public async getDefaultACLAccess() {
        this.sendCmd(SendCommand.getDefaultACLAccess);
        return;
    }

    /**
     * Set default ACL(s) access.
     * @param acls ACLs
     * @returns 
     */
    public async setDefaultACLAccess(acls: IDefaultACLAccess[]) {
        this.sendCmd(SendCommand.setDefaultACLAccess, { acls });
        return;
    }

    /**
     * Get anonymous group.
     * @returns 
     */
    public async getAnonymousGroup() {
        this.sendCmd(SendCommand.getAnonymousGroup);
        return;
    }

    /**
     * Set anonymous group.
     * @param groupname Group name.
     * @returns 
     */
    public async setAnonymousGroup(groupname: string) {
        this.sendCmd(SendCommand.setAnonymousGroup, { groupname });
        return;
    }

    // Clients

    // Groups

    // Roles
}
