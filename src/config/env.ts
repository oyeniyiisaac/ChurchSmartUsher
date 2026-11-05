import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/church-attendance"),
  SESSION_SECRET: z
    .string()
    .min(16)
    .default("church-connect-session-development-secret-key-at-least-32-chars"),
  SESSION_COOKIE_NAME: z.string().min(1).default("church_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(60),
  APP_URL: z.string().url().default("http://localhost:3000"),
  QR_TOKEN_SECRET: z
    .string()
    .min(16)
    .default("church-connect-qr-token-development-secret-key-at-least-32-chars"),
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().default("http://localhost:3000/api/graphql"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(source);
}
