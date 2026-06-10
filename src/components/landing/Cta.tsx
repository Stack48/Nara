import Link from "next/link";

export const Cta = () => (
	<section className="py-24 bg-transparent font-arimo text-white">
		<div className="container mx-auto px-6 flex flex-col items-center text-center">
			<h2 className="font-syne text-3xl md:text-5xl font-extrabold leading-tight mb-6 tracking-tighter text-balance">
				Ton studio. Partout. Tout le temps.
			</h2>

			<p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
				Rejoins des milliers d'artistes qui ont décidé de créer sans
				friction.
			</p>

			{/* link */}
			<Link
				href="/pricing" //
				className="inline-block px-12 py-5 text-lg rounded-full font-bold text-white tracking-wide transition-transform hover:scale-110 bg-gradient-to-r from-[#AA0063] from-[7%] to-[#CD2A9B] to-[86%] shadow-lg mb-4"
			>
				Rejoindre NARA gratuitement
			</Link>

			<p className="text-gray-500 text-sm">
				Abonnement annulable à tout moment
			</p>
		</div>
	</section>
);
