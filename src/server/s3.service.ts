import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Types MIME autorisés
export const ALLOWED_MIME_TYPES = [
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/flac",
    "audio/aac",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

// Limite 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

const s3 = new S3Client({
    region: process.env.AWS_REGION ?? "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET ?? "nara-files";

// Retry logic x3
async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 500
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise((res) => setTimeout(res, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
}

// Upload simple (< 5MB)
export async function uploadFile(
    key: string,
    body: Buffer,
    mimeType: string
): Promise<string> {
    await withRetry(() =>
        s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: body,
                ContentType: mimeType,
            })
        )
    );
    return key;
}

// Upload multipart (> 5MB)
export async function uploadMultipart(
    key: string,
    body: Buffer,
    mimeType: string
): Promise<string> {
    // Démarre l'upload multipart
    const { UploadId } = await withRetry(() =>
        s3.send(
            new CreateMultipartUploadCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: mimeType,
            })
        )
    );

    const partSize = 5 * 1024 * 1024; // 5MB par part
    const parts: CompletedPart[] = [];

    try {
        // Upload chaque partie
        for (let i = 0; i < Math.ceil(body.length / partSize); i++) {
            const start = i * partSize;
            const end = Math.min(start + partSize, body.length);
            const part = body.slice(start, end);

            const { ETag } = await withRetry(() =>
                s3.send(
                    new UploadPartCommand({
                        Bucket: BUCKET,
                        Key: key,
                        UploadId,
                        PartNumber: i + 1,
                        Body: part,
                    })
                )
            );

            parts.push({ PartNumber: i + 1, ETag });
        }

        // Complète l'upload
        await withRetry(() =>
            s3.send(
                new CompleteMultipartUploadCommand({
                    Bucket: BUCKET,
                    Key: key,
                    UploadId,
                    MultipartUpload: { Parts: parts },
                })
            )
        );

        return key;
    } catch (error) {
        // Annule l'upload en cas d'erreur
        await s3.send(
            new AbortMultipartUploadCommand({
                Bucket: BUCKET,
                Key: key,
                UploadId,
            })
        );
        throw error;
    }
}

// Génère une URL signée (expiration 1h)
export async function getSignedFileUrl(key: string): Promise<string> {
    return await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 }
    );
}

// Supprime un fichier S3
export async function deleteFile(key: string): Promise<void> {
    await withRetry(() =>
        s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    );
}

// Valide le fichier avant upload
export function validateFile(
    size: number,
    mimeType: string
): { valid: boolean; error?: string } {
    if (size > MAX_FILE_SIZE) {
        return { valid: false, error: "Fichier trop lourd (max 50MB)" };
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { valid: false, error: `Type de fichier non autorisé: ${mimeType}` };
    }
    return { valid: true };
}