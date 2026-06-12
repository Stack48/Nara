// Test local du crawl, sans passer par les routes :
//   npm run crawl:dictionary            → crawl réel (limité à 5 seeds)
//   npm run crawl:dictionary -- --dry   → dry-run, rien n'est inséré
import { runDictionaryCrawlJob } from "@/server/crawl/crawl.job";

const dryRun = process.argv.includes("--dry");

runDictionaryCrawlJob({ dryRun, maxSeeds: 5 })
  .then((result) => {
    console.log("Crawl terminé :", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Crawl échoué :", error);
    process.exit(1);
  });
