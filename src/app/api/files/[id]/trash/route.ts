// src/app/api/files/[id]/trash/route.ts
import { trashFile } from "@/server/trash.service";
import { createFileActionHandler } from "../_lib/fileActionHandler";

// POST /api/files/:id/trash — envoie le fichier à la corbeille
export const POST = createFileActionHandler(trashFile, {
    label: "trash-file",
    forbiddenMessage: "Droits insuffisants pour supprimer ce fichier",
});