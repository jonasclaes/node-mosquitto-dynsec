import { IGetClientResponse } from "./IGetClientResponse";

export interface IListClientsResponse {
    totalCount: number;
    clients: [string | IGetClientResponse];
}