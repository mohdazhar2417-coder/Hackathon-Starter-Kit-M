import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Try to load .env from root or current directory
dotenv.config(); // CWD
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), "../.env") });
// For bundled output
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.join(__dirname, "../.env") });
  dotenv.config({ path: path.join(__dirname, "../../.env") });
}

const envSchema = z.object({
  PORT: z.string().default("8082"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BACKEND_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_INSTITUTIONAL_PRICE_ID: z.string().optional(),
  USE_MEMORY_DB: z.string().optional(),
  INSTAMOJO_API_KEY: z.string().optional(),
  INSTAMOJO_AUTH_TOKEN: z.string().optional(),
  INSTAMOJO_SALT: z.string().optional(),
  INSTAMOJO_SANDBOX: z.string().optional(),
  UPI_VPA: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
