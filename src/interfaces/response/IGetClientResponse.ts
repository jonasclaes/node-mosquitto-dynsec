export interface IGetClientResponse {
    client: {
        username: string;
        clientid: string;
        roles: [{
            rolename: string;
        }]
        groups: object[];
    }
}