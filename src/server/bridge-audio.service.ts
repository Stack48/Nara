import { prisma } from "@/lib/prisma";

const BRIDGE_AUDIO_API = "https://api.bridge.audio/v1";
const BRIDGE_CLIENT_ID = process.env.BRIDGE_AUDIO_CLIENT_ID;
const BRIDGE_CLIENT_SECRET = process.env.BRIDGE_AUDIO_CLIENT_SECRET;

// Token OAuth2 en mémoire
let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Récupère un token OAuth2
async function getAccessToken(): Promise<string | null> {
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    if (!BRIDGE_CLIENT_ID || !BRIDGE_CLIENT_SECRET) {
        console.warn("Bridge.audio credentials manquants — mode fallback");
        return null;
    }

    try {
        const response = await fetch(`${BRIDGE_AUDIO_API}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: BRIDGE_CLIENT_ID,
                client_secret: BRIDGE_CLIENT_SECRET,
                grant_type: "client_credentials",
            }),
        });

        if (!response.ok) throw new Error("Bridge.audio auth failed");

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = Date.now() + data.expires_in * 1000;

        return accessToken;
    } catch (error) {
        console.error("Bridge.audio OAuth2 error:", error);
        return null;
    }
}

// Récupère les métadonnées d'une track Bridge.audio
export async function getBridgeTrackMetadata(bridgeAudioId: string) {
    const token = await getAccessToken();

    // Fallback si Bridge.audio indisponible
    if (!token) {
        return {
            fallback: true,
            message: "Bridge.audio indisponible — métadonnées locales utilisées",
        };
    }

    try {
        const response = await fetch(
            `${BRIDGE_AUDIO_API}/tracks/${bridgeAudioId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) throw new Error("Track introuvable");

        return await response.json();
    } catch (error) {
        // Fallback gracieux
        console.error("Bridge.audio track error:", error);
        return {
            fallback: true,
            message: "Bridge.audio indisponible — métadonnées locales utilisées",
        };
    }
}

// Sync les métadonnées Bridge.audio vers LabelCopy
export async function syncLabelCopy(
    projectId: string,
    bridgeAudioId: string
) {
    const metadata = await getBridgeTrackMetadata(bridgeAudioId);

    if (metadata.fallback) return metadata;

    const labelCopy = await prisma.labelCopy.upsert({
        where: {
            id: (await prisma.labelCopy.findFirst({
                where: { projectId, bridgeAudioId }
            }))?.id ?? "new"
        },
        update: {
            title: metadata.title,
            isrc: metadata.isrc,
            composers: metadata.composers ?? [],
            publishers: metadata.publishers ?? [],
            recordLabel: metadata.record_label,
        },
        create: {
            title: metadata.title,
            isrc: metadata.isrc,
            composers: metadata.composers ?? [],
            publishers: metadata.publishers ?? [],
            recordLabel: metadata.record_label,
            projectId,
            bridgeAudioId,
        },
    });

    return labelCopy;
}