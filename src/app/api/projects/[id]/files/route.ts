import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { uploadFile, uploadMultipart, validateFile, getSignedFileUrl } from "@/server/s3.service";
import { v4 as uuidv4 } from "uuid";

// GET /api/projects/:id/files
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
    if (!authorized) return forbidden();

    const files = await prisma.file.findMany({
        where: { projectId: params.id },
        include: {
            uploader: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Génère les URLs signées pour chaque fichier
    const filesWithUrls = await Promise.all(
        files.map(async (file) => ({
            ...file,
            url: await getSignedFileUrl(file.s3Key),
        }))
    );

    return NextResponse.json(filesWithUrls);
}

// POST /api/projects/:id/files
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden("Accès refusé");

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    // Récupère le fichier depuis le form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    // Validation
    const validation = validateFile(file.size, file.type);
    if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `projects/${params.id}/${uuidv4()}-${file.name}`;

    // Upload multipart si > 5MB, sinon upload simple
    const MULTIPART_THRESHOLD = 5 * 1024 * 1024;
    if (file.size > MULTIPART_THRESHOLD) {
        await uploadMultipart(key, buffer, file.type);
    } else {
        await uploadFile(key, buffer, file.type);
    }

    // Sauvegarde en DB
    const savedFile = await prisma.file.create({
        data: {
            name: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            s3Key: key,
            s3Bucket: process.env.AWS_S3_BUCKET ?? "nara-files",
            projectId: params.id,
            uploadedBy: user.id,
        },
        include: {
            uploader: { select: { id: true, name: true, username: true } },
        },
    });

    const url = await getSignedFileUrl(key);

    return NextResponse.json({ ...savedFile, url }, { status: 201 });
}