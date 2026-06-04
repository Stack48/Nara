import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { word, description, synonyms, antonyms } = body;

		if (!word || !description) {
			return NextResponse.json(
				{ error: "Le mot et la description sont requis" },
				{ status: 400 },
			);
		}

		const suggestion = await prisma.wordSuggestion.upsert({
			where: { word },
			update: {
				description,
				synonyms,
				antonyms,
			},
			create: {
				word,
				description,
				synonyms,
				antonyms,
			},
		});

		console.log("[/api/linguistic/add] Suggestion d'ajout de mot enregistrée :", suggestion);

		return NextResponse.json({
			success: true,
			message: `Le mot "${word}" a été ajouté avec succès.`,
			data: suggestion,
		});
	} catch (err) {
		console.error("[/api/linguistic/add]", err);
		return NextResponse.json(
			{ error: "Erreur serveur lors de l'ajout du mot" },
			{ status: 500 },
		);
	}
}
