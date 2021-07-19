import { EnumAclType } from "./dist/enums/EnumAclType.js";
import { MosquittoDynSec } from "./dist/index.js";

async function run() {
    // Functional test
    const dynsec = new MosquittoDynSec();
    try {
        await dynsec.connect({
            host: "127.0.0.1",
            password: "admin"
        });
    } catch (e) {
        console.error("Could not connect to MQTT server.");
        process.exit(1);
    }

    // console.log(await dynsec.getDefaultACLAccess());
    // console.log(await dynsec.getAnonymousGroup());

    // await dynsec.createClient({
    //     username: "Jonas",
    //     password: "test123"
    // });

    // await dynsec.setClientPassword({
    //     username: "Jonas",
    //     password: "test"
    // });

    // await dynsec.setClientId({
    //     username: "Jonas",
    //     clientid: "jonas1234"
    // });

    // await dynsec.addClientRole({
    //     username: "Jonas",
    //     rolename: "admin"
    // });

    // await dynsec.removeClientRole({
    //     username: "Jonas",
    //     rolename: "admin"
    // });

    // console.log(await dynsec.getClient("admin-user"));

    // console.log(await dynsec.listClients());

    // await dynsec.enableClient("Jonas");

    // await dynsec.disableClient("Jonas");

    // await dynsec.createGroup({
    //     groupname: "testgrp"
    // });

    // await dynsec.deleteGroup("testgrp");

    // console.log(await dynsec.getGroup("testgrp"));

    // console.log(await dynsec.listGroups({ verbose: true }));

    // await dynsec.deleteClient({ username: "Jonas" });

    // await dynsec.deleteRole("testrole");

    // await dynsec.createRole({
    //     rolename: "testrole",
    //     acls: [{
    //         acltype: EnumAclType.PUBLISH_CLIENT_SEND,
    //         topic: "/",
    //         allow: true
    //     }, {
    //         acltype: EnumAclType.PUBLISH_CLIENT_RECEIVE,
    //         topic: "/",
    //         allow: true
    //     }]
    // });

    // await dynsec.addRoleACL({
    //     rolename: "testrole",
    //     acltype: EnumAclType.PUBLISH_CLIENT_SEND,
    //     topic: "test/v1",
    //     allow: true
    // });

    // await dynsec.removeRoleACL({
    //     rolename: "testrole",
    //     acltype: EnumAclType.PUBLISH_CLIENT_SEND,
    //     topic: "test/v1"
    // });
    
    dynsec.disconnect();
}

try {
    run();
} catch (e) {
    console.error(e);
}