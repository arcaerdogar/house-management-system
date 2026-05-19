/** Mail mocks must load before any module that imports SES or job enqueue helpers. */
import "./mocks/mail.mock.js";

import dotenv from "dotenv";
import { beforeEach } from "vitest";
import { resetMailMocks } from "./mocks/mail.mock.js";

process.env.NODE_ENV = "test";
process.env.MAIL_MODE = "mock";

const testEnvDefaults: Record<string, string> = {
  PORT: "3000",
  JWT_SECRET: "housemate-test-jwt-secret-min-32-chars",
  JWT_ACCESS_EXPIRES_MIN: "15",
  JWT_TWO_FACTOR_EXPIRES_MIN: "10",
  REFRESH_EXPIRES_DAYS: "30",
  AWS_REGION: "eu-north-1",
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  SES_SENDER_EMAIL: "noreply@housemate.test",
  S3_BUCKET_NAME: "housemate-test-bucket",
  REDIS_URL: "redis://localhost:6379",
  ADMIN_EMAIL: "admin@housemate.test",
  ADMIN_PASSWORD: "TestAdminPass123!",
};

for (const [key, value] of Object.entries(testEnvDefaults)) {
  if (!process.env[key]?.trim()) {
    process.env[key] = value;
  }
}

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

beforeEach(() => {
  resetMailMocks();
});
