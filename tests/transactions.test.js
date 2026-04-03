require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, disconnectTestDB, clearCollections } = require("./setup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

// Helper: register and return token
const getToken = async (role = "admin") => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: `${role} user`,
      email: `${role}@test.com`,
      password: "password123",
      role,
    });
  return res.body.data.token;
};

const validTransaction = {
  amount: 1500,
  type: "income",
  category: "salary",
  date: "2024-03-01",
  notes: "March salary",
};

describe("Transactions API", () => {
  describe("POST /api/transactions", () => {
    it("admin can create a transaction", async () => {
      const token = await getToken("admin");
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
      expect(res.status).toBe(201);
      expect(res.body.data.transaction.amount).toBe(1500);
    });

    it("analyst can create a transaction", async () => {
      const token = await getToken("analyst");
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
      expect(res.status).toBe(201);
    });

    it("viewer cannot create a transaction", async () => {
      const token = await getToken("viewer");
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
      expect(res.status).toBe(403);
    });

    it("returns 422 for missing required fields", async () => {
      const token = await getToken("admin");
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 }); // missing type and category
      expect(res.status).toBe(422);
    });

    it("returns 422 for negative amount", async () => {
      const token = await getToken("admin");
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validTransaction, amount: -50 });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/transactions", () => {
    let token;
    beforeEach(async () => {
      token = await getToken("admin");
      await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
    });

    it("viewer can read transactions", async () => {
      const viewerToken = await getToken("viewer");
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(1);
    });

    it("supports filtering by type", async () => {
      const res = await request(app)
        .get("/api/transactions?type=income")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.transactions.every((t) => t.type === "income")).toBe(true);
    });

    it("supports filtering by category", async () => {
      const res = await request(app)
        .get("/api/transactions?category=salary")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.transactions[0].category).toBe("salary");
    });

    it("returns pagination metadata", async () => {
      const res = await request(app)
        .get("/api/transactions?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("pagination");
      expect(res.body.data.pagination).toHaveProperty("total");
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/transactions/:id", () => {
    it("admin can update a transaction", async () => {
      const token = await getToken("admin");
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
      const id = createRes.body.data.transaction._id;

      const res = await request(app)
        .patch(`/api/transactions/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 2000 });
      expect(res.status).toBe(200);
      expect(res.body.data.transaction.amount).toBe(2000);
    });

    it("viewer cannot update a transaction", async () => {
      const adminToken = await getToken("admin");
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validTransaction);
      const id = createRes.body.data.transaction._id;

      const viewerToken = await getToken("viewer");
      const res = await request(app)
        .patch(`/api/transactions/${id}`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ amount: 999 });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    it("admin can soft-delete a transaction", async () => {
      const token = await getToken("admin");
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send(validTransaction);
      const id = createRes.body.data.transaction._id;

      const deleteRes = await request(app)
        .delete(`/api/transactions/${id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);

      // Should not appear in normal listing
      const listRes = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.body.data.transactions).toHaveLength(0);
    });

    it("analyst cannot delete a transaction", async () => {
      const adminToken = await getToken("admin");
      const createRes = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validTransaction);
      const id = createRes.body.data.transaction._id;

      const analystToken = await getToken("analyst");
      const res = await request(app)
        .delete(`/api/transactions/${id}`)
        .set("Authorization", `Bearer ${analystToken}`);
      expect(res.status).toBe(403);
    });
  });
});
