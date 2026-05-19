import type { Application } from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  disconnectDatabase,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db.js";
import { getApp } from "../helpers/app.js";
import { api, registerAndLogin, uniqueEmail } from "../helpers/http.js";

describe.skipIf(!hasTestDatabase())("auth API", () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
    await resetDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("registers and returns access + refresh tokens", async () => {
    const email = uniqueEmail("reg");
    const res = await api(app)
      .post("/auth/register")
      .send({ email, password: "TestPass123!" })
      .expect(201);

    expect(res.body.user.email).toBe(email.toLowerCase());
    expect(res.body.access).toBeTruthy();
    expect(res.body.session.refreshToken).toBeTruthy();
    expect(res.body.session.deviceId).toBeTruthy();
  });

  it("rejects duplicate email on register", async () => {
    const email = uniqueEmail("dup");
    await api(app)
      .post("/auth/register")
      .send({ email, password: "TestPass123!" })
      .expect(201);

    const dup = await api(app)
      .post("/auth/register")
      .send({ email, password: "TestPass123!" })
      .expect(409);

    expect(dup.body.Error).toBeDefined();
  });

  it("rejects weak password", async () => {
    await api(app)
      .post("/auth/register")
      .send({ email: uniqueEmail("weak"), password: "short" })
      .expect(400);
  });

  it("logs in with valid credentials and rejects invalid", async () => {
    const email = uniqueEmail("login");
    const password = "TestPass123!";
    await api(app).post("/auth/register").send({ email, password }).expect(201);

    await api(app).post("/auth/login").send({ email, password }).expect(200);

    await api(app)
      .post("/auth/login")
      .send({ email, password: "WrongPass123!" })
      .expect(401);
  });

  it("refreshes access token with deviceId", async () => {
    const session = await registerAndLogin(app, uniqueEmail("refresh"));
    const refreshed = await api(app)
      .post("/auth/refresh")
      .send({
        refreshToken: session.refreshToken,
        deviceId: session.deviceId,
      })
      .expect(200);

    expect(refreshed.body.access).toBeTruthy();
    expect(refreshed.body.newRaw).toBeTruthy();
  });

  it("returns 401 for protected route without token", async () => {
    await api(app).post("/houses").send({ name: "X" }).expect(401);
  });
});
