import Link from "next/link";
import { Syne } from "next/font/google";

const syne = Syne({
	subsets: ["latin"],
	weight: ["800"],
	display: "swap",
});

export const Footer = () => {
	// centralisation des liens
	const navigationLinks = [
		"Dashboard",
		"Lyrics Editor",
		"Music Manager",
		"Lorem",
	];
	const communityLinks = ["Discord", "Instagram", "X", "Blog"];
	const legalLinks = [
		"Confidentialité",
		"Conditions d'utilisation",
		"Mentions légales",
	];

	return (
		<footer className="pt-24 pb-0 bg-transparent font-arimo text-white relative overflow-hidden flex flex-col">
			<div className="container mx-auto px-6 z-10 relative">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
					{/* bloc gauche : logo */}
					<div className="md:col-span-5 flex flex-col gap-5">
						<span
							className={`${syne.className} text-2xl uppercase bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent w-fit`}
						>
							NARA
						</span>
						<p className="nara-subtitle text-gray-400 max-w-sm">
							Le premier Hub Créatif conçu pour les artistes
							musicaux modernes. Simplifiez votre workflow,
							amplifiez votre son.
						</p>
					</div>

					{/* nav */}
					<div className="md:col-span-2 md:col-start-7 flex flex-col gap-4">
						<h4 className="nara-body font-bold text-white uppercase">
							NAVIGATION
						</h4>
						<ul className="flex flex-col gap-3 nara-body text-gray-400">
							{navigationLinks.map((link) => (
								<li key={link}>
									<Link
										href="#"
										className="hover:text-white transition-colors"
									>
										{link}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* communauté */}
					<div className="md:col-span-2 flex flex-col gap-4">
						<h4 className="nara-body font-bold text-white uppercase">
							COMMUNAUTÉ
						</h4>
						<ul className="flex flex-col gap-3 nara-body text-gray-400">
							{communityLinks.map((link) => (
								<li key={link}>
									<Link
										href="#"
										className="hover:text-white transition-colors"
									>
										{link}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* légal */}
					<div className="md:col-span-2 flex flex-col gap-4">
						<h4 className="nara-body font-bold text-white uppercase">
							LÉGAL
						</h4>
						<ul className="flex flex-col gap-3 nara-body text-gray-400">
							{legalLinks.map((link) => (
								<li key={link}>
									<Link
										href="#"
										className="hover:text-white transition-colors"
									>
										{link}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="border-t border-neutral-800/60 w-full mb-8"></div>

				{/* bottom footer */}
				<div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 mb-12">
					<p>© 2026 Nara Studio. Tous droits réservés.</p>
					<div className="flex gap-6">
						<Link
							href="#"
							className="hover:text-gray-400 transition-colors"
						>
							LinkedIn
						</Link>
						<Link
							href="#"
							className="hover:text-gray-400 transition-colors"
						>
							Youtube
						</Link>
					</div>
				</div>
			</div>

			{/* Giant Faded NARA Text */}
			<div className="w-full flex justify-center overflow-hidden relative pointer-events-none select-none mt-auto">
				<span
					className={`${syne.className} uppercase text-[20vw] leading-[0.75] tracking-tighter text-white opacity-[0.03] sm:opacity-[0.02]`}
				>
					NARA
				</span>
				{/* Overlay to fade the text down into the background */}
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] z-10 h-full w-full" />
			</div>
		</footer>
	);
};
