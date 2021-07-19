import { MosquittoDynSec } from "./dist/index.js";

async function run() {
    // Functional test
    const dynsec = new MosquittoDynSec();
    try {
        await dynsec.connect({
        password: "test"
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

    // await dynsec.deleteClient({ username: "Jonas" });

    dynsec.disconnect();
}

try {
    run();
} catch (e) {
    console.error(e);
}