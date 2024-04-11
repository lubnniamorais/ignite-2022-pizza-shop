import { z as zod } from 'zod';

const envSchema = zod.object({
  VITE_API_URL: zod.string().url(),
});

export const env = envSchema.parse(import.meta.env.BASE_URL);
