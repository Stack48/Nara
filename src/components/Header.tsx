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
	<header className=" text-white flex justify-between items-center px-8 py-4 fixed top-0 w-full z-50">
		<Link
			href="/"
			className={`${syne.className} text-white`}
			aria-label="Accueil Nara"
		>
			NARA
		</Link>

		<nav
			className="flex gap-4 text-white"
			aria-label="Navigation principale"
		>
			<Link href="#fonctionnalites">Fonctionnalités</Link>
			<Link href="#tarifs">Tarifs</Link>
			<Link href="#apropos">À propos</Link>
		</nav>

		<div className="flex gap-4 items-center">
			<Link href="/login" className="text-white">
				Se connecter
			</Link>
			<Link
				href="/users"
				className="text-black border border-white px-4 py-2 rounded-full bg-white"
			>
				Commencer
			</Link>
		</div>
	</header>
);
