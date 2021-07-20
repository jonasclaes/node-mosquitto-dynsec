const { MosquittoDynSec } = require("../dist/index");

let instance;

beforeEach(async () => {
    instance = new MosquittoDynSec();
    await instance.connect({
        password: "test"
    });
});

afterEach(async () => {
    await instance.disconnect();
});

test("it should create an instance", () => {
    expect(instance).toBeInstanceOf(MosquittoDynSec);
});

test("it should return a default ACL", async () => {
    const res = await instance.getDefaultACLAccess();
    expect(res).toBeInstanceOf(Object);
});

test("it should return an anonymous group", async () => {
    const res = await instance.getAnonymousGroup();
    expect(res).toBeInstanceOf(Object);
});