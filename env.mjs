import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().default("file:./prisma/dev.db"),
    OPENWEATHER_API_KEY: z.string().optional(),
    WEATHER_UNITS: z.enum(["metric", "imperial"]).optional(),
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    WEATHER_UNITS: process.env.WEATHER_UNITS,
    ANALYZE: process.env.ANALYZE,
  },
})
