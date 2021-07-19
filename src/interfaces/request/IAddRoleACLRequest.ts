import { EnumAclType } from "../../enums";

export interface IAddRoleACLRequest {
    rolename: string;
    acltype: EnumAclType;
    topic: string;
    priority?: number;
    allow?: boolean;
}