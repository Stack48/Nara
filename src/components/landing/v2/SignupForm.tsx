"use client";

import Link from "next/link";
import { useState } from "react";

/** Icônes génériques (pas les logos officiels de marque) */
const GoogleMark = () => (
	<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
		<path d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z" />
		<path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
		<path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" />
		<path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4 5.6-4z" />
	</svg>
);

const AppleMark = () => (
	<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
		<path d="M16.2 12.9c0 2.9 2.5 3.9 2.5 3.9s-1.7 3.1-3.6 3.1c-1 0-1.7-.6-2.9-.6s-1.9.6-2.8.6C7.4 20 5 16.6 5 13.4 5 10.1 7.1 9 8.9 9c1 0 1.9.7 2.5.7.6 0 1.8-.8 3.1-.7.8 0 2.1.3 3 1.5-2.6 1.5-2.3 1.4-1.3 3.4zM14.6 6.4c.6-.7.9-1.7.8-2.6-.8.1-1.8.6-2.4 1.3-.5.6-1 1.6-.9 2.5.9.1 1.9-.5 2.5-1.2z" />
	</svg>
);

export const SignupForm = () => {
	const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: brancher sur /api/auth (Cognito) — cf. src/app/api/auth
		console.log("signup", form);
	};

	return (
		<form className="nara-v2__form" onSubmit={handleSubmit}>
			<div className="nara-v2__soc">
				<button type="button">
					<GoogleMark />
					Continuer avec Google
				</button>
				<button type="button">
					<AppleMark />
					Continuer avec Apple
				</button>
			</div>

			<div className="nara-v2__divider">ou</div>

			<div className="nara-v2__frow">
				<div className="nara-v2__field">
					<input
						name="firstName"
						placeholder="Prénom"
						autoComplete="given-name"
						value={form.firstName}
						onChange={(e) => setForm({ ...form, firstName: e.target.value })}
					/>
				</div>
				<div className="nara-v2__field">
					<input
						name="lastName"
						placeholder="Nom"
						autoComplete="family-name"
						value={form.lastName}
						onChange={(e) => setForm({ ...form, lastName: e.target.value })}
					/>
				</div>
			</div>

			<div className="nara-v2__field">
				<input
					type="email"
					name="email"
					placeholder="Adresse email"
					autoComplete="email"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
			</div>

			<button className="nara-v2__submit" type="submit">
				Créer mon compte
			</button>

			<p className="nara-v2__formnote">
				Déjà un compte ? <Link href="/login">Se connecter</Link>
			</p>
		</form>
	);
};