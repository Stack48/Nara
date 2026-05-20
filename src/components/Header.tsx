"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import { useState, useEffect } from "react";

// import "./header.css";

const syne = Syne({
	subsets: ["latin"],
	weight: ["800"],
	display: "swap",
});

export const Header = () => {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
	// tailwind header position fixed top
	<header className={`fixed inset-x-0 top-0 z-50 flex justify-center w-full transition-all duration-300 ${isScrolled ? "bg-[#050505]/80 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "bg-transparent"}`}>
		<div className={`flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 text-white sm:px-6 lg:px-8 transition-all duration-300 ${isScrolled ? "py-4" : "py-5 md:py-6"}`}>
		<Link
			href="/"
			className={`${syne.className} shrink-0 text-[clamp(17px,4.8vw,24px)] leading-none text-white`}
			aria-label="Accueil Nara"
		>
			NARA
		</Link>

		<nav
			className="hidden gap-4 text-white md:flex"
			aria-label="Navigation principale"
		>
			<Link href="#fonctionnalites">Fonctionnalités</Link>
			<Link href="#tarifs">Tarifs</Link>
			<Link href="#apropos">À propos</Link>
		</nav>

		<div className="flex shrink-0 items-center gap-3 sm:gap-4">
			<Link href="/login" className="hidden text-white sm:inline">
				Se connecter
			</Link>
			<Link
				href="/users"
				className="hidden rounded-full border border-white bg-white px-4 py-2 text-base leading-none text-black sm:inline-flex"
			>
				Commencer
			</Link>
		</div>
		</div>
	</header>
	);
};
