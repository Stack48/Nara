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
				Commencer
			</Link>
		</div>
	</header>
);
