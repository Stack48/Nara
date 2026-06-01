import { z } from "zod";

export const rolesEnum = z.enum(["ADMIN", "LEAD_LYRICIST", "LYRICIST", "READONLY"]);

export const addMemberSchema = z.object({
    email: z.string().email("Email invalide"),
    role: rolesEnum,
});

export const updateRoleSchema = z.object({
    role: rolesEnum,
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;