import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    description: z.string().optional(),
    genre: z.string().optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    genre: z.string().optional(),
    status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;