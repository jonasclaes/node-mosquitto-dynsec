export interface IListGroupsResponse {
    totalCount: number;
    groups: [string | {
        groupname: string;
        clients: object[];
        roles: object[];
    }]
}