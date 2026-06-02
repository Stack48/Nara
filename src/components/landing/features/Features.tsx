"use client";

import { useState, useEffect } from "react";
import "./Features.css";
import vince from "../../../assets/landing/vince_staples.jpg";

// --- COMPOSANT 1 : PROMPTEUR ---
const Prompter = () => {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);

	const lyrics = [
		"I don't wanna die, but I will for the cause",
		"Tell me what I did now, drying off your tears now",
		"Fighting for some years now, something gotta give",
		"I don't wanna rebound, I just wanna sleep sound",
		"These trips come with baggage, been all 'cross this atlas",
		"But keep coming back to this place 'cause they trapped us",
		"I preach what I practice, these streets all I know",
		"And there's no place like home",
	];

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isPlaying) {
			interval = setInterval(() => {
				setActiveIndex((prev) =>
					prev < lyrics.length - 1 ? prev + 1 : prev,
				);
			}, 3000);
		}
		return () => clearInterval(interval);
	}, [isPlaying, lyrics.length]);

	const progress = (activeIndex / (lyrics.length - 1)) * 100;

	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6 md:gap-8">
				<h3 className="nara-title-3 text-white mb-4">
					Tes lyrics,
					<br />
					toujours sous les yeux.
				</h3>
				<div className="max-w-sm">
					<p className="nara-subtitle text-gray-300 mb-4">
						Le mode Prompteur affiche tes lyrics ligne par ligne, au
						rythme de ta performance. Concentre-toi sur ta voix, pas
						sur ton téléphone.
					</p>
					<span className="nara-body text-[#D90097] font-bold uppercase tracking-widest cursor-default">
						Prompteur →
					</span>
				</div>
			</div>

			<div className="relative w-full min-h-[500px] md:min-h-[600px] bg-[#0A0A0A] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col z-10">
				{/* Background glowing orbs */}
				<div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-[#D90097]/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
				<div className="absolute bottom-1/4 right-0 w-[250px] h-[250px] bg-[#FFBD2E]/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

				<div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-md relative z-20">
					<div className="flex gap-2">
						<div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
						<div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
						<div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
					</div>
					<span className="text-[10px] md:text-xs font-arimo text-white/50 tracking-wider uppercase truncate max-w-[150px] md:max-w-none">
						Live Prompter - Mode Studio
					</span>
					<div className="flex gap-2 items-center">
						<div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
							<div
								className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#27C93F] animate-pulse" : "bg-[#FFBD2E]"}`}
							></div>
							<span className="text-[10px] text-white/70 uppercase tracking-wider font-bold">
								{isPlaying ? "Live" : "Standby"}
							</span>
						</div>
					</div>
				</div>

				<div className="h-[2px] w-full bg-[#1A1A1A] relative z-20">
					<div
						className="h-full bg-[#D90097]"
						style={{
							width: `${progress}%`,
							transition: isPlaying
								? "width 3000ms linear"
								: "width 300ms ease-out",
						}}
					></div>
				</div>

				<div className="flex flex-col md:flex-row p-6 sm:p-8 md:p-16 md:pb-32 gap-8 md:gap-16 items-start relative z-10 bg-transparent flex-1">
					<div className="flex-1 w-full space-y-10">
						{lyrics.map((line, index) => {
							let stateClasses = "";

							if (index === activeIndex) {
								stateClasses =
									"bg-[#1E0D1C] text-white px-6 py-5 rounded-2xl -mx-6 shadow-xl border border-[#D90097]/20";
							} else if (index < activeIndex) {
								stateClasses = "text-white/30";
							} else {
								stateClasses = "text-white/10";
							}

							return (
								<p
									key={index}
									className={`font-arimo text-[17px] tracking-wide transition-all duration-500 ease-in-out ${stateClasses}`}
								>
									{line}
								</p>
							);
						})}
					</div>

					<div className="w-full md:w-[320px] flex flex-col items-center flex-shrink-0 md:sticky md:top-12 mt-8 md:mt-0 bg-[#0F0F0F]/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl">
						<div className="w-full aspect-square rounded-2xl overflow-hidden mb-8 bg-[#111] border border-white/10">
							<img
								src={vince.src}
								alt="Cover"
								className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
							/>
						</div>

						<div className="text-center mb-8">
							<h4 className="font-unbounded font-bold text-sm tracking-[0.15em] text-white uppercase">
								Take Me Home
							</h4>
							<p className="text-[#888888] text-[13px] font-arimo mt-2">
								Vince Staples & Fousheé — Vince Staples
							</p>
						</div>

						<div className="flex items-center gap-6">
							<button
								onClick={() => {
									setActiveIndex(0);
									setIsPlaying(false);
								}}
								className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
									/>
								</svg>
							</button>

							<button
								onClick={() => setIsPlaying(!isPlaying)}
								className="w-16 h-16 rounded-full bg-[#D90097] flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(217,0,151,0.4)]"
							>
								{isPlaying ? (
									<svg
										className="w-6 h-6 text-white"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<rect
											x="7"
											y="6"
											width="3"
											height="12"
											rx="1"
										/>
										<rect
											x="14"
											y="6"
											width="3"
											height="12"
											rx="1"
										/>
									</svg>
								) : (
									<svg
										className="w-6 h-6 text-white ml-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M8 5v14l11-7z" />
									</svg>
								)}
							</button>

							<button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 cursor-not-allowed">
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13 5l7 7-7 7M5 5l7 7-7 7"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// --- COMPOSANT 2 : COLLABORATION (LIVE EDITOR) ---
const Collaboration = () => {
	const [step, setStep] = useState(0);

	useEffect(() => {
		let isActive = true;

		const runAnimation = async () => {
			while (isActive) {
				setStep(0); // Idle
				await new Promise((r) => setTimeout(r, 1500));
				if (!isActive) break;

				setStep(1); // Momo move
				await new Promise((r) => setTimeout(r, 800));
				if (!isActive) break;

				setStep(2); // Momo highlight
				await new Promise((r) => setTimeout(r, 600));
				if (!isActive) break;

				setStep(3); // Momo type
				await new Promise((r) => setTimeout(r, 2000));
				if (!isActive) break;

				setStep(4); // Sarah move
				await new Promise((r) => setTimeout(r, 1000));
				if (!isActive) break;

				setStep(5); // Sarah highlight + comment
				await new Promise((r) => setTimeout(r, 4000));
				if (!isActive) break;
			}
		};

		runAnimation();
		return () => {
			isActive = false;
		};
	}, []);

	const momoPos =
		step === 0
			? { top: "80%", left: "90%", opacity: 0 }
			: step >= 1
				? { top: "15%", left: "75%", opacity: 1 }
				: { top: "80%", left: "90%", opacity: 0 };

	const sarahPos =
		step <= 3
			? { top: "90%", left: "10%", opacity: 0 }
			: step >= 4
				? { top: "45%", left: "80%", opacity: 1 }
				: { top: "90%", left: "10%", opacity: 0 };

	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6 md:gap-8">
				<h3 className="nara-title-3 text-white mb-4">
					Crée ensemble, en
					<br />
					temps réel.
				</h3>
				<div className="max-w-sm">
					<p className="nara-subtitle text-gray-300 mb-4">
						Nara transforme l'écriture en une expérience
						multijoueur. Vois les curseurs de tes collaborateurs se
						déplacer sur la page, modifiez les rimes ensemble et
						laissez des notes directement sur les paroles.
					</p>
					<span className="nara-body text-[#D90097] font-bold uppercase tracking-widest cursor-default">
						Collaboration Studio →
					</span>
				</div>
			</div>

			<div className="relative w-full min-h-[500px] md:min-h-[600px] bg-[#0A0A0A] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col z-10">
				{/* Background glowing orbs */}
				<div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-[#D90097]/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
				<div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-[#27C93F]/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-md relative z-20">
					<div className="flex gap-2">
						<div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
						<div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
						<div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
					</div>
					<span className="text-[10px] md:text-xs font-arimo text-white/50 tracking-wider uppercase truncate max-w-[150px] md:max-w-none">
						Couplet 2 - Sans Titre
					</span>
					<div className="flex gap-2 items-center">
						<div className="flex -space-x-2">
							<div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#D90097] border-2 border-[#0F0F0F] flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white z-20">
								M
							</div>
							<div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#27C93F] border-2 border-[#0F0F0F] flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white z-10">
								S
							</div>
						</div>
					</div>
				</div>

				{/* Editor Content */}
				<div className="flex-1 p-6 sm:p-8 md:p-14 lg:p-20 font-arimo text-[19px] sm:text-2xl md:text-3xl leading-[2] md:leading-[2.2] text-white/80 relative overflow-hidden bg-transparent z-10">
					{/* CURSOR MOMO */}
					<div
						className="absolute z-50 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
						style={{
							top: momoPos.top,
							left: momoPos.left,
							opacity: momoPos.opacity,
							transform: "translate(-5px, -5px)",
						}}
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							className="drop-shadow-xl scale-75 md:scale-100 origin-top-left"
						>
							<path
								d="M5.5 3.5L19.5 10.5L12 12.5L9.5 20L5.5 3.5Z"
								fill="#D90097"
								stroke="white"
								strokeWidth="1.5"
								strokeLinejoin="round"
							/>
						</svg>
						<div className="bg-[#D90097] text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full absolute top-5 left-4 shadow-lg whitespace-nowrap">
							Momo
						</div>
					</div>

					{/* CURSOR SARAH */}
					<div
						className="absolute z-50 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
						style={{
							top: sarahPos.top,
							left: sarahPos.left,
							opacity: sarahPos.opacity,
							transform: "translate(-5px, -5px)",
						}}
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							className="drop-shadow-xl scale-75 md:scale-100 origin-top-left"
						>
							<path
								d="M5.5 3.5L19.5 10.5L12 12.5L9.5 20L5.5 3.5Z"
								fill="#27C93F"
								stroke="white"
								strokeWidth="1.5"
								strokeLinejoin="round"
							/>
						</svg>
						<div className="bg-[#27C93F] text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full absolute top-5 left-4 shadow-lg whitespace-nowrap">
							Sarah
						</div>
					</div>

					<p className="whitespace-pre-wrap relative z-10 w-full sm:w-11/12 md:w-3/4">
						On cherchait la lumière dans la{" "}
						<span className="relative inline-block">
							{step < 2 ? (
								"ville"
							) : step === 2 ? (
								<span className="bg-[#D90097]/40 text-white px-1 -mx-1 rounded">
									ville
								</span>
							) : (
								<span className="text-[#D90097] font-bold">
									nuit
								</span>
							)}
							{step >= 3 && step < 4 && (
								<span className="absolute -right-1 md:-right-2 top-1/2 -translate-y-1/2 w-0.5 h-6 md:h-8 bg-[#D90097] animate-pulse"></span>
							)}
						</span>
					</p>

					<div className="mt-2 md:mt-4 relative w-full sm:w-11/12 md:w-3/4 z-10">
						<p className="whitespace-pre-wrap">
							Ils ont des choses à dire, mais n'ont rien à{" "}
							<span className="relative inline-block">
								{step < 5 ? (
									"prouver"
								) : (
									<span className="bg-[#27C93F]/40 text-white px-1 -mx-1 rounded">
										prouver
									</span>
								)}
							</span>
						</p>

						{/* Sarah Comment Box */}
						<div
							className={`absolute top-full left-0 mt-4 sm:mt-6 bg-[#111]/95 backdrop-blur-xl border border-[#27C93F]/30 p-4 sm:p-5 rounded-2xl shadow-2xl w-[90vw] sm:w-[320px] max-w-[340px] z-40 transition-all duration-500 origin-top-left ${step >= 5 ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}
						>
							<div className="flex items-center gap-3 mb-2 sm:mb-3">
								<div className="w-6 h-6 rounded-full bg-[#27C93F] flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
									S
								</div>
								<span className="text-xs sm:text-sm text-white/90 font-bold">
									Sarah
								</span>
							</div>
							<p className="text-[13px] sm:text-sm text-white/80 font-arimo leading-relaxed">
								On devrait plutôt dire{" "}
								<span className="text-[#27C93F] font-bold">
									raconter
								</span>{" "}
								ici non ? Ça rimerait mieux avec le couplet
								précédent.
							</p>
						</div>
					</div>

					<p className="text-white/30 mt-2 md:mt-4 blur-[1px] select-none">
						Je continue d'écrire pour m'en sortir
					</p>
					<p className="text-white/20 mt-2 md:mt-4 blur-[2px] hidden sm:block select-none">
						Le temps passe vite quand on doit fuir
					</p>
				</div>
			</div>
		</div>
	);
};

// --- COMPOSANT 3 : ASSISTANT RIMES ---
const RhymeSuggestions = () => {
	const [step, setStep] = useState(0);
	const [typedText, setTypedText] = useState("");

	const fullText = "Le réveil sonne, la ville fait du";

	useEffect(() => {
		let currentText = "";
		let charIndex = 0;
		let timeout: NodeJS.Timeout;
		let isActive = true;

		const runLoop = () => {
			if (!isActive) return;
			setStep(0);
			currentText = "";
			setTypedText("");
			charIndex = 0;

			const typeSequence = () => {
				if (!isActive) return;
				if (charIndex < fullText.length) {
					currentText += fullText[charIndex];
					setTypedText(currentText);
					charIndex++;
					timeout = setTimeout(typeSequence, 30 + Math.random() * 50);
				} else {
					setStep(1); // Fini de taper
					timeout = setTimeout(() => {
						if (!isActive) return;
						setStep(2); // Affichage des suggestions
						timeout = setTimeout(() => {
							if (!isActive) return;
							setStep(3); // Survol de la suggestion
							timeout = setTimeout(() => {
								if (!isActive) return;
								setStep(4); // Validation
								setTypedText(currentText + " bruit");
								timeout = setTimeout(() => {
									if (!isActive) return;
									setStep(5); // Attente fin
									timeout = setTimeout(runLoop, 3500); // Recommence
								}, 500);
							}, 1000);
						}, 1200);
					}, 600);
				}
			};

			timeout = setTimeout(typeSequence, 1000);
		};

		runLoop();

		return () => {
			isActive = false;
			clearTimeout(timeout);
		};
	}, []);

	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6 md:gap-8">
				<h3 className="nara-title-3 text-white mb-4">
					La rime parfaite,
					<br />
					au bon moment.
				</h3>
				<div className="max-w-sm">
					<p className="nara-subtitle text-gray-300 mb-4">
						Ne perds plus ton flow. L'assistant intégré de Nara
						analyse tes couplets en temps réel et te propose des
						rimes riches sans jamais que tu n'aies à quitter ta
						page.
					</p>
					<span className="nara-body text-[#D90097] font-bold uppercase tracking-widest cursor-default">
						Assistant d'écriture →
					</span>
				</div>
			</div>

			<div className="relative w-full min-h-[500px] md:min-h-[600px] bg-[#0A0A0A] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col z-10">
				{/* Background glowing orbs */}
				<div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-[#D90097]/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen z-0"></div>
				<div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen z-0"></div>

				{/* Fake App Window */}
				<div className="flex-1 w-full flex flex-col relative z-10 bg-transparent">
					<div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-md relative z-20">
						<div className="flex gap-2">
							<div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
							<div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
							<div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
						</div>
						<span className="text-[10px] md:text-xs font-arimo text-white/50 tracking-wider uppercase truncate max-w-[150px] md:max-w-none">
							Couplet 1 - Nara Studio
						</span>
						<div className="flex gap-2 items-center">
							<div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#D90097] border-2 border-[#0F0F0F] flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white z-20">
								N
							</div>
						</div>
					</div>

					<div className="flex flex-col md:flex-row flex-1 relative z-10">
						{/* PARTIE GAUCHE : Editeur (Personne qui écrit) */}
						<div className="flex-1 p-6 sm:p-8 md:p-16 border-b md:border-b-0 border-white/5 md:border-r font-arimo text-[20px] md:text-[24px] leading-[2.2] tracking-wide relative bg-transparent">
							<p className="text-white/40">
								J'ai des visions de grandeur la{" "}
								<span
									className={`transition-colors duration-500 font-bold ${step >= 2 ? "text-[#D90097]" : "text-white/40"}`}
								>
									nuit
								</span>
								,
							</p>
							<div className="text-white">
								{typedText}
								{/* Curseur dynamique */}
								<span
									className={`inline-block w-[2px] h-6 bg-[#D90097] align-middle ml-1 ${step === 1 || step === 5 || step === 0 ? "animate-pulse" : "opacity-100"}`}
								></span>
							</div>

							<p className="text-white/40 mt-2 opacity-30 blur-[1px]">
								Ils parlent tous, mais n'ont rien à dire
							</p>
							<p className="text-white/40 opacity-10 blur-[2px]">
								Je continue d'écrire pour m'en sortir
							</p>

							{/* Indicateur de frappe */}
							<div
								className={`absolute bottom-4 left-6 md:bottom-8 md:left-16 flex items-center gap-3 text-white/30 text-sm font-unbounded transition-opacity duration-300 ${step === 0 ? "opacity-100" : "opacity-0"}`}
							>
								<div className="flex gap-1 items-center">
									<div
										className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce"
										style={{ animationDelay: "0ms" }}
									></div>
									<div
										className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce"
										style={{ animationDelay: "150ms" }}
									></div>
									<div
										className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce"
										style={{ animationDelay: "300ms" }}
									></div>
								</div>
								Écriture en cours...
							</div>
						</div>

						{/* PARTIE DROITE : Assistant Sidebar */}
						<div className="w-full md:w-[400px] bg-[#0A0A0A]/40 backdrop-blur-md p-6 md:p-10 flex flex-col relative overflow-hidden">
							<div className="flex items-center gap-4 mb-10 relative z-10">
								<div className="w-10 h-10 rounded-xl bg-[#D90097]/20 flex items-center justify-center border border-[#D90097]/30 shadow-[0_0_15px_rgba(217,0,151,0.2)]">
									<svg
										className="w-5 h-5 text-[#D90097]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth="2.5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
								</div>
								<div>
									<h3 className="font-unbounded text-white text-lg font-bold tracking-wide">
										Dictionnaire
									</h3>
									<p className="text-[#888888] text-xs font-arimo mt-0.5">
										Suggestions de rimes
									</p>
								</div>
							</div>

							<div
								className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10 ${step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
							>
								<div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden group">
									<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D90097] to-purple-600"></div>
									<p className="text-white/50 text-[10px] font-arimo uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-[#D90097] animate-pulse shadow-[0_0_8px_rgba(217,0,151,0.8)]"></span>
										Analyse de la rime
									</p>
									<p className="font-unbounded text-3xl font-bold text-white mb-2 tracking-tight">
										« nuit »
									</p>
									<p className="nara-body text-[#D90097] font-bold flex items-center gap-2">
										Terminaison : /ɥi/
									</p>
								</div>

								<div className="space-y-3">
									{[
										{
											word: "bruit",
											match: "99%",
											type: "Nom",
										},
										{
											word: "minuit",
											match: "95%",
											type: "Nom",
										},
										{
											word: "détruit",
											match: "92%",
											type: "Verbe",
										},
										{
											word: "s'enfuit",
											match: "88%",
											type: "Verbe",
										},
									].map((item, idx) => (
										<div
											key={idx}
											className={`p-4 rounded-xl font-arimo transition-all flex items-center justify-between border ${
												step >= 3 && idx === 0
													? "bg-[#D90097]/15 border-[#D90097]/40 text-white transform scale-[1.02] shadow-[0_4px_20px_rgba(217,0,151,0.15)]"
													: "bg-[#111111]/40 backdrop-blur-sm border-white/5 hover:bg-white/10 text-white/70 hover:border-white/20"
											}`}
										>
											<div className="flex items-center gap-4">
												<span
													className={`text-[17px] ${step >= 3 && idx === 0 ? "font-bold text-white" : ""}`}
												>
													{item.word}
												</span>
											</div>
											<div className="flex items-center gap-4">
												<span className="text-[11px] text-white/30 uppercase tracking-wider">
													{item.type}
												</span>
												{step >= 3 && idx === 0 ? (
													<span className="text-[10px] bg-[#D90097] text-white px-2 py-1 rounded-md uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(217,0,151,0.5)]">
														Tab ⇥
													</span>
												) : (
													<span className="text-[11px] text-[#888] font-mono">
														{item.match}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Empty state while typing */}
							<div
								className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full transition-all duration-500 delay-100 ${step < 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
							>
								<div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 bg-[#111111]/80 backdrop-blur-sm shadow-inner">
									<div className="w-6 h-6 border-2 border-white/10 border-t-[#D90097] rounded-full animate-spin"></div>
								</div>
								<p className="text-white/40 text-sm font-arimo tracking-wide">
									Analyse en temps réel...
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Arrière-plan décoratif abstrait pour quand le dictionnaire apparaît */}
				<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
					<div
						className={`absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#D90097]/15 blur-[120px] rounded-full mix-blend-screen transition-opacity duration-1000 ${
							step >= 2 && step <= 4
								? "opacity-100 scale-110"
								: "opacity-30 scale-100"
						}`}
					></div>
				</div>
			</div>
		</div>
	);
};

export const Features = () => {
	return (
		<section className="py-20 md:py-32 bg-[#050505]">
			<div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-24 md:mb-32">
					<div className="mb-6 flex justify-center">
						<span className="nara-badge">Fonctionnalités</span>
					</div>
					<h2 className="nara-title-2 text-white mb-6">
						Conçu pour l'excellence.
					</h2>
					<p className="nara-subtitle text-gray-300 max-w-2xl mx-auto">
						Des fonctionnalités taillées sur mesure pour sublimer
						ton processus créatif.
					</p>
				</div>

				<div className="space-y-16 md:space-y-40">
					{/* Feature 1: Suggestions de rimes automatiques */}
					<RhymeSuggestions />

					{/* Feature 2: Prompteur */}
					<Prompter />

					{/* Feature 3: Collaboration */}
					<Collaboration />
				</div>
			</div>
		</section>
	);
};
