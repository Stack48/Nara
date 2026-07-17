import { PrismaClient } from "@prisma/client";
import {
    normalizeText,
    getWordNGrams,
} from "../src/server/similarity/similarity.service";

const prisma = new PrismaClient();

// Corpus de démo — en production, ces textes viendraient d'un vrai
// catalogue licencié. Ici des textes originaux pour tester le moteur.
const references = [
    {
        title: "Ville endormie",
        artist: "Artiste Démo 1",
        text: `Je marche seul dans la ville endormie
Les lumières s'éteignent une à une
Et je pense à toi sous la lune
Les souvenirs remontent dans la nuit
Chaque rue me rappelle ton absence
Je cherche encore un peu de sens`,
    },
    {
        title: "Sans retour",
        artist: "Artiste Démo 2",
        text: `On avait juré de ne jamais se quitter
Les promesses se sont envolées avec l'été
Je garde ta photo au fond de ma poche
Le temps passe mais rien ne se rapproche
Un jour peut-être on se reverra
Mais ce jour-là je ne t'attendrai pas`,
    },
    {
        title: "Lumière du matin",
        artist: "Artiste Démo 3",
        text: `Le soleil se lève sur les toits de la ville
Une nouvelle journée commence tranquille
Je bois mon café en regardant dehors
Les gens pressés courent après le décor
Moi je prends mon temps je respire encore
La lumière du matin vaut tous les trésors`,
    },
];

async function main() {
    console.log("🌱 Seed de la base de lyrics référencés...");

    for (const ref of references) {
        const normalizedText = normalizeText(ref.text);
        const ngramHashes = getWordNGrams(normalizedText);
        const wordCount = normalizedText.split(" ").filter(Boolean).length;

        await prisma.referenceLyric.create({
            data: {
                title: ref.title,
                artist: ref.artist,
                normalizedText,
                ngramHashes,
                wordCount,
            },
        });
        console.log(`  ✓ "${ref.title}" — ${wordCount} mots, ${ngramHashes.length} n-grammes`);
    }

    const total = await prisma.referenceLyric.count();
    console.log(`✅ Terminé. ${total} références en base.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());