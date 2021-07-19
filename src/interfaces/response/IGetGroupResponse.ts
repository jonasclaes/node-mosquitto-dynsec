export interface IGetGroupResponse {
    group: {
        groupname: string;
        clients: object[];
        roles: object[];
    }
}