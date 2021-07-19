import { MosquittoDynSec } from "./dist/index.js";

async function run() {
    const dynsec = new MosquittoDynSec();
    await dynsec.connect({
        password: "test"
    });

    dynsec.getDefaultACLAccess("publishClientSend");

    dynsec.disconnect();
}

run();