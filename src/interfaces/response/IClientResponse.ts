export interface IClientResponse {
    client: {
        username: string;
        clientid: string;
        roles: [{
            rolename: string;
        }]
        groups: object[];
    }
}