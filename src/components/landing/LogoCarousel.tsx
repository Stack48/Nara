import Image from "next/image";

// Ajoute ou remplace les images ici avec tes fichiers dans public, ex: /logos/spotify.png.
const logoItems = [
	{ src: "/artist-1.png", alt: "Logo partenaire 1" },
	{ src: "/artist-2.png", alt: "Logo partenaire 2" },
	{ src: "/artist-3.png", alt: "Logo partenaire 3" },
	{ src: "/artist-4.png", alt: "Logo partenaire 4" },
	{ src: "/app-preview.png", alt: "Logo partenaire 5" },
];

const carouselItems = [...logoItems, ...logoItems, ...logoItems];

export const LogoCarousel = () => (
	<section className="relative -mt-px overflow-hidden bg-[linear-gradient(180deg,#050506_0%,#080508_42%,#050506_100%)] px-0 pb-10 pt-8 text-[#f7f2f6] sm:pb-12 sm:pt-10 lg:pb-14 lg:pt-12">
		<style>
			{`
				@keyframes logoCarousel {
					from { transform: translate3d(0, 0, 0); }
					to { transform: translate3d(-33.333%, 0, 0); }
				}

				@media (prefers-reduced-motion: reduce) {
					.logo-carousel-track { animation: none !important; }
				}
			`}
		</style>

		<div className="pointer-events-none absolute inset-x-0 -top-24 h-28 bg-gradient-to-b from-transparent to-[#050506]" />
		<div className="mx-auto max-w-[1180px]">
			<p className="nara-body mb-6 px-4 text-center text-[#d4c9d1] sm:mb-8 sm:px-6">
				Trusted by leading companies worldwide
			</p>

			<div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)]">
				<div className="logo-carousel-track flex w-max items-center opacity-70 grayscale [animation:logoCarousel_28s_linear_infinite] hover:[animation-play-state:paused]">
					{carouselItems.map((logo, index) => (
						<div
							key={`${logo.src}-${index}`}
							className="flex h-10 w-[clamp(152px,48vw,184px)] shrink-0 items-center justify-center px-5 sm:h-12 sm:w-[216px] sm:px-7 md:w-[256px] md:px-10"
						>
							<Image
								src={logo.src}
								alt={logo.alt}
								width={160}
								height={48}
								className="h-auto max-h-8 w-auto max-w-[clamp(104px,30vw,136px)] object-contain opacity-85 sm:max-h-10 sm:max-w-36"
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	</section>
);
