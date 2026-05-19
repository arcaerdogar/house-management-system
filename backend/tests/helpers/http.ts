import request from "supertest";
import type { Application } from "express";
import { randomUUID } from "crypto";

export function api(app: Application) {
  return request(app);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@housemate.test`;
}

export interface AuthSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export async function registerAndLogin(
  app: Application,
  email: string,
  password = "TestPass123!"
): Promise<AuthSession> {
  const reg = await api(app)
    .post("/auth/register")
    .send({ email, password })
    .expect(201);

  const accessToken = reg.body.access as string;
  const refreshToken = reg.body.session.refreshToken as string;
  const userId = reg.body.user.id as string;
  const deviceId = reg.body.session.deviceId as string;

  return { userId, email, accessToken, refreshToken, deviceId };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
