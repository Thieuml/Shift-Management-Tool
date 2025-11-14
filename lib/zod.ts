import { z } from 'zod'

// API Query Parameter Schemas
export const scheduleQuerySchema = z.object({
  country: z.string().length(2),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const engineersQuerySchema = z.object({
  country: z.string().length(2),
  sector: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
})

export const assignBodySchema = z.object({
  engineerId: z.string(),
})

export const reassignBodySchema = z.object({
  engineerId: z.string(),
})

export const performedBodySchema = z.object({
  performedStart: z.string().datetime().optional(),
  performedEnd: z.string().datetime().optional(),
})

