// Extrait le texte brut depuis le JSON TipTap
export function extractTipTapText(content: unknown): string {
    if (!content || typeof content !== "object") return "";

    const texts: string[] = [];

    function traverse(node: unknown) {
        if (!node || typeof node !== "object") return;
        const n = node as Record<string, unknown>;

        if (n.type === "text" && typeof n.text === "string") {
            texts.push(n.text);
        }

        if (Array.isArray(n.content)) {
            n.content.forEach(traverse);
        }
    }

    traverse(content);
    return texts.join("\n");
}

// Compte les mots d'un texte brut (utile pour valider le < 10s / 500 mots)
export function countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
}