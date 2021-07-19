import { EnumAclType } from "../../enums/EnumAclType";

export interface ICreateRoleRequest {
    rolename: string;
    textname?: string;
    textdescription?: string;
    acls?: [{
        acltype: EnumAclType;
        topic: string;
        priority?: number;
        allow: boolean
    }]
}