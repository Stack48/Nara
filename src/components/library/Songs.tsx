"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
	Search,
	ChevronDown,
	LayoutGrid,
	List,
	Music,
	Check,
	Play,
	Pause,
} from "lucide-react";
import { useAudioClick } from "@/hooks/useAudioClick";
import { useSongs, Song } from "@/lib/songStore";
import { ContextMenu } from "./ContextMenu";
import { RenameModal } from "../modals/RenameModal";
import { Toast } from "./Toast";

import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const Songs = () => {
	// État pour gérer la vue actuelle ("grid" ou "list")
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// État pour le tri
	const [sortBy, setSortBy] = useState<
		"alphabetical" | "created" | "modified"
	>("modified");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

	// État pour le filtrage par origine (standalone ou projet)
	const [filterOrigin, setFilterOrigin] = useState<
		"all" | "standalone" | "project"
	>("all");
	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

	const sortMenuRef = useRef<HTMLDivElement>(null);
	const filterMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				sortMenuRef.current &&
				!sortMenuRef.current.contains(event.target as Node)
			) {
				setIsSortMenuOpen(false);
			}
			if (
				filterMenuRef.current &&
				!filterMenuRef.current.contains(event.target as Node)
			) {
				setIsFilterMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const getSortLabel = () => {
		if (sortBy === "alphabetical") return "Alphabetical";
		if (sortBy === "created") return "Date created";
		return "Last modified";
	};

	const getFilterLabel = () => {
		if (filterOrigin === "all") return "All songs";
		if (filterOrigin === "standalone") return "Standalone";
		return "In a project";
	};

	const allSongs = useSongs();
	const songsList = allSongs.filter((song) => !song.isDeleted);

	const [searchQuery, setSearchQuery] = useState("");
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; song: Song } | null>(null);
	const [renameModal, setRenameModal] = useState<{ songId: string; initialTitle: string } | null>(null);

	const handleContextMenu = (e: React.MouseEvent, song: Song) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			song
		});
	};

	// Filtrage des chansons selon l'origine (standalone / projet) et la recherche
	const filteredSongsList = songsList.filter((song) => {
		const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(song.projectName && song.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
		if (!matchesSearch) return false;
		if (filterOrigin === "all") return true;
		return song.origin === filterOrigin;
	});

	// Tri dynamique de la liste filtrée
	const sortedSongsList = [...filteredSongsList].sort((a, b) => {
		if (sortBy === "alphabetical") {
			const comparison = a.title.localeCompare(b.title);
			return sortOrder === "asc" ? comparison : -comparison;
		} else if (sortBy === "created") {
			const comparison =
				a.createdDate.getTime() - b.createdDate.getTime();
			return sortOrder === "asc" ? comparison : -comparison;
		} else {
			// modified
			const comparison =
				a.lastModifiedDate.getTime() - b.lastModifiedDate.getTime();
			return sortOrder === "asc" ? comparison : -comparison;
		}
	});

	return (
		<div className="w-full font-arimo text-white pb-10">
			{/* TITRE */}
			<h1 className="text-xl font-bold font-syne mb-6">All songs</h1>

			{/* BARRE DE RECHERCHE */}
			<div className="relative mb-6">
				<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search size={18} className="text-neutral-400" />
				</div>
				<input
					type="text"
					placeholder="Rechercher"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
				/>
			</div>

			{/* ONGLETS ET FILTRES */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				{/* Compteur de chansons à gauche */}
				<div className="text-sm font-semibold text-neutral-400">
					{filteredSongsList.length} songs
				</div>

				{/* Filtres de droite */}
				<div className="flex items-center gap-3 flex-wrap md:flex-nowrap pb-2 md:pb-0">
					{/* Dropdown Filtre Origine (All songs / Standalone / In a project) */}
					<div className="relative" ref={filterMenuRef}>
						<button
							type="button"
							onClick={() =>
								setIsFilterMenuOpen(!isFilterMenuOpen)
							}
							className="flex items-center gap-2 bg-[#151515] border border-neutral-800 hover:border-neutral-700 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
						>
							<span>{getFilterLabel()}</span>
							<ChevronDown
								size={14}
								className="text-neutral-400"
							/>
						</button>

						{isFilterMenuOpen && (
							<div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl z-50 py-2.5 px-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
								<div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
									Filter by origin
								</div>
								{[
									{ id: "all", label: "All songs" },
									{ id: "standalone", label: "Standalone" },
									{ id: "project", label: "In a project" },
								].map((option) => (
									<button
										key={option.id}
										type="button"
										onClick={() => {
											setFilterOrigin(option.id as any);
											setIsFilterMenuOpen(false);
										}}
										className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
									>
										<div className="w-4 h-4 flex items-center justify-center shrink-0">
											{filterOrigin === option.id && (
												<Check
													size={12}
													strokeWidth={3}
													className="text-[#D90097]"
												/>
											)}
										</div>
										<span>{option.label}</span>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Dropdown Tri (Last modified) */}
					<div className="relative" ref={sortMenuRef}>
						<button
							type="button"
							onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
							className="flex items-center gap-2 bg-[#151515] border border-neutral-800 hover:border-neutral-700 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
						>
							<span>{getSortLabel()}</span>
							<ChevronDown
								size={14}
								className="text-neutral-400"
							/>
						</button>

						{isSortMenuOpen && (
							<div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl z-50 py-2.5 px-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
								{/* Section Sort by */}
								<div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
									Sort by
								</div>
								{[
									{
										id: "alphabetical",
										label: "Alphabetical",
									},
									{ id: "created", label: "Date created" },
									{ id: "modified", label: "Last modified" },
								].map((option) => (
									<button
										key={option.id}
										type="button"
										onClick={() => {
											setSortBy(option.id as any);
											setIsSortMenuOpen(false);
										}}
										className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
									>
										<div className="w-4 h-4 flex items-center justify-center shrink-0">
											{sortBy === option.id && (
												<Check
													size={12}
													strokeWidth={3}
													className="text-[#D90097]"
												/>
											)}
										</div>
										<span>{option.label}</span>
									</button>
								))}

								{/* Divider */}
								<hr className="border-neutral-800/80 my-1.5 mx-1" />

								{/* Section Order */}
								<div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
									Order
								</div>
								{[
									{
										id: "asc",
										label:
											sortBy === "alphabetical"
												? "A to Z"
												: "Oldest first",
									},
									{
										id: "desc",
										label:
											sortBy === "alphabetical"
												? "Z to A"
												: "Newest first",
									},
								].map((option) => (
									<button
										key={option.id}
										type="button"
										onClick={() => {
											setSortOrder(option.id as any);
											setIsSortMenuOpen(false);
										}}
										className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
									>
										<div className="w-4 h-4 flex items-center justify-center shrink-0">
											{sortOrder === option.id && (
												<Check
													size={12}
													strokeWidth={3}
													className="text-[#D90097]"
												/>
											)}
										</div>
										<span>{option.label}</span>
									</button>
								))}
							</div>
						)}
					</div>

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
			</div>

			{/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
			{viewMode === "grid" ? (
				/* --- VUE GRILLE --- */
				<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{sortedSongsList.map((song, index) => (
						<SongGridItem 
							key={song.id} 
							song={song} 
							index={index} 
							onContextMenu={(e) => handleContextMenu(e, song)}
						/>
					))}
				</div>
			) : (
				/* --- VUE LISTE (TABLEAU) --- */
				<div className="w-full">
					{/* En-tête du tableau */}
					<div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500">
						<div className="col-span-4 pl-2">Name</div>
						<div className="col-span-2">Project</div>
						<div className="col-span-2">State</div>
						<div className="col-span-2">Last modified</div>
						<div className="col-span-2">Created</div>
					</div>

					{/* Lignes du tableau */}
					<div className="flex flex-col">
						{sortedSongsList.map((song, index) => (
							<SongListItem
								key={song.id}
								song={song}
								isLast={index === sortedSongsList.length - 1}
								onContextMenu={(e) => handleContextMenu(e, song)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Custom overlays for actions */}
			{contextMenu && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					song={contextMenu.song}
					onClose={() => setContextMenu(null)}
					onRenameClick={() => setRenameModal({ songId: contextMenu.song.id, initialTitle: contextMenu.song.title })}
				/>
			)}

			{renameModal && (
				<RenameModal
					isOpen={true}
					onClose={() => setRenameModal(null)}
					songId={renameModal.songId}
					initialTitle={renameModal.initialTitle}
				/>
			)}

			<Toast />
		</div>
	);
};

// --- Sous-composants pour gérer les hooks individuellement ---

export const SongGridItem = ({ song, index, onContextMenu }: { song: any; index: number; onContextMenu?: React.MouseEventHandler }) => {
	const { togglePlay, isPlaying } = useAudioClick(song.audioSrc, 30);
	const isTest = song.id === "test";

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData(
			"text/plain",
			JSON.stringify({
				id: song.id,
				title: song.title,
				projectId: song.projectId || "",
				projectName: song.projectName || "",
			}),
		);
	};

	if (isTest) {
		return (
			<div
				className="relative overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-800/80 hover:border-neutral-500 transition-all duration-500 rounded-2xl p-5 flex flex-col justify-between min-h-[160px] group bg-neutral-950"
				draggable={true}
				onDragStart={handleDragStart}
				onContextMenu={onContextMenu}
			>
				{/* Image de fond avec effet de flou */}
				<div className="absolute inset-0 z-0">
					<Image
						src={song.image}
						alt={song.title}
						fill
						className="object-cover blur-[8px] opacity-40 scale-110 transition-transform duration-700 group-hover:scale-115"
						sizes="(max-width: 640px) 100vw, 350px"
					/>
					<div className="absolute inset-0 bg-[#111111]/30 group-hover:bg-[#111111]/45 transition-colors duration-500"></div>
				</div>

				{/* Contenu */}
				<div className="relative z-10 flex flex-col justify-between h-full flex-1 pointer-events-none">
					{/* Ligne du haut */}
					<div className="flex justify-between items-start w-full">
						{/* Top Left */}
						<div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
							{song.state === "Terminé" ? "SINGLE" : "SONG"} •{" "}
							{song.collabs} TITRES
						</div>

						{/* Top Right */}
						<div className="text-right flex flex-col">
							<span className="text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">
								DATE DE CRÉATION
							</span>
							<span className="text-[10px] text-neutral-400 font-medium mt-0.5">
								Créé il y a {song.created}
							</span>
						</div>
					</div>

					{/* Ligne du milieu/bas */}
					<div className="flex justify-between items-end mt-4">
						{/* Left: Titre */}
						<div>
							<h3 className="font-syne font-bold text-white text-2xl tracking-tight leading-tight group-hover:text-[#D90097] transition-colors duration-300 pr-4">
								{song.title}
							</h3>
							{song.projectName && (
								<span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mt-0.5">
									{song.projectName}
								</span>
							)}
						</div>

						{/* Right: Collaborateurs */}
						<div className="flex flex-col items-end shrink-0">
							<span className="text-[9px] text-neutral-400 font-semibold tracking-wider uppercase mb-1">
								COLLABORATEURS ({song.collabs})
							</span>
							<div className="flex -space-x-1.5">
								{[...Array(Math.min(song.collabs, 3))].map(
									(_, i) => (
										<div
											key={i}
											className="w-5.5 h-5.5 rounded-full border border-neutral-900 overflow-hidden relative z-10"
										>
											<Image
												src={
													ALL_AVATARS[
														(index + i) %
															ALL_AVATARS.length
													]
												}
												alt={`Collab ${i + 1}`}
												fill
												className="object-cover"
												sizes="22px"
											/>
										</div>
									),
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Indicateur Audio en Hover */}
				<div
					className={`absolute top-3 right-3 transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"} z-20`}
				>
					<button
						onClick={togglePlay}
						className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_12px_rgba(217,0,151,0.6)] transform hover:scale-105 transition-transform duration-200 cursor-pointer"
					>
						{isPlaying ? (
							<Pause size={16} className="text-white fill-white" />
						) : (
							<Play size={16} className="text-white fill-white ml-0.5" />
						)}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-grab active:cursor-grabbing group animate-in fade-in"
			draggable={true}
			onDragStart={handleDragStart}
			onContextMenu={onContextMenu}
		>
			<div
				className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer"
			>
				<Image
					src={song.image}
					alt={song.title}
					fill
					className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
					sizes="(max-width: 640px) 100vw, 128px"
				/>
				{/* Hover Play/Pause Overlay */}
				<div
					className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
				>
					<button
						onClick={togglePlay}
						className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200"
					>
						{isPlaying ? (
							<Pause size={16} className="text-white fill-white" />
						) : (
							<Play size={16} className="text-white fill-white ml-0.5" />
						)}
					</button>
				</div>
			</div>
			<div className="flex flex-col flex-1 justify-center gap-2 py-1 relative">
				<div className="flex items-start justify-between gap-2">
					<div>
						<h3 className="font-bold text-white text-base line-clamp-2 leading-tight pr-2 sm:pr-10 mt-1">
							{song.title}
						</h3>
						{song.projectName && (
							<span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5 block">
								{song.projectName}
							</span>
						)}
					</div>
					<span className="sm:absolute sm:top-0 sm:right-0 border border-neutral-700 text-neutral-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit">
						{song.state}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-[10px] text-neutral-500">
						{song.time}
					</span>
					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-neutral-500 hidden sm:block">
							Collaborators ({song.collabs})
						</span>
						<div className="flex -space-x-2">
							{[...Array(Math.min(song.collabs, 3))].map(
								(_, i) => (
									<div
										key={i}
										className="w-6 h-6 rounded-full overflow-hidden relative z-10"
									>
										<Image
											src={
												ALL_AVATARS[
													(index + i) %
														ALL_AVATARS.length
												]
											}
											alt={`Collab ${i + 1}`}
											fill
											className="object-cover"
											sizes="24px"
										/>
									</div>
								),
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const SongListItem = ({ song, isLast, onContextMenu }: { song: any; isLast: boolean; onContextMenu?: React.MouseEventHandler }) => {
	const { togglePlay, isPlaying } = useAudioClick(song.audioSrc, 30);

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData(
			"text/plain",
			JSON.stringify({
				id: song.id,
				title: song.title,
				projectId: song.projectId || "",
				projectName: song.projectName || "",
			}),
		);
	};

	return (
		<div
			className="flex flex-col cursor-grab active:cursor-grabbing"
			draggable={true}
			onDragStart={handleDragStart}
			onContextMenu={onContextMenu}
		>
			<div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group">
				{/* Name + Image */}
				<div className="col-span-4 flex items-center gap-4">
					<div
						className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 cursor-pointer"
					>
						<Image
							src={song.image}
							alt={song.title}
							fill
							className="object-cover"
							sizes="48px"
						/>
						<div
							className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
						>
							<button
								onClick={togglePlay}
								className="w-7 h-7 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_10px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200"
							>
								{isPlaying ? (
									<Pause size={12} className="text-white fill-white" />
								) : (
									<Play size={12} className="text-white fill-white ml-0.5" />
								)}
							</button>
						</div>
					</div>
					<span
						className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-white"}`}
					>
						{song.title}
					</span>
				</div>

				{/* Project */}
				<div className="col-span-2 text-xs text-neutral-400 truncate">
					{song.projectName || "-"}
				</div>

				{/* State */}
				<div className="col-span-2 text-xs font-bold text-white">
					{song.state}
				</div>

				{/* Last modified */}
				<div className="col-span-2 text-xs text-neutral-400">
					{song.lastModified}
				</div>

				{/* Created */}
				<div className="col-span-2 text-xs text-neutral-400">
					{song.created}
				</div>
			</div>
		</div>
	);
};
