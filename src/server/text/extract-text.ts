// Extrait le texte brut depuis le JSON de lyrics
// Supporte : TipTap standard, format éditeur (sections/lines),
// et contenu doublement sérialisé (chaîne JSON)
export function extractTipTapText(content: unknown): string {
    let root: unknown = content;

    // Le contenu peut être stocké comme chaîne JSON (double sérialisation)
    if (typeof root === "string") {
        const raw = root;
        try {
            root = JSON.parse(raw);
        } catch {
            return raw.trim(); // texte brut, on le prend tel quel
        }
    }

    if (!root || typeof root !== "object") return "";

    const texts: string[] = [];

    function traverse(node: unknown) {
        if (!node || typeof node !== "object") return;

        if (Array.isArray(node)) {
            node.forEach(traverse);
            return;
        }

        const n = node as Record<string, unknown>;

        if (n.type === "text" && typeof n.text === "string") {
            texts.push(n.text);
        }

        for (const key of ["content", "sections", "lines", "alternatives"]) {
            if (n[key]) traverse(n[key]);
        }
    }

    traverse(root);
    return texts.join(" ");
}