"use client";

import { ScanSearch } from "lucide-react";
import type {
	AnalysisJobResult,
	ReferenceMatch,
	SimilarPassage,
} from "@/hooks/useSimilarityAnalysis";

type SimilarityPanelProps = {
	errorMessage: string | null;
	isAnalyzing: boolean;
	job: AnalysisJobResult | null;
	onIgnorePassage: (referenceId: string, passage: SimilarPassage) => void;
	onStartAnalysis: () => void;
};

function getScoreColor(score: number): string {
	if (score < 15) return "text-emerald-400";
	if (score < 40) return "text-amber-400";
	return "text-red-400";
}

function getScoreLabel(score: number): string {
	if (score < 15) return "Peu de similarités détectées";
	if (score < 40) return "Similarités à vérifier";
	return "Fortes similarités détectées";
}

export function SimilarityPanel({
	errorMessage,
	isAnalyzing,
	job,
	onIgnorePassage,
	onStartAnalysis,
}: SimilarityPanelProps) {
	const isCompleted = job?.status === "COMPLETED";
	const matches: ReferenceMatch[] = isCompleted ? (job?.matches ?? []) : [];

	return (
		<section
			aria-label="Analyse de similarité"
			className="min-w-0 bg-[var(--nara-surface-soft)] border border-[var(--nara-border)] rounded-xl px-3 py-2 select-none transition-all duration-300 flex flex-col gap-2 mx-2.5 my-1"
		>
			{/* En-tête + bouton */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<ScanSearch
						size={14}
						strokeWidth={2}
						className="text-[var(--nara-text-primary)]/60"
					/>
					<h3 className="text-[11px] font-bold tracking-wide uppercase text-[var(--nara-text-primary)]/40">
						Similarités
					</h3>
				</div>
				<button
					type="button"
					onMouseDown={(event): void => event.preventDefault()}
					onClick={onStartAnalysis}
					disabled={isAnalyzing}
					className="h-[22px] rounded-full bg-[#b4783c]/30 border border-[#b4783c]/30 px-3 text-[10px] font-semibold text-[#b4783c] hover:bg-[#b4783c]/20 hover:border-[#b4783c]/50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
				>
					{isAnalyzing ? "Analyse..." : "Analyser"}
				</button>
			</div>

			{/* Erreur */}
			{errorMessage && (
				<p className="text-[10px] text-red-400/90 font-medium px-0.5">
					{errorMessage}
				</p>
			)}

			{/* En cours */}
			{isAnalyzing && (
				<div className="flex flex-col items-center gap-2 py-4">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--nara-border)] border-t-[#b4783c]" />
					<p className="text-[11px] text-[var(--nara-text-primary)]/40">
						Comparaison avec la base de référence...
					</p>
				</div>
			)}

			{/* Résultat : score global */}
			{isCompleted && job !== null && job.score !== null && (
				<div className="rounded-[6px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] p-3 text-center">
					<p className={`text-2xl font-bold ${getScoreColor(job.score)}`}>
						{job.score}%
					</p>
					<p className="mt-0.5 text-[11px] text-[var(--nara-text-primary)]/50">
						{getScoreLabel(job.score)}
					</p>
				</div>
			)}

			{/* Résultat : aucun match */}
			{isCompleted && matches.length === 0 && (
				<p className="py-2 text-center text-[11px] text-[var(--nara-text-primary)]/40">
					Aucun passage similaire trouvé. Ton texte semble original 🎉
				</p>
			)}

			{/* Résultat : liste des références matchées */}
			{matches.map((match: ReferenceMatch) => (
				<div
					className="rounded-[6px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] p-2.5"
					key={match.referenceId}
				>
					<p className="text-[12px] font-semibold text-[var(--nara-text-primary)]">
						{match.title}
					</p>
					{match.artist && (
						<p className="text-[10px] text-[var(--nara-text-primary)]/40">
							{match.artist}
						</p>
					)}

					<ul className="mt-2 flex flex-col gap-1.5">
						{match.passages
							.filter((passage: SimilarPassage) => !passage.ignored)
							.map((passage: SimilarPassage) => (
							<li
								className="rounded-[6px] border border-[var(--nara-border)] bg-[var(--nara-surface-soft)] p-2"
								key={`${match.referenceId}-${passage.inputWordStart}-${passage.inputWordEnd}`}
							>
								<p className="text-[11px] italic text-[var(--nara-text-primary)]/80">
									« {passage.inputExcerpt} »
								</p>
								<p className="mt-1 text-[10px] text-[var(--nara-text-primary)]/40">
									≈ « {passage.referenceExcerpt} »
								</p>
								<div className="mt-1.5 flex items-center justify-between">
									<span
										className={`text-[10px] font-semibold ${getScoreColor(passage.similarity)}`}
									>
										{passage.similarity}% similaire
									</span>
									<button
										type="button"
										onMouseDown={(event): void =>
											event.preventDefault()
										}
										onClick={() =>
											onIgnorePassage(match.referenceId, passage)
										}
										className="text-[10px] font-bold text-[#b4783c] hover:text-[#d28c46] transition-colors"
									>
										Ignorer
									</button>
								</div>
							</li>
						))}
					</ul>
				</div>
			))}

			{/* État initial */}
			{!isAnalyzing && !job && !errorMessage && (
				<p className="py-2 text-center text-[11px] text-[var(--nara-text-primary)]/40">
					Lance une analyse pour comparer ce texte à la base de lyrics
					référencés.
				</p>
			)}
		</section>
	);
}