import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const API_KEY = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
    if (!API_KEY) return null;
    client ??= new Anthropic({ apiKey: API_KEY });
    return client;
}

export function isClaudeConfigured(): boolean {
    return Boolean(API_KEY);
}

const SYSTEM_PROMPT = `Tu es un parolier francophone expert. On te donne une phrase issue d'un texte de chanson.
Propose des reformulations alternatives qui conservent le sens et l'intention, tout en variant le vocabulaire, le rythme ou les images.
Chaque alternative doit rester une phrase chantable, de longueur comparable à l'originale.
Ne renvoie jamais la phrase d'origine à l'identique.`;

// Schéma de sortie structurée : force Claude à renvoyer un JSON exploitable
const OUTPUT_SCHEMA = {
    type: "object",
    properties: {
        alternatives: {
            type: "array",
            items: { type: "string" },
        },
    },
    required: ["alternatives"],
    additionalProperties: false,
} as const;

/**
 * Génère des versions alternatives d'une phrase via l'API Claude.
 * Retourne au plus `max` alternatives (2–3 par défaut).
 */
export async function generateAlternatives(
    phrase: string,
    max = 3
): Promise<string[]> {
    const anthropic = getClient();
    if (!anthropic) {
        throw new Error("ANTHROPIC_API_KEY non configurée");
    }

    const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: `Phrase : "${phrase}"\nPropose exactement ${max} alternatives.`,
            },
        ],
        output_config: {
            format: {
                type: "json_schema",
                schema: OUTPUT_SCHEMA,
            },
        },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

    let parsed: { alternatives?: unknown };
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("Réponse IA illisible");
    }

    const alternatives = Array.isArray(parsed.alternatives)
        ? parsed.alternatives.filter(
              (a): a is string => typeof a === "string" && a.trim().length > 0
          )
        : [];

    // Garantit la limite 2–3 alternatives max par phrase
    return alternatives.slice(0, max);
}
