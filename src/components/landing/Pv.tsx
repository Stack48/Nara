import pv1 from "../../assets/landing/pv1.png";
import pv2 from "../../assets/landing/pv2.png";
import pv3 from "../../assets/landing/pv3.png";

export const Pv = () => {
	const cards = [
		{
			title: "DISPERSION",
			description:
				"Versions, brouillons, prises vocales... tout finit éparpillé. Nara centralise tout au même endroit.",
			img: pv1.src,
		},
		{
			title: "FRICTION",
			description:
				"Voir qui travaille sur quoi, en temps réel, sans se marcher dessus. Juste toi, tes collabs et la musique.",
			img: pv2.src,
		},
		{
			title: "DÉSORGANISATION",
			description:
				"Sans structure claire, chaque session repart de zéro. Nara organise tes lyrics et tes exports en un seul endroit.",
			img: pv3.src,
		},
	];

	return (
		<section className="py-24 md:py-32 bg-transparent font-arimo relative z-10">
			<div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
				{/* En-tête */}
				<div className="text-center mb-24">
					<div className="mb-6 flex justify-center">
						<span className="nara-badge">Pourquoi Nara</span>
					</div>
					<h2 className="nara-title-2 mb-6 mx-auto text-center">
						Ton prochain hit mérite mieux qu'un brouillon perdu.
					</h2>
					<p className="nara-subtitle text-gray-300 max-w-2xl mx-auto">
						Nara réunit tout ce dont tu as besoin pour créer, sans
						te noyer dans la gestion.
					</p>
				</div>

				{/* Grille des 3 images (SaaS Cards) */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{cards.map((card, index) => (
						<div
							key={index}
							className="flex flex-col bg-white/[0.03] border border-white/10 rounded-[2rem] p-4 pb-8 hover:-translate-y-2 hover:border-white/20 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group"
						>
							{/* Image avec coins arrondis */}
							<div className="aspect-[4/4] overflow-hidden rounded-[1.5rem] mb-8 bg-[#0a0a0a] relative">
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<img
									src={card.img}
									alt={card.title}
									className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
								/>
							</div>

							{/* Texte sous l'image */}
							<div className="px-4 text-center">
								<h3 className="nara-title-4 text-white uppercase mb-4">
									{card.title}
								</h3>
								<p className="nara-subtitle text-gray-400">
									{card.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
