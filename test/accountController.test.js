const request = require("supertest");
const app = require("../app.js");
const Account = require("../models/account.js");

describe("Create Account", () => {
  test("should create a new account and return the account ID and balance", async () => {
    const initialBalance = 1000;
    const response = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accountId");
    expect(response.body).toHaveProperty("balance");

    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});

describe("Deposit to Account", () => {
  test("should deposit amount to account and return updated balance", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 0 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "0.00");

    const accountId = createResponse.body.accountId;

    const depositResponse = await request(app)
      .post("/accounts/deposit")
      .send({ accountId, amount: 100 });

    expect(depositResponse.status).toBe(200);
    expect(depositResponse.body).toHaveProperty("balance", 100);
  });
});

describe("Withdraw from Account", () => {
  test("should not withdraw any amount if the balance is equal is zero", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 0 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "0.00");

    const accountId = createResponse.body.accountId;

    const withdrawResponse = await request(app)
      .post("/accounts/withdraw")
      .send({ accountId, amount: 500 });

    expect(withdrawResponse.status).toBe(400);
    expect(withdrawResponse.body).toHaveProperty(
      "error",
      "Insufficient funds."
    );
  });

  test("should withdraw amount to account and return updated balance", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 1000 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "1000.00");

    const accountId = createResponse.body.accountId;

    const withdrawResponse = await request(app)
      .post("/accounts/withdraw")
      .send({ accountId, amount: 500 });

    expect(withdrawResponse.status).toBe(200);
    expect(withdrawResponse.body).toHaveProperty("balance", 500);
  });
});

describe("Transfer Money", () => {
  test("should not transfer if sourceAccount has a balance of zero", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 0 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "0.00");

    const accountId = createResponse.body.accountId;

    const withdrawResponse = await request(app)
      .post("/accounts/withdraw")
      .send({ accountId, amount: 500 });

    expect(withdrawResponse.status).toBe(400);
    expect(withdrawResponse.body).toHaveProperty(
      "error",
      "Insufficient funds."
    );
  });

  test("should transfer amount and return updated balances of both accounts", async () => {
    const createFirstResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 1000 });

    expect(createFirstResponse.status).toBe(201);
    expect(createFirstResponse.body).toHaveProperty("accountId");
    expect(createFirstResponse.body).toHaveProperty("balance", "1000.00");

    const createSecondResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 1000 });

    expect(createSecondResponse.status).toBe(201);
    expect(createSecondResponse.body).toHaveProperty("accountId");
    expect(createSecondResponse.body).toHaveProperty("balance", "1000.00");

    const sourceAccountId = createFirstResponse.body.accountId;
    const destinationAccountId = createSecondResponse.body.accountId;

    const transferResponse = await request(app)
      .post("/accounts/transfer")
      .send({ sourceAccountId, destinationAccountId, amount: 500 });

    expect(transferResponse.status).toBe(200);
    expect(transferResponse.body).toHaveProperty("sourceAccountBalance", 500);
    expect(transferResponse.body).toHaveProperty(
      "destinationAccountBalance",
      1500
    );
  });
});

describe("Get Balance of Account", () => {
  test("should get updated balance of account", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 1000 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "1000.00");

    const accountId = createResponse.body.accountId;

    const balanceResponse = await request(app).get(
      `/accounts/accounts/current-balance/${accountId}`
    );

    expect(balanceResponse.status).toBe(200);
    expect(balanceResponse.body).toHaveProperty("balance", "1000.00");
  });

  test("should return 404 if account is not found", async () => {
    const fakeAccountId = "fake-id";

    jest.spyOn(Account, "findByPk").mockResolvedValueOnce(null);

    const balanceResponse = await request(app).get(
      `/accounts/accounts/current-balance/${fakeAccountId}`
    );

    expect(balanceResponse.status).toBe(404);
    expect(balanceResponse.body).toHaveProperty("error", "Account not found.");
  });

  test("should return 500 when an error occurs", async () => {
    const createResponse = await request(app)
      .post("/accounts/create-account")
      .send({ initialBalance: 1000 });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("accountId");
    expect(createResponse.body).toHaveProperty("balance", "1000.00");

    const accountId = createResponse.body.accountId;

    jest.spyOn(Account, "findByPk").mockImplementationOnce(() => {
      throw new Error("Mocked error");
    });

    const balanceResponse = await request(app).get(
      `/accounts/accounts/current-balance/${accountId}`
    );

    expect(balanceResponse.status).toBe(500);
    expect(balanceResponse.body).toHaveProperty(
      "error",
      "Failed to get account balance."
    );
  });
});
