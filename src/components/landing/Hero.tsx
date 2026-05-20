import Image from "next/image";
import Link from "next/link";
import { Syne } from "next/font/google";
import ColorBends from "@/components/landing/ColorBends";

const syne = Syne({
	subsets: ["latin"],
	weight: ["700", "800"],
	display: "swap",
});

const avatars = ["/artist-1.png", "/artist-2.png", "/artist-3.png", "/artist-4.png"];

export const Hero = () => (
	<section className="relative isolate overflow-x-hidden bg-[#050506] pb-0 pt-[76px] text-[#f7f2f6] sm:pt-[82px]">
		<style>{`
			@keyframes artistFloat {
				0%, 100% { transform: translate3d(0, 0, 0); }
				50% { transform: translate3d(0, -10px, 0); }
			}
		`}</style>

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

		{/* ── DESKTOP (lg+) ── */}
		<div className="relative z-10 hidden lg:flex flex-col items-center pt-10 xl:pt-14">

			<div className="flex w-full items-start justify-center px-8">

				{/* Artistes gauche */}
				<div className="flex flex-col mr-5 shrink-0">
					<div className="overflow-hidden bg-[#151114] w-[100px] h-[110px] xl:w-[120px] xl:h-[130px] animate-[artistFloat_7s_ease-in-out_infinite] -mt-4">
						<Image src="/artist-1.png" alt="Portrait artiste 1" width={120} height={130} className="h-full w-full object-cover grayscale" />
					</div>
					<div className="overflow-hidden bg-[#151114] w-[120px] h-[140px] xl:w-[145px] xl:h-[165px] animate-[artistFloat_8s_ease-in-out_infinite] [animation-delay:-2s] mt-8">
						<Image src="/artist-2.png" alt="Portrait artiste 2" width={145} height={165} className="h-full w-full object-cover grayscale" />
					</div>
				</div>

				{/* Centre */}
				<div className="flex flex-col items-center text-center shrink-0">
					<h1 className={`${syne.className} font-extrabold leading-[1.05] text-[#fff7fc] text-[clamp(30px,3.6vw,64px)] whitespace-nowrap`}>
						Le futur de la production
						<br />
						<span className="text-[#e60091]">musicale.</span>
					</h1>

					<p className="mt-5 max-w-[500px] text-[15px] leading-[1.65] text-[#a08898]">
						Nara centralise votre écriture, vos masters et votre gestion de projet
						<br />dans un hub immersif conçu pour l&apos;excellence créative.
					</p>

					<Link
						href="/users"
						className="mt-7 inline-flex h-[52px] w-[260px] items-center justify-center rounded-full bg-[#d9008d] px-8 text-[15px] font-bold text-white transition-all duration-200 hover:bg-[#e60091]"
					>
						Essayer gratuitement !
					</Link>

					<div className="mt-6 flex flex-row items-center gap-3">
						<div className="flex -space-x-2">
							{avatars.map((src, index) => (
								<div key={src} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#050506] bg-[#141014]">
									<Image src={src} alt={`Artiste ${index + 1}`} fill sizes="36px" className="object-cover grayscale" />
								</div>
							))}
						</div>
						<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e5f6a]">
							Ils façonnent le son avec Nara
						</p>
					</div>
				</div>

				{/* Artistes droite */}
				<div className="flex flex-col ml-5 shrink-0">
					<div className="overflow-hidden bg-[#151114] w-[120px] h-[140px] xl:w-[145px] xl:h-[165px] animate-[artistFloat_8.5s_ease-in-out_infinite] [animation-delay:-3s] mt-6">
						<Image src="/artist-4.png" alt="Portrait artiste 4" width={145} height={165} className="h-full w-full object-cover grayscale" />
					</div>
					<div className="overflow-hidden bg-[#151114] w-[100px] h-[110px] xl:w-[120px] xl:h-[130px] animate-[artistFloat_7.5s_ease-in-out_infinite] [animation-delay:-1s] mt-10">
						<Image src="/artist-3.png" alt="Portrait artiste 3" width={120} height={130} className="h-full w-full object-cover grayscale" />
					</div>
				</div>

			</div>

			{/* App preview */}
			<div className="relative mt-16 w-full max-w-[min(92vw,1100px)] xl:mt-20 px-4">
				<div className="absolute -inset-x-8 bottom-0 top-[20%] bg-[#d9008d]/8 blur-3xl" />
				<div className="relative max-h-[min(48dvh,460px)] overflow-hidden rounded-t-[10px] border-x border-t border-[#1e141a] bg-[#09070a] shadow-[0_28px_80px_rgba(0,0,0,0.5)] xl:max-h-[min(54dvh,540px)]">
					<Image
						src="/app-preview.png" alt="Interface de l'application Nara"
						width={1440} height={1000} priority
						className="h-auto w-full object-cover object-top [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]"
					/>
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-b from-transparent via-[#0d060a]/80 to-[#050506]" />
				</div>
			</div>
		</div>

		{/* ── MOBILE (< lg) ── */}
		<div className="relative z-10 flex min-h-[100dvh] flex-col justify-center px-6 pb-14 pt-10 lg:hidden">
			<h1 className={`${syne.className} text-[40px] font-extrabold leading-[1.05] text-[#fff7fc]`}>
				Le futur de la
				<br />production
				<br /><span className="text-[#e60091]">musicale.</span>
			</h1>

			<p className="mt-5 text-[15px] leading-[1.65] text-[#a08898]">
				Nara centralise votre écriture, vos masters et votre gestion de projet dans un hub immersif conçu pour l&apos;excellence créative.
			</p>

			<Link
				href="/users"
				className="mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#d9008d] px-8 text-[15px] font-bold text-white transition-all duration-200 hover:bg-[#e60091]"
			>
				Essayer gratuitement !
			</Link>

			<div className="mt-5 flex flex-row items-center gap-3">
				<div className="flex -space-x-2">
					{avatars.map((src, index) => (
						<div key={src} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#050506] bg-[#141014]">
							<Image src={src} alt={`Artiste ${index + 1}`} fill sizes="36px" className="object-cover grayscale" />
						</div>
					))}
				</div>
				<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e5f6a]">
					Ils façonnent le son avec Nara
				</p>
			</div>
		</div>

		<div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-[clamp(120px,20dvh,240px)] bg-gradient-to-b from-transparent via-[#050506]/85 to-[#050506] lg:block" />
	</section>
);