import * as z from 'zod'

export const postPatchSchema = z.object({
  title: z.string().min(3).max(128),

  content: z.any().optional(),
})
