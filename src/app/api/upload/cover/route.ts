import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { uploadFile, validateFile, deleteFile } from "@/server/s3.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // "project" | "lyrics"
        const id = formData.get("id") as string;

        if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

        const mimeType = file.type;
        const size = file.size;

        const validation = validateFile(size, mimeType);
        if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = mimeType.split("/")[1];
        const key = `covers/${user.id}/${type}/${id}-${Date.now()}.${ext}`;

        // Supprimer l'ancienne image si elle existe
        if (type === "project") {
            const existing = await prisma.project.findUnique({ where: { id } });
            if (existing?.imageUrl) {
                const oldKey = existing.imageUrl.split(".amazonaws.com/")[1];
                if (oldKey) await deleteFile(oldKey).catch(() => {});
            }
        } else if (type === "lyrics") {
            const existing = await prisma.lyrics.findUnique({ where: { id } });
            if (existing?.imageUrl) {
                const oldKey = existing.imageUrl.split(".amazonaws.com/")[1];
                if (oldKey) await deleteFile(oldKey).catch(() => {});
            }
        }

        await uploadFile(key, buffer, mimeType);

        const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION ?? "eu-north-1"}.amazonaws.com/${key}`;

        // Mettre à jour imageUrl en DB
        if (type === "project") {
            await prisma.project.update({
                where: { id },
                data: { imageUrl },
            });
        } else if (type === "lyrics") {
            await prisma.lyrics.update({
                where: { id },
                data: { imageUrl },
            });
        }

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Upload cover error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}