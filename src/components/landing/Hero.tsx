import Image from "next/image";
import Link from "next/link";
import { Syne } from "next/font/google";
import ColorBends from "@/components/ColorBends";

const syne = Syne({
	subsets: ["latin"],
	weight: ["700", "800"],
	display: "swap",
});

const artists = [
	{
		src: "/artist-1.png",
		alt: "Portrait artiste 1",
		className:
			"left-[clamp(12px,2vw,28px)] top-[clamp(28px,4vh,46px)] h-[clamp(82px,8vw,126px)] w-[clamp(98px,9.5vw,156px)] animate-[artistFloat_7s_ease-in-out_infinite]",
	},
	{
		src: "/artist-2.png",
		alt: "Portrait artiste 2",
		className:
			"left-[clamp(86px,10vw,165px)] top-[clamp(102px,13vh,158px)] h-[clamp(86px,8.5vw,132px)] w-[clamp(102px,10vw,160px)] animate-[artistFloat_8s_ease-in-out_infinite] [animation-delay:-2s]",
	},
	{
		src: "/artist-3.png",
		alt: "Portrait artiste 3",
		className:
			"right-[clamp(132px,14vw,230px)] top-[clamp(142px,17vh,205px)] h-[clamp(84px,8.5vw,130px)] w-[clamp(102px,10vw,160px)] animate-[artistFloat_7.5s_ease-in-out_infinite] [animation-delay:-1s]",
	},
	{
		src: "/artist-4.png",
		alt: "Portrait artiste 4",
		className:
			"right-[clamp(38px,4.4vw,72px)] top-[clamp(84px,10vh,124px)] h-[clamp(84px,8.5vw,130px)] w-[clamp(102px,10vw,160px)] animate-[artistFloat_8.5s_ease-in-out_infinite] [animation-delay:-3s]",
	},
];

const avatars = [
	"/artist-1.png",
	"/artist-2.png",
	"/artist-3.png",
	"/artist-4.png",
];

export const Hero = () => (
	<>
		<section className="relative isolate min-h-dvh  overflow-hidden bg-[#050506] px-4 pb-0 pt-[76px] text-[#f7f2f6] sm:px-6 sm:pt-[82px] lg:px-8">
			<style>
				{`
				@keyframes artistFloat {
					0%, 100% { transform: translate3d(0, 0, 0); }
					50% { transform: translate3d(0, -7px, 0); }
				}

				@media (prefers-reduced-motion: reduce) {
					[class*="artistFloat"] { animation: none !important; }
				}
			`}
			</style>

			<div className="pointer-events-none absolute inset-0 z-0 bg-[#050506]" />
			<div className="pointer-events-none absolute inset-0 z-0 opacity-100">
				<ColorBends
					colors={["#AA0063", "#D90097", "#D90097"]}
					rotation={90}
					speed={0.2}
					scale={1}
					frequency={1}
					warpStrength={1}
					mouseInfluence={1}
					noise={0.15}
					parallax={0.5}
					iterations={1}
					intensity={1.5}
					bandWidth={6}
					transparent
					autoRotate={0}
					// color="#A855F7"
				/>
			</div>

			<div className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-[1180px] flex-col sm:min-h-[calc(100dvh-82px)]">
				<div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[34dvh] md:block">
					{artists.map((artist) => (
						<div
							key={artist.src}
							className={`absolute overflow-hidden bg-[#151114] ${artist.className}`}
						>
							<Image
								src={artist.src}
								alt={artist.alt}
								fill
								sizes="(min-width: 1024px) 160px, 112px"
								className="object-cover grayscale"
							/>
						</div>
					))}
				</div>

				<div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-col items-center px-1 pt-1 text-center sm:px-0 md:pt-0">
					<h1
						className={`${syne.className} max-w-[min(86vw,320px)] text-[clamp(30px,8vw,34px)] font-extrabold leading-[0.94] tracking-normal text-[#fff7fc] sm:max-w-none sm:text-[clamp(42px,6.4vw,72px)] sm:leading-[0.92] md:text-[clamp(44px,4.5vw,64px)] lg:text-[clamp(48px,3.75vw,72px)]`}
					>
						<span className="block sm:hidden">Le futur de la</span>
						<span className="block sm:hidden">production</span>
						<span className="block text-[#e60091] sm:hidden">
							musicale.
						</span>
						<span className="hidden sm:block sm:whitespace-nowrap">
							Le futur de la production
						</span>
						<span className="hidden text-[#e60091] sm:block">
							musicale.
						</span>
					</h1>

					<p className="mt-4 max-w-[min(82vw,540px)] text-[13px] leading-[1.5] text-[#a99aa4] sm:mt-[clamp(10px,1.4vh,18px)] sm:text-[clamp(12px,1.15vw,14px)]">
						Nara centralise votre écriture, vos masters et votre
						gestion de projet dans un hub immersif conçu pour
						l&apos;excellence créative.
					</p>

					<Link
						href="/GenaralAPP/home"
						className="mt-5 inline-flex h-12 w-full max-w-[min(82vw,380px)] items-center justify-center rounded-[8px] bg-[#d9008d] px-5 text-sm font-bold text-[#fff7fc] transition hover:bg-[#e60091] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6008e] sm:mt-[clamp(18px,2.4vh,30px)] sm:h-[clamp(44px,5.2vh,56px)] sm:text-[clamp(12px,0.9vw,15px)]"
					>
						Essayer gratuitement !
					</Link>

					<div className="mt-[clamp(14px,2vh,24px)] flex flex-col items-center gap-3 sm:flex-row">
						<div className="flex -space-x-2">
							{avatars.map((src, index) => (
								<div
									key={src}
									className="relative h-[clamp(24px,2vw,34px)] w-[clamp(24px,2vw,34px)] overflow-hidden rounded-full border border-[#191017] bg-[#171216]"
								>
									<Image
										src={src}
										alt={`Artiste ${index + 1}`}
										fill
										sizes="34px"
										className="object-cover grayscale"
									/>
								</div>
							))}
						</div>
						<p className="text-[clamp(8px,0.58vw,10px)] font-bold uppercase tracking-[0.16em] text-[#8f808b]">
							Ils façonnent le son avec Nara
						</p>
					</div>
				</div>

				<div className="relative z-10 mx-auto mt-7 w-full max-w-[min(96vw,1180px)] flex-1 md:absolute md:left-1/2 md:top-[clamp(270px,36dvh,350px)] md:mt-0 md:max-w-[min(84vw,1180px)] md:-translate-x-1/2">
					<div className="absolute -inset-x-8 bottom-0 top-[18%] bg-[#d9008d]/10 blur-3xl" />
					<div className="relative max-h-[min(44dvh,430px)] overflow-hidden rounded-t-[8px] border-x border-t border-[#1f171d] bg-[#0a080a] shadow-[0_22px_70px_rgba(0,0,0,0.38)] sm:max-h-[min(48dvh,500px)] md:max-h-[min(55dvh,560px)]">
						<Image
							src="/app-preview.png"
							alt="Interface de l'application Nara"
							width={1440}
							height={1000}
							priority
							className="h-auto w-full object-cover object-top [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]"
						/>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-transparent via-[#10070d]/78 to-[#050506]" />
					</div>
				</div>
			</div>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[clamp(150px,24dvh,260px)] bg-gradient-to-b from-transparent via-[#050506]/88 to-[#050506]" />
		</section>
	</>
);
