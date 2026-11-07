import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z
    .string()
    .default(
      "mongodb+srv://isaacoyeniyi0_db_user:churchconnect@cluster0.91g2was.mongodb.net/rccg_jesus_house_ogbomosho?retryWrites=true&w=majority",
    ),
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
  CLOUDINARY_CLOUD_NAME: z.string().default("dymwwtqqw"),
  CLOUDINARY_API_KEY: z.string().default("225777811363325"),
  CLOUDINARY_API_SECRET: z.string().default("zYzIP6ShcegnqPbKT9Bn-TbDQkI"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(source);
}
