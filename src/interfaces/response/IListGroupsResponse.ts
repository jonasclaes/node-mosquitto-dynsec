import { IGetGroupResponse } from "./IGetGroupResponse";

export interface IListGroupsResponse {
    totalCount: number;
    groups: [string | IGetGroupResponse]
}