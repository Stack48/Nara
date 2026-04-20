import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbStatus: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const userCount = dbStatus === "ok" ? await prisma.user.count() : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nara</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Boilerplate Next.js, Prisma, PostgreSQL et Docker (pgAdmin inclus).
      </p>
      <dl className="grid gap-2 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Base de données</dt>
          <dd className="font-medium">
            {dbStatus === "ok" ? "Connectée" : "Non disponible"}
          </dd>
        </div>
        {userCount !== null && (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Utilisateurs (exemple)</dt>
            <dd className="font-medium">{userCount}</dd>
          </div>
        )}
      </dl>
      <p>
        <Link
          href="/users"
          className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          CRUD utilisateurs (exemple)
        </Link>
      </p>
    </main>
  );
}
