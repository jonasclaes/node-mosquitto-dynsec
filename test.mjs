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

    console.log(await dynsec.getDefaultACLAccess());
    console.log(await dynsec.getAnonymousGroup());

    // dynsec.createClient({
    //     username: "Jonas",
    //     password: "test123"
    // });

    dynsec.disconnect();
}

try {
    run();
} catch (e) {
    console.error(e);
}