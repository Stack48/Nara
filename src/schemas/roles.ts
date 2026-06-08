import { z } from 'zod';

export const updateRoleSchema = z.object({
    role: z.enum(['ADMIN', 'LEAD_LYRICIST', 'LYRICIST', 'READONLY']),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;