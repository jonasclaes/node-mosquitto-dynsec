import { EnumAclType } from "../../enums";

export interface IGetRoleResponse {
    role: {
        rolename: string;
        acls: [{
            acltype: EnumAclType;
            topic: string;
            priority?: number;
            allow?: boolean;
        }]
    }
}