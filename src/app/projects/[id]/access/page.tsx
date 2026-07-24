"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useParams } from "next/navigation";
import MembersAccessScreen from "@/components/permissions/MembersAccessScreen";
import { resolveCognitoId } from "@/hooks/useProjectMembers";
import { Layout } from "@/components/nav/Layout";

/**
 * Route /projects/:id/access — page de gestion des membres.
 * Charge le projet pour connaître l'Artiste propriétaire (ownerId),
 * puis délègue tout à MembersAccessScreen.
 *
 * C'est aussi la cible naturelle du lien « Gérer les accès » du
 * CollaboratorsCard dans ManagementScreen.
 */

export default function ProjectAccessPage(): ReactElement {
	const params = useParams<{ id: string }>();
	const projectId: string = params.id;
	const [ownerId, setOwnerId] = useState<string | null>(null);

	useEffect((): void => {
		const cognitoId: string | null = resolveCognitoId();
		if (!cognitoId) {
			return;
		}

		void fetch(`/api/projects/${projectId}`, {
			headers: { "x-cognito-id": cognitoId },
		})
			.then((response: Response) =>
				response.ok ? response.json() : null,
			)
			.then((project: { ownerId?: string } | null): void => {
				setOwnerId(project?.ownerId ?? null);
			})
			.catch((): void => setOwnerId(null));
	}, [projectId]);

	return (
		<Layout>
			<MembersAccessScreen projectId={projectId} ownerId={ownerId} />
		</Layout>
	);
}