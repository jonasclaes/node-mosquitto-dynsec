import { EnumAclType } from "../../enums";

export interface IRemoveRoleACLRequest {
    rolename: string;
    acltype: EnumAclType;
    topic: string;
}