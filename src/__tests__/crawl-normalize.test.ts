import { normalizeWord } from "@/server/crawl/utils/normalize-word";

describe("normalizeWord", () => {
  it("met en minuscules", () => {
    expect(normalizeWord("FLOW")).toBe("flow");
  });

  it("supprime les accents", () => {
    expect(normalizeWord("Écriture")).toBe("ecriture");
    expect(normalizeWord("mélodie")).toBe("melodie");
  });

  it("supprime la ponctuation", () => {
    expect(normalizeWord("mélodie!")).toBe("melodie");
  });

  it("trim et compacte les espaces", () => {
    expect(normalizeWord("  Flow  ")).toBe("flow");
    expect(normalizeWord("hip   hop")).toBe("hip hop");
  });

  it("conserve apostrophes et tirets", () => {
    expect(normalizeWord("aujourd'hui")).toBe("aujourd'hui");
    expect(normalizeWord("week-end")).toBe("week-end");
  });

  it("retourne chaîne vide pour entrée vide ou que ponctuation", () => {
    expect(normalizeWord("")).toBe("");
    expect(normalizeWord("!!!")).toBe("");
  });
});
