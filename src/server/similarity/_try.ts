import { analyzeSimilarity, normalizeText, getWordNGrams } from "./similarity.service";

const reference = {
    id: "ref-1",
    title: "Chanson témoin",
    artist: "Artiste Test",
    normalizedText: normalizeText(
        "Je marche seul dans la ville endormie, les lumières s'éteignent une à une, et je pense à toi sous la lune"
    ),
    ngramHashes: getWordNGrams(
        normalizeText(
            "Je marche seul dans la ville endormie, les lumières s'éteignent une à une, et je pense à toi sous la lune"
        )
    ),
};

const monTexte =
    "Ce soir je marche seul dans la ville endormie, tout est calme, les lumières s'éteignent une à une dans le noir";

console.time("analyse");
const result = analyzeSimilarity(monTexte, [reference]);
console.timeEnd("analyse");
console.log(JSON.stringify(result, null, 2));