import { describe, expect, it } from "vitest";

import { getEnv } from "@/config/env";

describe("Environment Configuration", () => {
  it("provides valid defaults for development", () => {
    const env = getEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.MONGODB_URI).toBeDefined();
    expect(env.SESSION_SECRET).toBeDefined();
    expect(env.QR_TOKEN_SECRET).toBeDefined();
    expect(env.SESSION_TTL_DAYS).toBe(60);
  });

  it("parses custom overrides correctly", () => {
    const env = getEnv({
      NODE_ENV: "production",
      PORT: "8080",
      MONGODB_URI: "mongodb://production-cluster:27017/prod",
      SESSION_SECRET: "long-enough-session-secret-over-16-chars",
      QR_TOKEN_SECRET: "long-enough-qr-secret-over-16-chars",
    });
    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(8080);
    expect(env.MONGODB_URI).toBe("mongodb://production-cluster:27017/prod");
  });
});
