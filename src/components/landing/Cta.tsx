import Link from "next/link";

export const Cta = () => (
	<section className="py-24 md:py-32 w-full px-4 sm:px-6 lg:px-8 font-arimo relative z-10">
		<div className="relative mx-auto max-w-[1000px] rounded-3xl md:rounded-[3rem] bg-white/[0.02] border border-white/10 p-8 sm:p-12 md:p-20 overflow-hidden shadow-2xl flex flex-col items-center text-center">
			{/* Glow effect behind */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[600px] h-[300px] bg-[#D90097]/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

			<div className="relative z-10 w-full flex flex-col items-center">
				<h2 className="nara-title-2 mb-6">
					Ton studio. Partout. Tout le temps.
				</h2>

				<p className="nara-subtitle text-gray-300 max-w-2xl mx-auto mb-10 md:mb-12">
					Rejoins des milliers d'artistes qui ont décidé de créer sans
					friction.
				</p>

				{/* link */}
				<Link
					href="/pricing" //
					className="inline-block px-8 py-4 md:px-12 md:py-5 text-base md:text-lg rounded-full font-bold text-white tracking-wide transition-all duration-300 hover:-translate-y-1 bg-[#D90097] hover:bg-[#e60091] shadow-[0_10px_30px_rgba(217,0,151,0.4)] hover:shadow-[0_20px_40px_rgba(217,0,151,0.6)] mb-6 border border-white/20"
				>
					Rejoindre NARA gratuitement
				</Link>

				<p className="nara-body text-gray-500">
					Abonnement annulable à tout moment
				</p>
			</div>
		</div>
	</section>
);
