import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { projectId, content, name } = body;

		if (!projectId) {
			// For this demo, if no projectId is provided, we can either create one or mock success.
			// Let's create a draft project on the fly if needed, or just pretend it saved.
			return NextResponse.json({
				success: true,
				message: "Mocked save: No projectId provided.",
			});
		}

		// Check if the project exists
		let project = await prisma.project.findUnique({ where: { id: projectId } });

		if (!project) {
			// For the demo, create a dummy user and the project
			const user = await prisma.user.upsert({
				where: { email: "demo@nara.com" },
				update: {},
				create: {
					email: "demo@nara.com",
					cognitoId: "demo-cognito-id",
					name: "Demo User",
				}
			});

			project = await prisma.project.create({
				data: {
					id: projectId,
					name: "Demo Project",
					ownerId: user.id,
					content: JSON.stringify(content),
				}
			});
		} else {
			// Update the project's content directly
			await prisma.project.update({
				where: { id: projectId },
				data: { content: JSON.stringify(content) },
			});
		}

		// If a specific version name is provided, create a checkpoint
		if (name) {
			await prisma.projectVersion.create({
				data: {
					name,
					content: JSON.stringify(content),
					projectId,
				},
			});
		}

		return NextResponse.json({
			success: true,
			message: "Projet sauvegardé.",
		});
	} catch (err) {
		console.error("[/api/projects/save]", err);
		return NextResponse.json(
			{ error: "Erreur serveur lors de la sauvegarde" },
			{ status: 500 },
		);
	}
}
