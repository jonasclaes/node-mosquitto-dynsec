export interface IPendingCommand {
    resolve: (data?: object) => void;
    reject: (error?: string) => void;
}