import { MosquittoDynSec } from "./dist/index.js";

async function run() {
    // Functional test
    const dynsec = new MosquittoDynSec();
    await dynsec.connect({
        password: "test"
    });

    dynsec.getDefaultACLAccess("publishClientSend");

    dynsec.disconnect();
}

run();