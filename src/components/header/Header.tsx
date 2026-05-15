import Link from "next/link";
import { Syne } from "next/font/google";
// import "./header.css";

const syne = Syne({
	subsets: ["latin"],
	weight: ["800"],
	display: "swap",
});

export const Header = () => (
	<header className="site-header">
		<Link
			href="/"
			className={`${syne.className} site-header__logo`}
			aria-label="Accueil Nara"
		>
			NARA
		</Link>

		<nav className="site-header__nav" aria-label="Navigation principale">
			<Link href="#fonctionnalites">Fonctionnalités</Link>
			<Link href="#tarifs">Tarifs</Link>
			<Link href="#apropos">À propos</Link>
		</nav>

		<div className="site-header__actions">
			<Link href="/login" className="site-header__login">
				Se connecter
			</Link>
			<Link href="/users" className="site-header__cta">
				Commencer
			</Link>
		</div>
	</header>
);
