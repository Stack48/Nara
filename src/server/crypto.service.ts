import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Récupère la clé depuis les variables d'environnement
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error("ENCRYPTION_KEY manquante dans .env");

    // Dérive une clé de 32 bytes depuis la clé en string
    return crypto.scryptSync(key, "nara-salt", KEY_LENGTH);
}

// Chiffre un objet JSON
export function encrypt(data: object): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([
        cipher.update(json, "utf8"),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format : iv:tag:encrypted (tout en base64)
    return [
        iv.toString("base64"),
        tag.toString("base64"),
        encrypted.toString("base64"),
    ].join(":");
}

// Déchiffre vers un objet JSON
export function decrypt(encryptedData: string): object {
    const key = getEncryptionKey();
    const [ivBase64, tagBase64, encryptedBase64] = encryptedData.split(":");

    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    const encrypted = Buffer.from(encryptedBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
}

// Vérifie si un contenu est chiffré
export function isEncrypted(data: string): boolean {
    return typeof data === "string" && data.split(":").length === 3;
}