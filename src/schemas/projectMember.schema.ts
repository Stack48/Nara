import { z } from "zod";
import { rolesEnum } from "@/schemas/updateRole.schema";

export const addMemberSchema = z.object({
    email: z.string().email("Email invalide"),
    role: rolesEnum,
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;