import { EnumAclType } from "../../enums";

export interface IListRolesResponse {
    totalCount: number;
    clients: [string | {
        rolename: string;
        acls: [{
            acltype: EnumAclType;
            topic: string;
            priority?: number;
            allow?: boolean;
        }]
    }];
}