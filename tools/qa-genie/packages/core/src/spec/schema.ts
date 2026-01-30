import { z } from 'zod';

export const ProjectSpecSchema = z.object({
  baseUrl: z.string().url(),
  goals: z.array(z.string()).default([]),
  auth: z
    .object({
      mode: z.enum(['none', 'credentials']).default('none'),
      username: z.string().optional(),
      password: z.string().optional()
    })
    .default({ mode: 'none' })
});

export type ProjectSpec = z.infer<typeof ProjectSpecSchema>;
