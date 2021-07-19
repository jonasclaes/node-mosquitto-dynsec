export interface IDefaultACLAccessResponse {
    acls: [{
        acltype: string;
        allow: boolean;
    }];
}