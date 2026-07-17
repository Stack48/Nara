// src/app/api/files/[id]/permanent/route.ts
import { permanentlyDeleteFile } from "@/server/trash.service";
import { createFileActionHandler } from "../_lib/fileActionHandler";

// DELETE /api/files/:id/permanent — suppression définitive (S3 + DB)
export const DELETE = createFileActionHandler(permanentlyDeleteFile, {
    label: "permanent-delete-file",
    forbiddenMessage: "Droits insuffisants pour supprimer définitivement ce fichier",
});