"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ColorBends from "@/components/landing/ColorBends";

const avatars = ["/artist-1.png", "/artist-2.png", "/artist-3.png", "/artist-4.png"];
const stackImages = [
	"/artist-1.png",
	"/artist-2.png",
	"/artist-3.png",
	"/artist-4.png"
];

export const Hero = () => {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIndex((current) => (current + 1) % stackImages.length);
		}, 3000); // Switch every 3 seconds
		return () => clearInterval(interval);
	}, []);

	return (
		<section className="relative isolate overflow-x-hidden bg-[#050506] pb-24 lg:pb-40 pt-[76px] text-[#f7f2f6] sm:pt-[82px]">
			<div className="pointer-events-none absolute inset-0 z-0 bg-[#050506]" />
			<div className="pointer-events-none absolute inset-0 z-0">
				<ColorBends
					colors={["#AA0063", "#D90097", "#D90097"]}
					rotation={90} speed={0.2} scale={1} frequency={1}
					warpStrength={1} mouseInfluence={1} noise={0.15}
					parallax={0.5} iterations={1} intensity={1.5}
					bandWidth={6} transparent autoRotate={0}
				/>
			</div>

			<div className="relative z-10 mx-auto max-w-[1180px] px-6 lg:px-8 pt-10 xl:pt-20">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">

					{/* LEFT: Text Content */}
					<div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[55%] shrink-0">
						<h1 className="nara-title-1 text-[#fff7fc]">
							Le futur de la<br className="hidden lg:block" /> production
							<br />
							<span className="bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent">musicale.</span>
						</h1>

						<p className="nara-subtitle mt-6 max-w-[500px] text-gray-300">
							Nara centralise votre écriture, vos masters et votre gestion de projet dans un hub immersif conçu pour l&apos;excellence créative.
						</p>

						<Link
							href="/users"
							className="mt-8 inline-flex h-[52px] w-[260px] items-center justify-center rounded-full bg-[#d9008d] px-8 text-[15px] font-bold text-white transition-all duration-200 hover:bg-[#e60091] shadow-[0_0_20px_rgba(217,0,141,0.3)] hover:shadow-[0_0_30px_rgba(217,0,141,0.5)]"
						>
							Essayer gratuitement !
						</Link>

						<div className="mt-8 flex flex-row items-center gap-4">
							<div className="flex -space-x-2">
								{avatars.map((src, index) => (
									<div key={src} className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#050506] bg-[#141014]">
										<Image src={src} alt={`Artiste ${index + 1}`} fill sizes="40px" className="object-cover grayscale" />
									</div>
								))}
							</div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6e5f6a]">
								Ils façonnent le son<br />avec Nara
							</p>
						</div>
					</div>

					{/* RIGHT: Image Stack Switcher */}
					<div className="relative w-full lg:w-[45%] flex justify-center lg:justify-end mt-12 lg:mt-0 h-[380px] sm:h-[480px] xl:h-[550px]">
						<div className="relative w-full max-w-[320px] sm:max-w-[400px] xl:max-w-[450px] h-full flex items-center justify-center perspective-[1000px]">
							{stackImages.map((src, index) => {
								const offset = (index - activeIndex + stackImages.length) % stackImages.length;

								let transform = "";
								let opacity = 1;
								const zIndex = 10 - offset;

								if (offset === 0) {
									transform = "translateX(0) translateY(0) scale(1) rotate(0deg)";
								} else if (offset === 1) {
									transform = "translateX(15%) translateY(-5%) scale(0.9) rotate(4deg)";
									opacity = 0.7;
								} else if (offset === 2) {
									transform = "translateX(-15%) translateY(-10%) scale(0.8) rotate(-4deg)";
									opacity = 0.4;
								} else {
									transform = "translateX(0) translateY(-15%) scale(0.7) rotate(0deg)";
									opacity = 0;
								}

								return (
									<div
										key={src}
										className="absolute w-[240px] h-[320px] sm:w-[300px] sm:h-[400px] xl:w-[360px] xl:h-[480px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom"
										style={{ transform, opacity, zIndex }}
									>
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
										<Image
											src={src}
											alt={`Vibe Artiste ${index + 1}`}
											fill
											sizes="(max-width: 640px) 240px, (max-width: 1280px) 300px, 360px"
											className={`object-cover transition-all duration-700 ${offset === 0 ? 'grayscale-0' : 'grayscale'}`}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[100px] md:h-[150px] bg-gradient-to-b from-transparent to-[#050506]" />
		</section>
	);
};