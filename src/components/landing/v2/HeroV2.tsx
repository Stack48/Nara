"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { SignupForm } from "./SignupForm";
import { LibraryCard } from "./LibraryCard";
import "./hero-v2.css";

/**
 * Landing v2 — écran d'accueil complet (nav + hero + inscription + bibliothèque).
 * Autonome : n'utilise pas <Header /> pour ne pas entrer en conflit avec la v1.
 */
export const HeroV2 = () => {
	const [isDark, setIsDark] = useState(true);

	// Se cale sur le mécanisme existant du projet : .dark sur <html>
	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	const toggleTheme = () => {
		const next = !isDark;
		document.documentElement.classList.toggle("dark", next);
		setIsDark(next);
	};

	return (
		<div className="nara-v2">
			<div className="nara-v2__bg" aria-hidden>
				<div className="nara-v2__ember nara-v2__ember--cool" />
				<div className="nara-v2__ember" />
				<div className="nara-v2__ember nara-v2__ember--core" />
			</div>

			<div className="nara-v2__content">
				<nav className="nara-v2__nav">
					<Link href="/" className="nara-v2__brand">
						NARA
					</Link>
					<div className="nara-v2__links">
						<Link href="#fonctionnalites">Fonctionnalités</Link>
					</div>
					<div className="nara-v2__navright">
						<button
							type="button"
							className="nara-v2__tbtn"
							onClick={toggleTheme}
							aria-label="Changer de thème"
						>
							{isDark ? <Moon size={18} /> : <Sun size={18} />}
						</button>
						<Link href="/login" className="nara-v2__ghost">
							Se connecter
						</Link>
						<Link href="/signup">
							<button type="button" className="nara-v2__solid">
								Essayer
							</button>
						</Link>
					</div>
				</nav>

				<main className="nara-v2__hero">
					<div>
						<span className="nara-v2__eyebrow">
							<i />
							Le hub des producteurs
						</span>
						<h1 className="nara-v2__h1">Le futur de la production musicale.</h1>
						<p className="nara-v2__sub">
							Écriture, masters et gestion de projet — au même endroit.
						</p>
						<SignupForm />
					</div>

					<LibraryCard />
				</main>
			</div>
		</div>
	);
};