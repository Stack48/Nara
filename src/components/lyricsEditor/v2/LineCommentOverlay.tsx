"use client";

import { useState, type ChangeEvent, type KeyboardEvent, type ReactElement } from "react";
import { SendHorizontal } from "lucide-react";

export type LineComment = {
	id: string;
	author: string;
	initial: string;
	body: string;
	time: string;
};

export type LineCommentOverlayProps = {
	comments: LineComment[];
	lineNumber: number;
	onAddComment: (body: string) => void;
	onClose: () => void;
};

export default function LineCommentOverlay({
	comments,
	lineNumber,
	onAddComment,
	onClose,
}: LineCommentOverlayProps): ReactElement {
	const [draft, setDraft] = useState<string>("");

	function handleSubmit(): void {
		const body = draft.trim();

		if (body.length === 0) {
			return;
		}

		onAddComment(body);
		setDraft("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSubmit();
			return;
		}

		if (event.key === "Escape") {
			onClose();
		}
	}

	return (
		<>
			<div
				aria-hidden="true"
				className="fixed inset-0 z-40"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-label={`Commentaires sur la ligne ${lineNumber}`}
				className="absolute right-0 top-7 z-50 w-[494px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[var(--nara-comment-border)] bg-[var(--nara-comment-bg)] px-4 py-4 shadow-[var(--nara-comment-shadow)]"
			>
				<div className="space-y-3">
					{comments.length > 0 ? (
						comments.map(
							(comment: LineComment): ReactElement => (
								<div
									key={comment.id}
									className="min-h-[76px] rounded-[8px] border border-[var(--nara-comment-card-border)] bg-[var(--nara-comment-card-bg)] px-3 py-2.5"
								>
									<div className="flex items-start gap-2.5">
										<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--nara-comment-avatar-border)] bg-transparent text-[11px] font-medium text-[var(--nara-comment-text)]">
											{comment.initial}
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-3">
												<span className="text-[14px] font-semibold leading-6 text-[var(--nara-comment-text)]">
													{comment.author}
												</span>
												<span className="text-[11px] font-medium text-[var(--nara-comment-muted)]">
													{comment.time}
												</span>
											</div>
											<p className="mt-2 max-w-[270px] text-[10px] leading-[1.35] text-[var(--nara-comment-body)]">
												{comment.body}
											</p>
										</div>
									</div>
								</div>
							),
						)
					) : (
						<div className="rounded-[8px] border border-[var(--nara-comment-card-border)] bg-[var(--nara-comment-card-bg)] px-3 py-3 text-[12px] text-[var(--nara-comment-muted)]">
							Aucun commentaire sur cette ligne.
						</div>
					)}
				</div>

				<label className="mt-16 flex h-[34px] items-center gap-3 rounded-[7px] border border-[var(--nara-comment-border)] bg-[var(--nara-comment-input-bg)] px-2.5 transition-colors focus-within:border-[var(--nara-border-strong)]">
					<span className="sr-only">Ecrire un message</span>
					<input
						autoFocus
						value={draft}
						placeholder="Ecrire un message"
						onChange={(
							event: ChangeEvent<HTMLInputElement>,
						): void => setDraft(event.target.value)}
						onKeyDown={handleKeyDown}
						className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--nara-comment-text)] outline-none placeholder:text-[var(--nara-comment-muted)]"
					/>
					<button
						type="button"
						aria-label="Envoyer"
						onClick={handleSubmit}
						disabled={draft.trim().length === 0}
						className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[var(--nara-comment-muted)] transition-colors hover:bg-[var(--nara-action-hover)] hover:text-[var(--nara-comment-text)] disabled:pointer-events-none disabled:opacity-45"
					>
						<SendHorizontal size={20} strokeWidth={1.5} />
					</button>
				</label>
			</div>
		</>
	);
}
