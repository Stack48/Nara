import { compareTexts } from "./similarity";

const source = "je marche seul dans la nuit froide et je pense a toi";
const reference = "je marche seul dans la nuit froide sous les etoiles";

console.log(JSON.stringify(compareTexts(source, reference), null, 2));