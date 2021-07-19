import { MqttClient, IClientOptions, connect } from "mqtt";
import {
    IAddClientRoleRequest,
    IAddGroupRoleRequest,
    IAnonymousGroupResponse,
    ICommandPayload,
    ICommandResponse,
    ICreateClientRequest,
    ICreateGroupRequest,
    IDefaultACLAccess,
    IDefaultACLAccessResponse,
    IDeleteClientRequest,
    IGetClientResponse,
    IListClientsRequest,
    IListClientsResponse,
    IPendingCommand,
    IRemoveClientRoleRequest,
    IRemoveGroupRoleRequest,
    IResponseTopicPayload,
    ISetClientIdRequest,
    ISetClientPasswordRequest
} from "./interfaces";

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
    private timerQueue: {[commandName: string]: NodeJS.Timeout} = {};

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
            this.timerQueue[commandName] = setTimeout(() => {
                delete this.timerQueue[commandName];
                reject("COMMAND_TIMEOUT");
            }, 1000 * MosquittoDynSec.TIMEOUT_SECONDS);
        });

        return Promise.race<Promise<object | void>>([commandPromise, timeoutPromise]);
    }

    /**
     * Handle a command response from the MQTT server.
     * @param topic 
     * @param payload 
     */
     protected onCommandResponse(topic: string, payload: IResponseTopicPayload): void {
        if (process.env.DEBUG) {
            console.debug("Received payload:");
            console.debug(JSON.stringify(payload, null, 2));
        }

        if (!Array.isArray(payload.responses))
            throw new Error("Invalid command response payload.");

        payload.responses.forEach((res: ICommandResponse) => {
            const queuedCommand = this.commandQueue[res.command];
            const queuedTimer = this.timerQueue[res.command];

            if (!queuedCommand)
                return console.warn(`Received response for unsent command '${res.command}'`, res.data)

            clearTimeout(queuedTimer);

            delete this.commandQueue[res.command];
            delete this.timerQueue[res.command];
            if (res.error) {
                queuedCommand.reject(res.error);
            } else {
                queuedCommand.resolve(res.data);
            }
        });
    }

    //
    // General
    //

    /**
     * Get default ACL access.
     * @returns {IDefaultACLAccessResponse}
     */
    public async getDefaultACLAccess(): Promise<IDefaultACLAccessResponse> {
        return await (this.sendCmd(SendCommand.getDefaultACLAccess) as Promise<IDefaultACLAccessResponse>);
    }

    /**
     * Set default ACL(s) access.
     * @param {IDefaultACLAccess[]} acls ACLs
     * @returns {void}
     */
    public async setDefaultACLAccess(acls: IDefaultACLAccess[]): Promise<void> {
        return await (this.sendCmd(SendCommand.setDefaultACLAccess, { acls }) as Promise<void>);
    }

    /**
     * Get anonymous group.
     * @returns {IAnonymousGroupResponse}
     */
    public async getAnonymousGroup(): Promise<IAnonymousGroupResponse> {
        return await (this.sendCmd(SendCommand.getAnonymousGroup) as Promise<IAnonymousGroupResponse>);
    }

    /**
     * Set anonymous group.
     * @param {string} groupname Group name.
     * @returns {void}
     */
    public async setAnonymousGroup(groupname: string): Promise<void> {
        return await (this.sendCmd(SendCommand.setAnonymousGroup, { groupname }) as Promise<void>);
    }

    //
    // Clients
    //

    /**
     * Create a client.
     * @param {ICreateClientRequest} createClientRequest
     * @returns {void}
     */
    public async createClient(createClientRequest: ICreateClientRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.createClient, createClientRequest) as Promise<void>);
    }

    /**
     * Delete a client.
     * @param {IDeleteClientRequest} deleteClientRequest
     * @returns {void}
     */
    public async deleteClient(deleteClientRequest: IDeleteClientRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.deleteClient, deleteClientRequest) as Promise<void>);
    }

    /**
     * Change the password for a client.
     * @param {ISetClientPasswordRequest} setClientPasswordRequest
     * @returns {void}
     */
    public async setClientPassword(setClientPasswordRequest: ISetClientPasswordRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.setClientPassword, setClientPasswordRequest) as Promise<void>);
    }

    /**
     * Change the client id for a client.
     * @param {ISetClientIdRequest} setClientIdRequest
     * @returns {void}
     */
    public async setClientId(setClientIdRequest: ISetClientIdRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.setClientId, setClientIdRequest) as Promise<void>);
    }

    /**
     * Add a role to a client.
     * @param {IAddClientRoleRequest} addClientRoleRequest
     * @returns {void}
     */
    public async addClientRole(addClientRoleRequest: IAddClientRoleRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.addClientRole, addClientRoleRequest) as Promise<void>);
    }

    /**
     * Remove a role from a client.
     * @param {IRemoveClientRoleRequest} removeClientRoleRequest
     * @returns {void}
     */
    public async removeClientRole(removeClientRoleRequest: IRemoveClientRoleRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.removeClientRole, removeClientRoleRequest) as Promise<void>);
    }

    /**
     * Get a client.
     * @param {string} username
     * @returns {IClientResponse}
     */
    public async getClient(username: string): Promise<IGetClientResponse> {
        return await (this.sendCmd(SendCommand.getClient, { username }) as Promise<IGetClientResponse>);
    }

    /**
     * List clients.
     * @param {IListClientsRequest} listClientsRequest
     * @returns {IListClientsResponse}
     */
    public async listClients(listClientsRequest: IListClientsRequest): Promise<IListClientsResponse> {
        return await (this.sendCmd(SendCommand.listClients, listClientsRequest) as Promise<IListClientsResponse>);
    }

    /**
     * Enable a client.
     * @param {string} username
     * @returns {void}
     */
    public async enableClient(username: string): Promise<void> {
        return await (this.sendCmd(SendCommand.enableClient, { username }) as Promise<void>);
    }

    /**
     * Disable a client.
     * @param {string} username
     * @returns {void}
     */
     public async disableClient(username: string): Promise<void> {
        return await (this.sendCmd(SendCommand.disableClient, { username }) as Promise<void>);
    }

    //
    // Groups
    //
    
    /**
     * Create a group.
     * @param {ICreateGroupRequest} createGroupRequest
     * @returns {void}
     */
    public async createGroup(createGroupRequest: ICreateGroupRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.createGroup, createGroupRequest) as Promise<void>);
    }

    /**
     * Delete a group.
     * @param {string} groupname
     * @returns {void}
     */
     public async deleteGroup(groupname: string): Promise<void> {
        return await (this.sendCmd(SendCommand.deleteGroup, { groupname }) as Promise<void>);
    }

    /**
     * Add a role to a group.
     * @param {IAddGroupRoleRequest} addGroupRoleRequest
     * @returns {void}
     */
    public async addGroupRole(addGroupRoleRequest: IAddGroupRoleRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.addGroupRole, addGroupRoleRequest) as Promise<void>);
    }

    /**
     * Remove a role from a group.
     * @param {IRemoveGroupRoleRequest} removeGroupRoleRequest
     * @returns {void}
     */
    public async removeGroupRole(removeGroupRoleRequest: IRemoveGroupRoleRequest): Promise<void> {
        return await (this.sendCmd(SendCommand.removeGroupRole, removeGroupRoleRequest) as Promise<void>);
    }

    // TODO: addGroupClient


    // TODO: removeGroupClient


    // TODO: getGroup


    // TODO: listGroups



    //
    // Roles
    //

    // TODO: createRole


    // TODO: deleteRole
    
    
    // TODO: addRoleACL
    
    
    // TODO: removeRoleACL
    
    
    // TODO: getRole
    
    
    // TODO: listRoles


}
