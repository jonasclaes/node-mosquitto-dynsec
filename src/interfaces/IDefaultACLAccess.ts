import { DefaultAclType } from "MosquittoDynSec";

export interface IDefaultACLAccess {
    acltype: DefaultAclType;
    allow: boolean;
}