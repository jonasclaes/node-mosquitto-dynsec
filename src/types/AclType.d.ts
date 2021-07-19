declare module "MosquittoDynSec" {
    export type AclType =
        "publishClientSend" |
        "publishClientReceive" |
        "subscribeLiteral" |
        "subscribePattern" |
        "unsubscribeLiteral" |
        "unsubscribePattern";
}
