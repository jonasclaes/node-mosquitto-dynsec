export interface ICommandPayload {
    command: string;
    [opt: string]: string;
}