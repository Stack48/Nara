import { Tac_One } from "next/font/google";
import Image from "next/image"; // Optimisation Next.js
import photo1 from "../../assets/landing/avis1.png";
import photo2 from "../../assets/landing/avis2.png";
import photo3 from "../../assets/landing/avis3.png";

const tacOne = Tac_One({
	weight: "400",
	subsets: ["latin"],
	display: "swap",
});

export const Avis = () => {
	const reviews = [
		{
			text: "NARA m'a fait gagner un temps fou. Fini les sessions de recherche avant chaque studio.",
			name: "Anya",
			role: "Auteure-Compositrice",
			img: photo1,
		},
		{
			text: "Je gère mes projets avec mes beatmakers sans friction. Tout le monde voit la même version en temps réel.",
			name: "Zakaria",
			role: "Producteur indé",
			img: photo2,
		},
		{
			text: "Avant je perdais des idées tous les jours. Maintenant elles sont toutes là, classées, prêtes.",
			name: "Paul",
			role: "Artiste indé",
			img: photo3,
		},
	];

	return (
		<section className="py-24 md:py-32 bg-transparent font-arimo text-white relative z-10">
			<div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center mb-16">
					<div className="mb-6">
						<span className="nara-badge">Témoignages</span>
					</div>
					<h2 className="nara-title-2 text-center">
						Ils créent avec Nara.
					</h2>
				</div>

				{/* avis */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{reviews.map((review, index) => (
						<div
							key={index}
							className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10 flex flex-col relative overflow-hidden group hover:border-[#D90097]/30 transition-all duration-500 hover:bg-white/[0.04]"
						>
							{/* guillemets (plus subtils) */}
							<span
								className={`${tacOne.className} text-[#D90097]/15 text-[120px] leading-[0.6] block -mb-6 transition-colors duration-500 group-hover:text-[#D90097]/30`}
								aria-hidden="true"
							>
								“
							</span>

							{/* txt */}
							<p className="nara-subtitle text-gray-300 italic mb-10 flex-1 relative z-10">
								{review.text}
							</p>

							{/* profil */}
							<div className="flex items-center gap-5 pt-6 border-t border-white/10">
								{/* img */}
								<div className="w-12 h-12 overflow-hidden rounded-full bg-neutral-800 flex-shrink-0 relative border border-white/20">
									<Image
										src={review.img}
										alt={`Photo de ${review.name}`}
										fill
										className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
										sizes="48px"
									/>
								</div>

								{/* name + role */}
								<div className="flex flex-col">
									<span className="nara-body font-bold text-white">
										{review.name}
									</span>
									<span className="nara-body text-gray-400 opacity-70 mt-1">
										{review.role}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
