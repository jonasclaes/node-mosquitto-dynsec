import { MqttClient, IClientOptions, connect } from "mqtt";
import {
    IAddClientRoleRequest,
    IAddGroupClientRequest,
    IAddGroupRoleRequest,
    IAddRoleACLRequest,
    IAnonymousGroupResponse,
    ICommandPayload,
    ICommandResponse,
    ICreateClientRequest,
    ICreateGroupRequest,
    ICreateRoleRequest,
    IDefaultACLAccess,
    IDefaultACLAccessResponse,
    IDeleteClientRequest,
    IGetClientResponse,
    IGetGroupResponse,
    IGetRoleResponse,
    IListClientsRequest,
    IListClientsResponse,
    IListGroupsRequest,
    IListGroupsResponse,
    IListRolesRequest,
    IListRolesResponse,
    IPendingCommand,
    IRemoveClientRoleRequest,
    IRemoveGroupClientRequest,
    IRemoveGroupRoleRequest,
    IRemoveRoleACLRequest,
    IResponseTopicPayload,
    ISetClientIdRequest,
    ISetClientPasswordRequest
} from "./interfaces";
import { EnumMQTTCmd } from "./enums";

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
                // console.debug("Connected to MQTT server.");

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
        return await (this.sendCmd(EnumMQTTCmd.GET_DEFAULT_ACL_ACCESS) as Promise<IDefaultACLAccessResponse>);
    }

    /**
     * Set default ACL(s) access.
     * @param {IDefaultACLAccess[]} acls ACLs
     * @returns {void}
     */
    public async setDefaultACLAccess(acls: IDefaultACLAccess[]): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.SET_DEFAULT_ACL_ACCESS, { acls }) as Promise<void>);
    }

    /**
     * Get anonymous group.
     * @returns {IAnonymousGroupResponse}
     */
    public async getAnonymousGroup(): Promise<IAnonymousGroupResponse> {
        return await (this.sendCmd(EnumMQTTCmd.GET_ANONYMOUS_GROUP) as Promise<IAnonymousGroupResponse>);
    }

    /**
     * Set anonymous group.
     * @param {string} groupname Group name.
     * @returns {void}
     */
    public async setAnonymousGroup(groupname: string): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.SET_ANONYMOUS_GROUP, { groupname }) as Promise<void>);
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
        return await (this.sendCmd(EnumMQTTCmd.CREATE_CLIENT, createClientRequest) as Promise<void>);
    }

    /**
     * Delete a client.
     * @param {IDeleteClientRequest} deleteClientRequest
     * @returns {void}
     */
    public async deleteClient(deleteClientRequest: IDeleteClientRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.DELETE_CLIENT, deleteClientRequest) as Promise<void>);
    }

    /**
     * Change the password for a client.
     * @param {ISetClientPasswordRequest} setClientPasswordRequest
     * @returns {void}
     */
    public async setClientPassword(setClientPasswordRequest: ISetClientPasswordRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.SET_CLIENT_PASSWORD, setClientPasswordRequest) as Promise<void>);
    }

    /**
     * Change the client id for a client.
     * @param {ISetClientIdRequest} setClientIdRequest
     * @returns {void}
     */
    public async setClientId(setClientIdRequest: ISetClientIdRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.SET_CLIENT_ID, setClientIdRequest) as Promise<void>);
    }

    /**
     * Add a role to a client.
     * @param {IAddClientRoleRequest} addClientRoleRequest
     * @returns {void}
     */
    public async addClientRole(addClientRoleRequest: IAddClientRoleRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.ADD_CLIENT_ROLE, addClientRoleRequest) as Promise<void>);
    }

    /**
     * Remove a role from a client.
     * @param {IRemoveClientRoleRequest} removeClientRoleRequest
     * @returns {void}
     */
    public async removeClientRole(removeClientRoleRequest: IRemoveClientRoleRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.REMOVE_CLIENT_ROLE, removeClientRoleRequest) as Promise<void>);
    }

    /**
     * Get a client.
     * @param {string} username
     * @returns {IClientResponse}
     */
    public async getClient(username: string): Promise<IGetClientResponse> {
        return await (this.sendCmd(EnumMQTTCmd.GET_CLIENT, { username }) as Promise<IGetClientResponse>);
    }

    /**
     * List clients.
     * @param {IListClientsRequest} listClientsRequest
     * @returns {IListClientsResponse}
     */
    public async listClients(listClientsRequest: IListClientsRequest): Promise<IListClientsResponse> {
        return await (this.sendCmd(EnumMQTTCmd.LIST_CLIENTS, listClientsRequest) as Promise<IListClientsResponse>);
    }

    /**
     * Enable a client.
     * @param {string} username
     * @returns {void}
     */
    public async enableClient(username: string): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.ENABLE_CLIENT, { username }) as Promise<void>);
    }

    /**
     * Disable a client.
     * @param {string} username
     * @returns {void}
     */
     public async disableClient(username: string): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.DISABLE_CLIENT, { username }) as Promise<void>);
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
        return await (this.sendCmd(EnumMQTTCmd.CREATE_GROUP, createGroupRequest) as Promise<void>);
    }

    /**
     * Delete a group.
     * @param {string} groupname
     * @returns {void}
     */
     public async deleteGroup(groupname: string): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.DELETE_GROUP, { groupname }) as Promise<void>);
    }

    /**
     * Add a role to a group.
     * @param {IAddGroupRoleRequest} addGroupRoleRequest
     * @returns {void}
     */
    public async addGroupRole(addGroupRoleRequest: IAddGroupRoleRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.ADD_GROUP_ROLE, addGroupRoleRequest) as Promise<void>);
    }

    /**
     * Remove a role from a group.
     * @param {IRemoveGroupRoleRequest} removeGroupRoleRequest
     * @returns {void}
     */
    public async removeGroupRole(removeGroupRoleRequest: IRemoveGroupRoleRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.REMOVE_GROUP_ROLE, removeGroupRoleRequest) as Promise<void>);
    }

    /**
     * Add a client to a group.
     * @param {IAddGroupClientRequest} addGroupClientRequest
     * @returns {void}
     */
    public async addGroupClient(addGroupClientRequest: IAddGroupClientRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.ADD_GROUP_CLIENT, addGroupClientRequest) as Promise<void>);
    }

    /**
     * Remove a client from a group.
     * @param {IRemoveGroupClientRequest} removeGroupClientRequest
     * @returns {void}
     */
    public async removeGroupClient(removeGroupClientRequest: IRemoveGroupClientRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.REMOVE_GROUP_CLIENT, removeGroupClientRequest) as Promise<void>);
    }

    /**
     * Get a group.
     * @param {string} groupname
     * @returns {IGetGroupResponse}
     */
    public async getGroup(groupname: string): Promise<IGetGroupResponse> {
        return await (this.sendCmd(EnumMQTTCmd.GET_GROUP, { groupname }) as Promise<IGetGroupResponse>);
    }

    /**
     * List groups.
     * @param {IListGroupsRequest} listGroupsRequest 
     * @returns {IListGroupsResponse}
     */
    public async listGroups(listGroupsRequest: IListGroupsRequest): Promise<IListGroupsResponse> {
        return await (this.sendCmd(EnumMQTTCmd.LIST_GROUPS, listGroupsRequest) as Promise<IListGroupsResponse>);
    }

    //
    // Roles
    //

    /**
     * Create a role.
     * @param {ICreateRoleRequest} createRoleRequest
     * @returns {void}
     */
    public async createRole(createRoleRequest: ICreateRoleRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.CREATE_ROLE, createRoleRequest) as Promise<void>);
    }

    /**
     * Delete a role.
     * @param {string} rolename
     * @returns {void}
     */
    public async deleteRole(rolename: string): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.DELETE_ROLE, { rolename }) as Promise<void>);
    }    
    
    /**
     * Add an ACL to a role.
     * @param {IAddRoleACLRequest} addRoleACLRequest
     * @returns {void}
     */
    public async addRoleACL(addRoleACLRequest: IAddRoleACLRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.ADD_ROLE_ACL, addRoleACLRequest) as Promise<void>);
    }
    
    /**
     * Remove an ACL from a role.
     * @param {IRemoveRoleACLRequest} removeRoleACLRequest
     * @returns {void}
     */
    public async removeRoleACL(removeRoleACLRequest: IRemoveRoleACLRequest): Promise<void> {
        return await (this.sendCmd(EnumMQTTCmd.REMOVE_ROLE_ACL, removeRoleACLRequest) as Promise<void>);
    }
    
    /**
     * Get a role.
     * @param {string} rolename
     * @returns {IGetRoleResponse}
     */
    public async getRole(rolename: string): Promise<IGetRoleResponse> {
        return await (this.sendCmd(EnumMQTTCmd.GET_ROLE, { rolename }) as Promise<IGetRoleResponse>);
    }
    
    /**
     * List roles.
     * @param {IListRolesRequest} listRolesRequest
     * @returns {IListRolesResponse}
     */
    public async listRoles(listRolesRequest: IListRolesRequest): Promise<IListRolesResponse> {
        return await (this.sendCmd(EnumMQTTCmd.LIST_ROLES, listRolesRequest) as Promise<IListRolesResponse>);
    }

}
