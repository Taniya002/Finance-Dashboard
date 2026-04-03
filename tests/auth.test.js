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

describe("Auth API", () => {
  const validUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    role: "admin",
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user and return a token", async () => {
      const res = await request(app).post("/api/auth/register").send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("should return 422 for missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "bad@example.com" });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app).post("/api/auth/register").send(validUser);
      expect(res.status).toBe(409);
    });

    it("should return 422 for invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, email: "not-an-email" });
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(validUser);
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: validUser.email,
        password: validUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: validUser.email,
        password: "wrongpass",
      });
      expect(res.status).toBe(401);
    });

    it("should return 401 for non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "password123",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send(validUser);
      const token = registerRes.body.data.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});
