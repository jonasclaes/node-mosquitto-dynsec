import { EnumDefaultACLType } from "../enums";

export interface IDefaultACLAccess {
    acltype: EnumDefaultACLType;
    allow: boolean;
}