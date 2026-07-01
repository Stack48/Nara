// Description minimale d'un nœud TipTap (on ne décrit que ce qu'on utilise)
type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

// 1) Récupère tout le texte d'un document TipTap, en descendant récursivement
function extractFromTipTap(node: TipTapNode | null | undefined): string {
  if (!node) return "";
  let result = typeof node.text === "string" ? node.text : "";
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      result += extractFromTipTap(child);
    }
  }
  return result;
}

// 2) Forme de la structure "chanson" stockée dans Lyrics.content
type LyricsContent = {
  sections?: {
    lines?: {
      text?: string;
      content?: TipTapNode;
    }[];
  }[];
};

// 3) Transforme le contenu d'un Lyrics en texte brut
export function extractPlainText(content: unknown): string {
  const data = content as LyricsContent;
  if (!data || !Array.isArray(data.sections)) return "";

  const sectionsText: string[] = [];

  for (const section of data.sections) {
    if (!Array.isArray(section.lines)) continue;

    const linesText: string[] = [];
    for (const line of section.lines) {
      // On lit d'abord le document TipTap (la source de vérité)…
      const fromDoc = extractFromTipTap(line.content).trim();
      // …et si c'est vide, on retombe sur le champ "text" de secours.
      const text = fromDoc || (line.text ?? "").trim();
      if (text) linesText.push(text);
    }

    if (linesText.length > 0) sectionsText.push(linesText.join("\n"));
  }

  return sectionsText.join("\n\n").trim();
}