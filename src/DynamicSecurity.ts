import { MqttClient, IClientOptions, connect } from "mqtt";
import { IAnonymousGroupResponse, ICommandPayload, ICommandResponse, ICreateClientRequest, IDefaultACLAccess, IDefaultACLAccessResponse, IPendingCommand, IResponseTopicPayload } from "./interfaces";

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
    private static readonly API_VERSION = "v1";
    private static readonly MGMT_TOPIC = `$CONTROL/dynamic-security/${MosquittoDynSec.API_VERSION}`;
    private static readonly RESPONSE_TOPIC = `${MosquittoDynSec.MGMT_TOPIC}/response`;
    private static readonly TIMEOUT_SECONDS = 3;

    // Class instance variables.
    private mqttClient?: MqttClient;
    private commandQueue: {[commandName: string]: IPendingCommand} = {};

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
    protected sendCmd(commandName: string, commandParams: object = {}): Promise<object | void> {
        // Check if client is connected.
        if (!this.mqttClient)
            throw new Error("Can't send command: not connected yet.");

        // Check if command is already being executed.
        if (this.commandQueue[commandName])
            throw new Error("Can't send command: command is already in the queue.");

        // Create a promise to which the commandhandler can respond.
        const commandPromise = new Promise<object | void>((resolve, reject) => {
            this.commandQueue[commandName] = {resolve, reject};
        });
        
        // Execute command.
        const command: ICommandPayload = Object.assign({}, commandParams, { command: commandName });
        const payload = JSON.stringify({ commands: [command] });
        this.mqttClient.publish(MosquittoDynSec.MGMT_TOPIC, payload);

        const timeoutPromise = new Promise<object>((resolve, reject) => {
            setTimeout(() => reject("COMMAND_TIMEOUT"), 1000 * MosquittoDynSec.TIMEOUT_SECONDS);
        });

        return Promise.race<Promise<object | void>>([commandPromise, timeoutPromise]);
    }

    /**
     * Handle a command response from the MQTT server.
     * @param topic 
     * @param payload 
     */
     protected onCommandResponse(topic: string, payload: IResponseTopicPayload): void {
        if (!Array.isArray(payload.responses))
            throw new Error("Invalid command response payload.");

        payload.responses.forEach((res: ICommandResponse) => {
            const queuedCommand = this.commandQueue[res.command];

            if (!queuedCommand)
                return console.warn(`Received response for unsent command '${res.command}'`, res.data)

            delete this.commandQueue[res.command];
            if (res.error) {
                queuedCommand.reject(res.error);
            } else {
                queuedCommand.resolve(res.data);
            }
        });
    }

    // General
    /**
     * Get default ACL access.
     * @returns 
     */
    public async getDefaultACLAccess(): Promise<IDefaultACLAccessResponse> {
        return await (this.sendCmd(SendCommand.getDefaultACLAccess) as Promise<IDefaultACLAccessResponse>);
    }

    /**
     * Set default ACL(s) access.
     * @param acls ACLs
     * @returns 
     */
    public async setDefaultACLAccess(acls: IDefaultACLAccess[]): Promise<void> {
        return await (this.sendCmd(SendCommand.setDefaultACLAccess, { acls }) as Promise<void>);
    }

    /**
     * Get anonymous group.
     * @returns 
     */
    public async getAnonymousGroup(): Promise<IAnonymousGroupResponse> {
        return await (this.sendCmd(SendCommand.getAnonymousGroup) as Promise<IAnonymousGroupResponse>);
    }

    /**
     * Set anonymous group.
     * @param groupname Group name.
     * @returns 
     */
    public async setAnonymousGroup(groupname: string): Promise<void> {
        return await (this.sendCmd(SendCommand.setAnonymousGroup, { groupname }) as Promise<void>);
    }

    // Clients
    public async createClient(createClientRequest: ICreateClientRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.createClient, createClientRequest) as Promise<void>);
    }

    // Groups

    // Roles
}
