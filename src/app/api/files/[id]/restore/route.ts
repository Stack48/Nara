// src/app/api/files/[id]/restore/route.ts
import { restoreFile } from "@/server/trash.service";
import { createFileActionHandler } from "../_lib/fileActionHandler";

// POST /api/files/:id/restore — restaure un fichier depuis la corbeille
export const POST = createFileActionHandler(restoreFile, {
    label: "restore-file",
    forbiddenMessage: "Droits insuffisants pour restaurer ce fichier",
});