"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
	ReferenceMatch,
	SimilarPassage,
} from "@/server/similarity/similarity.service";
import { getAuthHeaders } from "@/lib/authHeaders";

// Ré-export : le panneau et le surlignage importeront les types depuis ce hook
export type { ReferenceMatch, SimilarPassage };

export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type AnalysisJobResult = {
	id: string;
	status: AnalysisStatus;
	score: number | null;
	matches: ReferenceMatch[] | null;
	error: string | null;
};

type UseSimilarityAnalysisOptions = {
	lyricsId: string;
	projectId: string;
};

async function getCognitoHeaders(): Promise<Record<string, string>> {
	try {
		const { getCurrentUser } = await import("aws-amplify/auth");
		const user = await getCurrentUser();
		return { "x-cognito-id": user.userId };
	} catch {
		// Pas de session Amplify (dev sans login) → fallback variable d'env
		return getAuthHeaders();
	}
}

export function useSimilarityAnalysis({
	lyricsId,
	projectId,
}: UseSimilarityAnalysisOptions) {
	const [job, setJob] = useState<AnalysisJobResult | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const pollTimerRef = useRef<number | null>(null);

	const stopPolling = useCallback((): void => {
		if (pollTimerRef.current !== null) {
			window.clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	// Nettoyage si le composant est démonté en pleine analyse
	useEffect(() => stopPolling, [stopPolling]);

	const pollJob = useCallback(
		(jobId: string): void => {
			stopPolling();
			pollTimerRef.current = window.setInterval(async (): Promise<void> => {
				try {
					const response = await fetch(
						`/api/projects/${projectId}/lyrics/${lyricsId}/similarity/${jobId}`,
                        { headers: getAuthHeaders() },
					);

					if (!response.ok) {
						throw new Error("Lecture du résultat impossible");
					}

					const data: AnalysisJobResult = await response.json();
					setJob(data);

					if (data.status === "COMPLETED" || data.status === "FAILED") {
						stopPolling();
						setIsAnalyzing(false);

						if (data.status === "FAILED") {
							setErrorMessage(data.error ?? "L'analyse a échoué");
						}
					}
				} catch {
					stopPolling();
					setIsAnalyzing(false);
					setErrorMessage("Impossible de récupérer le résultat de l'analyse");
				}
			}, 1500);
		},
		[lyricsId, projectId, stopPolling],
	);

	const startAnalysis = useCallback(async (): Promise<void> => {
		setErrorMessage(null);
		setJob(null);
		setIsAnalyzing(true);

		try {
			const response = await fetch(
				`/api/projects/${projectId}/lyrics/${lyricsId}/similarity`,
				{ method: "POST",headers: getAuthHeaders() },
			);

			if (response.status === 409) {
				setErrorMessage("Une analyse est déjà en cours pour ce texte");
				setIsAnalyzing(false);
				return;
			}

			if (!response.ok) {
				throw new Error("Lancement impossible");
			}

			const data: { id: string } = await response.json();
			pollJob(data.id);
		} catch {
			setIsAnalyzing(false);
			setErrorMessage("Impossible de lancer l'analyse");
		}
	}, [lyricsId, projectId, pollJob]);
	const ignorePassage = useCallback(
		async (referenceId: string, passage: SimilarPassage): Promise<void> => {
			if (!job) return;

			try {
				const response = await fetch(
					`/api/projects/${projectId}/lyrics/${lyricsId}/similarity/${job.id}/ignore`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							...(await getCognitoHeaders()),
						},
						body: JSON.stringify({
							referenceId,
							inputWordStart: passage.inputWordStart,
							inputWordEnd: passage.inputWordEnd,
						}),
					},
				);

				if (!response.ok) return;

				const updated: AnalysisJobResult = await response.json();
				setJob(updated);
			} catch {
				// silencieux : l'UI garde l'état actuel si l'appel échoue
			}
		},
		[job, lyricsId, projectId],
	);

		return { errorMessage, ignorePassage, isAnalyzing, job, startAnalysis };

}