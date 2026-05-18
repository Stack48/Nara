"use client";
import Link from "next/link";
import { Syne } from "next/font/google";

// import "./header.css";

const syne = Syne({
	subsets: ["latin"],
	weight: ["800"],
	display: "swap",
});

export const Header = () => (
	// tailwind header position fixed top
	<header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-4 text-white sm:px-6 lg:px-8">
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
				<Link
					href="/"
					className={`${syne.className} shrink-0 text-[clamp(17px,4.8vw,24px)] leading-none bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent`}
					aria-label="Accueil Nara"
				>
					NARA
				</Link>

				{/* Nav desktop */}
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

					{/* Burger mobile */}
					<button
						className="flex flex-col gap-[5px] md:hidden"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label="Menu"
					>
						<span
							className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
						/>
						<span
							className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
						/>
						<span
							className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
						/>
					</button>
				</div>
			</div>

			{/* Menu mobile déroulant */}
			<div
				className={`absolute left-0 right-0 top-full h-[calc(100dvh-70px)] flex flex-col gap-0 bg-[#050505]/95 backdrop-blur-xl md:hidden transition-all duration-300 ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
			>
				<Link
					href="#fonctionnalites"
					onClick={() => setMenuOpen(false)}
					className="border-b border-white/10 px-6 py-5 text-white font-arimo hover:bg-white/5 transition-colors"
				>
					Fonctionnalités
				</Link>
				<Link
					href="#tarifs"
					onClick={() => setMenuOpen(false)}
					className="border-b border-white/10 px-6 py-5 text-white font-arimo hover:bg-white/5 transition-colors"
				>
					Tarifs
				</Link>
				<Link
					href="#apropos"
					onClick={() => setMenuOpen(false)}
					className="border-b border-white/10 px-6 py-5 text-white font-arimo hover:bg-white/5 transition-colors"
				>
					À propos
				</Link>
				<div className="flex flex-col gap-4 px-6 py-6">
					<Link
						href="/login"
						onClick={() => setMenuOpen(false)}
						className="text-white font-arimo py-2"
					>
						Se connecter
					</Link>
					<Link
						href="/users"
						onClick={() => setMenuOpen(false)}
						className="inline-flex justify-center w-full rounded-full border border-white bg-white px-4 py-3 text-base font-bold leading-none text-black hover:bg-gray-200 transition-colors"
					>
						Commencer
					</Link>
				</div>
			</div>
		</header>
	);
};
