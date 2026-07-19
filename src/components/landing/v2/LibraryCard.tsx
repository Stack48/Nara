"use client";

import Image from "next/image";
import { Play, Search, LayoutGrid } from "lucide-react";

export type LibraryItem = {
	title: string;
	meta: string;
	/** Pochette : image dans /public (ou URL S3 plus tard) */
	cover: string;
	tag?: "En cours" | "Brouillon" | "Terminé";
	playable?: boolean;
};

/**
 * Placeholders : on réutilise les visuels déjà présents dans /public.
 * À remplacer par les vraies pochettes (upload S3) une fois l'API branchée.
 */
const DEFAULT_ITEMS: LibraryItem[] = [
	{
		title: "F.I.C.O",
		meta: "Let God Sort Em Out",
		cover: "/covers/fico.jpg",
		tag: "En cours",
		playable: true,
	},
	{ title: "MHM", meta: "il y a 2 h", cover: "/covers/mhm.jpg", tag: "Brouillon" },
	{
		title: "Chandeliers",
		meta: "Let God Sort Em Out",
		cover: "/covers/chandeliers.jpg",
		tag: "En cours",
	},
	{
		title: "My Way",
		meta: "il y a 5 min",
		cover: "/covers/my-way.jpg",
		tag: "Brouillon",
	},
	{
		title: "Golden Hour",
		meta: "il y a 1 j",
		cover: "/covers/golden-hour.jpg",
		tag: "En cours",
	},
	{
		title: "Echoes",
		meta: "il y a 3 j",
		cover: "/covers/echoes.jpg",
		tag: "Brouillon",
	},
];

type Props = {
	items?: LibraryItem[];
	onPlay?: (item: LibraryItem) => void;
};

export const LibraryCard = ({ items = DEFAULT_ITEMS, onPlay }: Props) => (
	<div className="nara-v2__libcol">
		<div className="nara-v2__lib">
			<div className="nara-v2__libhead">
				<b>Ta bibliothèque</b>
				<div className="nara-v2__libicons">
					<span>
						<Search size={15} />
					</span>
					<span>
						<LayoutGrid size={15} />
					</span>
				</div>
			</div>

			<div className="nara-v2__grid">
				{items.map((item, i) => (
					<article className="nara-v2__alb" key={`${item.title}-${i}`}>
						<div className="nara-v2__cover">
							<Image
								src={item.cover}
								alt={`Pochette ${item.title}`}
								fill
								sizes="140px"
								priority={i === 0}
							/>
							{item.tag && <span className="nara-v2__tag">{item.tag}</span>}
							{item.playable && (
								<button
									type="button"
									className="nara-v2__play"
									aria-label={`Lire ${item.title}`}
									onClick={() => onPlay?.(item)}
								>
									<Play size={11} fill="#fff" strokeWidth={0} />
								</button>
							)}
						</div>
						<b>{item.title}</b>
						<i>{item.meta}</i>
					</article>
				))}
			</div>
		</div>
	</div>
);