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
	<section className="relative isolate min-h-dvh overflow-hidden bg-[#050506] px-4 pb-0 pt-[72px] text-[#f7f2f6] sm:px-6 lg:px-8">
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

		<div className="absolute inset-0 -z-10 bg-[#050506]" />
		<div className="absolute inset-0 -z-10 opacity-70">
			<ColorBends
				colors={["#050506", "#15040f", "#4d062d", "#d9008d"]}
				rotation={24}
				speed={0.12}
				scale={1.18}
				frequency={0.72}
				warpStrength={0.58}
				mouseInfluence={0.18}
				parallax={0.12}
				noise={0.035}
				transparent={false}
			/>
		</div>
		<div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#050506_0%,rgba(5,5,6,0.78)_34%,rgba(5,5,6,0.18)_68%,rgba(26,3,16,0.34)_100%)]" />
		<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(217,0,141,0.2),transparent_38%)]" />
		<div className="absolute inset-x-0 bottom-0 -z-10 h-[46dvh] bg-gradient-to-t from-[#050506] via-[#050506]/72 to-transparent" />

		<div className="relative mx-auto flex min-h-[calc(100dvh-72px)] w-full max-w-[1180px] flex-col">
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

			<div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center pt-0 text-center">
				<h1
					className={`${syne.className} text-[clamp(34px,3.6vw,56px)] font-extrabold leading-[0.94] tracking-normal text-[#fff7fc]`}
				>
					<span className="block sm:whitespace-nowrap">
						Le futur de la production
					</span>
					<span className="block text-[#e60091]">musicale.</span>
				</h1>

				<p className="mt-[clamp(10px,1.4vh,18px)] max-w-[540px] text-[clamp(11px,0.9vw,14px)] leading-[1.45] text-[#a99aa4]">
					Nara centralise votre écriture, vos masters et votre gestion
					de projet dans un hub immersif conçu pour l&apos;excellence
					créative.
				</p>

				<Link
					href="/users"
					className="mt-[clamp(18px,2.4vh,30px)] inline-flex h-[clamp(42px,5.2vh,56px)] w-full max-w-[clamp(260px,24vw,380px)] items-center justify-center rounded-[8px] bg-[#d9008d] px-5 text-[clamp(12px,0.9vw,15px)] font-bold text-[#fff7fc] transition hover:bg-[#e60091] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6008e]"
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

			<div className="relative z-10 mx-auto mt-6 w-full max-w-[min(84vw,1180px)] flex-1 md:absolute md:left-1/2 md:top-[clamp(260px,36dvh,350px)] md:mt-0 md:-translate-x-1/2">
				<div className="absolute -inset-x-8 bottom-0 top-[18%] bg-[#d9008d]/10 blur-3xl" />
				<div className="relative max-h-[min(55dvh,560px)] overflow-hidden rounded-t-[8px] border-x border-t border-[#1f171d] bg-[#0a080a] shadow-[0_22px_70px_rgba(0,0,0,0.38)]">
					<Image
						src="/app-preview.png"
						alt="Interface de l'application Nara"
						width={1440}
						height={860}
						priority
						className="h-auto w-full object-cover object-top [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]"
					/>
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-transparent via-[#10070d]/78 to-[#050506]" />
				</div>
			</div>
		</div>
	</section>
);
