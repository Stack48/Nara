"use client";

import { useEffect, useRef, useState } from "react";
import "./faq.css";

type Category = "Fonctionnalités" | "À propos";

type Item = {
	q: string;
	cat: Category;
	/** Un paragraphe par entrée */
	a: string[];
};

const ITEMS: Item[] = [
	{
		q: "Qu'est-ce que Nara, concrètement ?",
		cat: "À propos",
		a: [
			"Un atelier unique pour vos morceaux. Aujourd'hui, un morceau vit éparpillé : les paroles dans un traitement de texte, l'instru dans un dossier, les retours dans une conversation de groupe et le master dans un mail. On finit par chercher la bonne version plus longtemps qu'on ne travaille.",
			"Nara réunit tout au même endroit. Vous écrivez vos paroles, vous déposez vos pistes, vous invitez vos collaborateurs — et chaque fichier reste rattaché au morceau. De la première ligne jusqu'au master, tout l'historique tient sur une seule page.",
		],
	},
	{
		q: "À qui s'adresse la plateforme ?",
		cat: "À propos",
		a: [
			"Aux producteurs, auteurs, ghostwriters et artistes qui travaillent rarement seuls : ceux qui écrivent à quatre mains, qui commandent des textes, ou qui mènent plusieurs projets de front.",
			"Pas besoin d'être ingénieur du son. Si vous savez écrire un couplet et déposer un fichier, vous savez utiliser Nara.",
		],
	},
	{
		q: "Qu'apporte l'éditeur de paroles ?",
		cat: "Fonctionnalités",
		a: [
			"Il travaille avec vous pendant que vous écrivez, sans jamais vous faire quitter la page. Cherchez une rime, comptez vos syllabes pour caler une mesure, ouvrez un champ lexical quand un thème s'épuise, trouvez un synonyme au passage.",
			"Vous pouvez aussi poser vos accords au-dessus des mots, comme sur une tablature, et garder plusieurs alternatives d'une même ligne côte à côte avant de trancher.",
		],
	},
	{
		q: "Comment écrire à plusieurs sur un morceau ?",
		cat: "Fonctionnalités",
		a: [
			"Vous invitez qui vous voulez et vous décidez de ce que chacun peut faire : un ghostwriter écrit et propose des alternatives, un artiste garde la main sur la version finale, un écouteur lit et commente sans rien modifier.",
			"Chacun voit le travail des autres au fur et à mesure, et vous gardez la trace de qui a écrit quoi.",
		],
	},
	{
		q: "Puis-je importer mes pistes et mes masters ?",
		cat: "Fonctionnalités",
		a: [
			"Oui : instru, maquette, prise de voix, master — vous déposez vos fichiers directement dans le projet.",
			"Chaque fichier reste rattaché au morceau et à ses paroles, et les versions s'empilent au lieu de s'écraser. La maquette d'il y a trois semaines est toujours là si vous voulez y revenir.",
		],
	},
	{
		q: "À qui appartiennent les morceaux que j'écris ?",
		cat: "À propos",
		a: [
			"À vous, entièrement. Nara héberge votre travail, ne le revendique pas et ne le revend pas.",
			"Vos textes et vos fichiers restent votre propriété : vous pouvez les exporter quand vous voulez, et supprimer un projet le supprime pour de bon.",
		],
	},
];

const FILTERS = ["Tout", "Fonctionnalités", "À propos"] as const;

export const Faq = () => {
	const [openIndex, setOpenIndex] = useState<number | null>(0);
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tout");
	const [visible, setVisible] = useState(false);
	const sectionRef = useRef<HTMLElement>(null);

	// Les animations d'entrée se déclenchent quand la section arrive à l'écran
	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					io.disconnect();
				}
			},
			{ threshold: 0.15 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	const shown = ITEMS.filter((it) => filter === "Tout" || it.cat === filter);

	return (
		<section
			id="fonctionnalites"
			ref={sectionRef}
			className={`nara-faq${visible ? " is-in" : ""}`}
		>
			<div className="nara-faq__bg" aria-hidden>
				<div className="nara-faq__veil" />
			</div>

			<div className="nara-faq__inner">
				<div className="nara-faq__tools">
					{FILTERS.map((f) => (
						<button
							key={f}
							type="button"
							className={`nara-faq__chip${filter === f ? " is-on" : ""}`}
							onClick={() => {
								setFilter(f);
								setOpenIndex(null);
							}}
						>
							{f}
						</button>
					))}
					<span className="nara-faq__count">
						{shown.length} question{shown.length > 1 ? "s" : ""}
					</span>
				</div>

				<div className="nara-faq__list">
					{shown.map((item, i) => {
						const isOpen = openIndex === i;
						return (
							<div
								key={item.q}
								className={`nara-faq__qa${isOpen ? " is-open" : ""}`}
								style={{ "--i": i } as React.CSSProperties}
							>
								<span className="nara-faq__eq" aria-hidden>
									<i />
									<i />
									<i />
								</span>
								<button
									type="button"
									className="nara-faq__head"
									aria-expanded={isOpen}
									onClick={() => setOpenIndex(isOpen ? null : i)}
								>
									<span className="nara-faq__q">{item.q}</span>
									<span className="nara-faq__cat">{item.cat}</span>
									<span className="nara-faq__mk" aria-hidden />
								</button>

								<div className="nara-faq__body">
									<div className="nara-faq__clip">
										{item.a.map((p, k) => (
											<p className="nara-faq__ans" key={k}>
												{p}
											</p>
										))}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="nara-faq__ask">
					<p>Vous ne trouvez pas votre réponse ?</p>
					<a href="mailto:contact@nara.app">
						Écrivez-nous
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden
						>
							<path d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					</a>
				</div>
			</div>
		</section>
	);
};