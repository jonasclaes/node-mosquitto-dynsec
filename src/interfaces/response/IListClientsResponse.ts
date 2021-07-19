export interface IListClientsResponse {
    totalCount: number;
    clients: [string | {
        username: string;
        clientid?: string;
        textname?: string;
        textdescription?: string;
        roles: [{
            rolename: string;
        }]
        groups: object[];
    }];
}