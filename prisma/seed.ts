import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding...");

    // Crée des users
    const lea = await prisma.user.upsert({
        where: { email: "lea@nara.com" },
        update: {},
        create: {
            cognitoId: "cognito-lea-001",
            email: "lea@nara.com",
            name: "Léa",
            username: "lea_nara",
        },
    });

    const marcus = await prisma.user.upsert({
        where: { email: "marcus@nara.com" },
        update: {},
        create: {
            cognitoId: "cognito-marcus-001",
            email: "marcus@nara.com",
            name: "Marcus",
            username: "marcus_nara",
        },
    });

    const romain = await prisma.user.upsert({
        where: { email: "romain@nara.com" },
        update: {},
        create: {
            cognitoId: "cognito-romain-001",
            email: "romain@nara.com",
            name: "Romain",
            username: "romain_nara",
        },
    });

    // Crée un projet
    const project = await prisma.project.upsert({
        where: { id: "project-nuit-calme" },
        update: {},
        create: {
            id: "project-nuit-calme",
            name: "Nuit Calme",
            description: "Album de Léa",
            genre: "R&B",
            status: "IN_PROGRESS",
            ownerId: lea.id,
        },
    });

    // Ajoute les membres avec leurs rôles
    await prisma.projectMember.upsert({
        where: { userId_projectId: { userId: lea.id, projectId: project.id } },
        update: {},
        create: { userId: lea.id, projectId: project.id, role: "ADMIN" },
    });

    await prisma.projectMember.upsert({
        where: { userId_projectId: { userId: marcus.id, projectId: project.id } },
        update: {},
        create: { userId: marcus.id, projectId: project.id, role: "LEAD_LYRICIST" },
    });

    await prisma.projectMember.upsert({
        where: { userId_projectId: { userId: romain.id, projectId: project.id } },
        update: {},
        create: { userId: romain.id, projectId: project.id, role: "READONLY" },
    });

    console.log("✅ Seed terminé !");
    console.log(`👤 Léa (ADMIN) → cognitoId: cognito-lea-001`);
    console.log(`👤 Marcus (LEAD_PAROLIER) → cognitoId: cognito-marcus-001`);
    console.log(`👤 Romain (LECTURE_SEULE) → cognitoId: cognito-romain-001`);
    console.log(`🎵 Projet: ${project.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());