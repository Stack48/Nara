"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, LayoutGrid, List } from "lucide-react";

import alfredo from "@/assets/cover/alfredo.png";
import lgseo from "@/assets/cover/lgseo.png";
import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const SharedFiles = () => {
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	const sharedList = [
		{
			id: 1,
			title: "Ensalada",
			album: "Alfredo 2",
			time: "Shared 2 hours ago",
			owner: "Tim Duncan",
			state: "Terminé",
			image: alfredo,
			collabs: 2,
		},
		{
			id: 2,
			title: "F.I.C.O",
			album: "Let God Sort Em Out",
			time: "Shared 1 day ago",
			owner: "Udonis Haslem",
			state: "En écriture",
			image: lgseo,
			collabs: 3,
		},
	];

	return (
		<div className="w-full font-arimo text-white pb-10">
			<h1 className="text-xl font-bold font-syne mb-6">Shared with me</h1>

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

			<div className="flex items-center justify-end gap-3 mb-8">
				<button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
					All files
					<ChevronDown size={14} />
				</button>
				<button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
					Last shared
					<ChevronDown size={14} />
				</button>

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

			{viewMode === "grid" ? (
				<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{sharedList.map((file) => (
						<div
							key={file.id}
							className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-pointer group"
						>
							<div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
								<Image
									src={file.image}
									alt={file.title}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-105"
									sizes="(max-width: 640px) 100vw, 128px"
								/>
							</div>
							<div className="flex flex-col flex-1 justify-between py-1 relative">
								<div className="flex items-start justify-between gap-2">
									<div>
										<h3 className="font-bold text-white text-base line-clamp-2 leading-tight mt-1">
											{file.title}
										</h3>
										<p className="text-xs text-neutral-400 mt-0.5">
											{file.album}
										</p>
									</div>
									<span className="sm:absolute sm:top-0 sm:right-0 border border-neutral-700 text-neutral-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit">
										{file.state}
									</span>
								</div>
								<p className="text-[11px] text-[#D90097] mt-1">
									Shared by {file.owner}
								</p>
								<div className="flex items-center justify-between mt-3 sm:mt-4">
									<span className="text-[10px] text-neutral-500">
										{file.time}
									</span>
									<div className="flex -space-x-2">
										{[...Array(Math.min(file.collabs, 3))].map((_, i) => (
											<div
												key={i}
												className="w-6 h-6 rounded-full overflow-hidden relative z-10"
											>
												<Image
													src={
														ALL_AVATARS[
															(file.id + i) %
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
					))}
				</div>
			) : (
				<div className="w-full">
					<div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
						<div className="col-span-5 pl-2">Name</div>
						<div className="col-span-2">Owner</div>
						<div className="col-span-2">State</div>
						<div className="col-span-3">Shared time</div>
					</div>

					<div className="flex flex-col gap-1">
						{sharedList.map((file) => (
							<div
								key={file.id}
								className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer"
							>
								<div className="col-span-5 flex items-center gap-4">
									<div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
										<Image
											src={file.image}
											alt={file.title}
											fill
											className="object-cover"
											sizes="48px"
										/>
									</div>
									<div className="flex flex-col">
										<span className="font-bold text-sm text-white">
											{file.title}
										</span>
										<span className="text-xs text-neutral-500">
											{file.album}
										</span>
									</div>
								</div>

								<div className="col-span-2 text-xs text-white">
									{file.owner}
								</div>

								<div className="col-span-2 text-xs font-bold text-white">
									{file.state}
								</div>

								<div className="col-span-3 text-xs text-white">
									{file.time}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
