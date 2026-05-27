"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, LayoutGrid, List } from "lucide-react";

import coverImage from "@/assets/cover/lgseo.png";
import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const insideProject = () => {
	// État pour gérer la vue actuelle ("grid" ou "list")
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	const insideProjectList = [
		{
			id: 1,
			title: "F.I.C.O.",
			time: "Edited 5 minutes ago",
			collabs: 2,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 2,
			title: "Let God Sort Em Out/Chandeliers",
			time: "Edited 8 minutes ago",
			collabs: 3,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 3,
			title: "M.T.B.T.T.F.",
			time: "Edited 12 minutes ago",
			collabs: 2,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 4,
			title: "Chains & Whips",
			time: "Edited 1 hour ago",
			collabs: 4,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 5,
			title: "So Be It",
			time: "Edited 2 hours ago",
			collabs: 2,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 6,
			title: "P.O.V.",
			time: "Edited 3 hours ago",
			collabs: 3,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 7,
			title: "Ace Trumpets",
			time: "Edited 1 day ago",
			collabs: 2,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 8,
			title: "The Birds Don't Sing",
			time: "Edited 5 minutes ago",
			collabs: 2,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 9,
			title: "All Things Considered",
			time: "Edited 8 minutes ago",
			collabs: 3,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 10,
			title: "Inglorious Bastards",
			time: "Edited 12 minutes ago",
			collabs: 2,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 11,
			title: "So Far Ahead",
			time: "Edited 1 hour ago",
			collabs: 4,
			state: "Terminé",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 12,
			title: "E.B.I.D.T.A.",
			time: "Edited 2 hours ago",
			collabs: 2,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
		{
			id: 13,
			title: "By The Grace Of God",
			time: "Edited 3 hours ago",
			collabs: 3,
			state: "En écriture",
			lastModified: "just now",
			created: "7 months ago",
		},
	];

	return (
		<div className="w-full font-arimo text-white pb-10">
			{/* TITRE */}
			<h1 className="text-xl font-bold font-syne mb-6">All files</h1>

			{/* BARRE DE RECHERCHE */}
			<div className="relative mb-6">
				<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search size={18} className="text-neutral-400" />
				</div>
				<input
					type="text"
					placeholder="Rechercher"
					className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
				/>
			</div>

			{/* FILTRES ET VUES */}
			<div className="flex items-center justify-end gap-3 mb-8">
				{/* Dropdown 1 */}
				<button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
					All files
					<ChevronDown size={14} />
				</button>

				{/* Dropdown 2 */}
				<button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
					Last viewed
					<ChevronDown size={14} />
				</button>

				{/* Toggle View */}
				<div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden ml-2">
					<button
						onClick={() => setViewMode("grid")}
						className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
					>
						<LayoutGrid size={16} />
					</button>
					<button
						onClick={() => setViewMode("list")}
						className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
					>
						<List size={16} />
					</button>
				</div>
			</div>

			{/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
			{viewMode === "grid" ? (
				/* --- VUE GRILLE --- */
				<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{insideProjectList.map((project) => (
						<div
							key={project.id}
							className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-pointer group"
						>
							<div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
								<Image
									src={coverImage}
									alt={project.title}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-105"
									sizes="(max-width: 640px) 100vw, 128px"
								/>
							</div>
							<div className="flex flex-col flex-1 justify-between py-1 relative">
								<div className="flex items-start justify-between gap-2">
									<h3 className="font-bold text-white text-base line-clamp-2 leading-tight pr-2 sm:pr-10 mt-1">
										{project.title}
									</h3>
									<span className={`sm:absolute sm:top-0 sm:right-0 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit ${
										project.title === "F.I.C.O."
											? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
											: "border border-neutral-700 text-neutral-400"
									}`}>
										{project.state}
									</span>
								</div>
								<div className="flex items-center justify-between mt-3 sm:mt-4">
									<span className="text-[10px] text-neutral-500">
										{project.time}
									</span>
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] text-neutral-500 hidden sm:block">
											Collaborators ({project.collabs})
										</span>
										<div className="flex -space-x-2">
											{[
												...Array(
													Math.min(
														project.collabs,
														3,
													),
												),
											].map((_, i) => (
												<div
													key={i}
													className="w-6 h-6 rounded-full overflow-hidden relative z-10"
												>
													<Image
														src={
															ALL_AVATARS[
																(project.id +
																	i) %
																	ALL_AVATARS.length
															]
														}
														alt={`Collab ${i + 1}`}
														fill
														className="object-cover"
														sizes="24px"
													/>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				/* --- VUE LISTE (TABLEAU) --- */
				<div className="w-full">
					{/* En-tête du tableau */}
					<div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
						<div className="col-span-5 pl-2">Name</div>
						<div className="col-span-2">State</div>
						<div className="col-span-2">Last modified</div>
						<div className="col-span-3">Created</div>
					</div>

					{/* Lignes du tableau */}
					<div className="flex flex-col gap-1">
						{insideProjectList.map((project) => (
							<div
								key={project.id}
								className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer"
							>
								{/* Name + Image */}
								<div className="col-span-5 flex items-center gap-4">
									<div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
										<Image
											src={coverImage}
											alt={project.title}
											fill
											className="object-cover"
											sizes="48px"
										/>
									</div>
									<span className="font-bold text-sm text-white">
										{project.title}
									</span>
								</div>

								{/* State */}
								<div className="col-span-2 text-xs font-bold">
									{project.title === "F.I.C.O." ? (
										<span className="bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] inline-block">
											{project.state}
										</span>
									) : (
										<span className="text-white">
											{project.state}
										</span>
									)}
								</div>

								{/* Last modified */}
								<div className="col-span-2 text-xs text-white">
									{project.lastModified}
								</div>

								{/* Created */}
								<div className="col-span-3 text-xs text-white">
									{project.created}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
