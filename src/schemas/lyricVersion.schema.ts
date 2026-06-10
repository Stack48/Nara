import { z } from "zod";

export const restoreVersionSchema = z.object({
    versionId: z.string().min(1, "Version ID requis"),
});

export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;