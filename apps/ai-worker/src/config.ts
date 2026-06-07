import { z } from "zod";

const ConfigSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  ASPNET_API_URL: z.url(),
  ASPNET_API_KEY: z.string().min(1),
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:\n",
    z.prettifyError(parsed.error),
  );
  process.exit(1);
}

export const config = parsed.data;
