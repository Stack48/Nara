import { z } from "zod";

export const rolesEnum = z.enum(["ADMIN", "LEAD_LYRICIST", "LYRICIST", "READONLY"]);

export const updateRoleSchema = z.object({
    role: rolesEnum,
});

export type Role = z.infer<typeof rolesEnum>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;