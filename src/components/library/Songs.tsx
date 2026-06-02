"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";

import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const Songs = () => {
    // État pour le filtrage par origine (standalone ou projet)
    const [filterOrigin, setFilterOrigin] = useState<
        "all" | "standalone" | "project"
    >("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

    const getFilterLabel = () => {
        if (filterOrigin === "all") return "All songs";
        if (filterOrigin === "standalone") return "Standalone";
        return "In a project";
    };

    const allSongs = useSongs();

    // Pre-filtrer par "origin" et supprimer les deleted
    const preFilteredSongs = allSongs.filter((song) => {
        if (song.isDeleted) return false;
        if (filterOrigin === "all") return true;
        return song.origin === filterOrigin;
    });

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        filteredAndSortedItems: sortedSongsList,
    } = useLibrarySortAndFilter({
        items: preFilteredSongs,
        searchKeys: ["title", "projectName"],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
    });

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song: Song;
    } | null>(null);
    const [renameModal, setRenameModal] = useState<{
        songId: string;
        initialTitle: string;
    } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, song: Song) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            song,
        });
    };

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title="All songs"
                itemCount={sortedSongsList.length}
                itemLabelSingular="song"
                itemLabelPlural="songs"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
            >
                {/* Extra Filter: Dropdown Filtre Origine */}
                <div className="relative" ref={filterMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className="flex items-center gap-2 bg-[#151515] border border-neutral-800 hover:border-neutral-700 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                    >
                        <span>{getFilterLabel()}</span>
                        <ChevronDown size={14} className="text-neutral-400" />
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
            </LibraryHeader>

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
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <div className="col-span-3 pl-2">Name</div>
                        <div className="col-span-2">Project</div>
                        <div className="col-span-1">State</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2">Collaborators</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        {sortedSongsList.map((song, index) => (
                            <SongListItem
                                key={song.id}
                                song={song}
                                index={index}
                                isLast={index === sortedSongsList.length - 1}
                                onContextMenu={(e) =>
                                    handleContextMenu(e, song)
                                }
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
                    itemType="song"
                    song={contextMenu.song}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() =>
                        setRenameModal({
                            songId: contextMenu.song.id,
                            initialTitle: contextMenu.song.title,
                        })
                    }
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
        </div>
    );
};

// --- Sous-composants pour gérer les hooks individuellement ---

export const SongGridItem = ({
    song,
    index,
    onContextMenu,
}: {
    song: any;
    index: number;
    onContextMenu?: React.MouseEventHandler;
}) => {
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
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-grab active:cursor-grabbing group animate-in fade-in"
            draggable={true}
            onDragStart={handleDragStart}
            onContextMenu={onContextMenu}
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer">
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
                        className={`w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                    >
                        {isPlaying ? (
                            <Pause
                                size={16}
                                className="text-white fill-white"
                            />
                        ) : (
                            <Play
                                size={16}
                                className="text-white fill-white ml-0.5"
                            />
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
                            <Link
                                href={`/projects/${song.projectId}`}
                                className="text-[10px] text-neutral-500 font-semibold tracking-wider mt-0.5 block hover:text-white hover:underline transition-colors w-fit pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {song.projectName}
                            </Link>
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
                        {song.collabs > 0 && (
                            <span className="text-[10px] text-neutral-500 hidden sm:block">
                                Collaborators ({song.collabs})
                            </span>
                        )}
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

export const SongListItem = ({
    song,
    index,
    isLast,
    onContextMenu,
}: {
    song: any;
    index: number;
    isLast: boolean;
    onContextMenu?: React.MouseEventHandler;
}) => {
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
                <div className="col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 cursor-pointer">
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
                                className={`w-7 h-7 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_10px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                            >
                                {isPlaying ? (
                                    <Pause
                                        size={12}
                                        className="text-white fill-white"
                                    />
                                ) : (
                                    <Play
                                        size={12}
                                        className="text-white fill-white ml-0.5"
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                    <span
                        className={`font-bold text-sm transition-colors line-clamp-1 ${isPlaying ? "text-[#D90097]" : "text-white"}`}
                    >
                        {song.title}
                    </span>
                </div>

                {/* Project */}
                <div className="col-span-2 text-xs text-neutral-400 truncate">
                    {song.projectId ? (
                        <Link
                            href={`/projects/${song.projectId}`}
                            className="hover:text-white hover:underline transition-colors block truncate w-full"
                        >
                            {song.projectName}
                        </Link>
                    ) : (
                        "-"
                    )}
                </div>

                {/* State */}
                <div className="col-span-1 text-xs font-bold text-white">
                    {song.state}
                </div>

                {/* Last modified */}
                <div className="col-span-2 text-xs text-neutral-400 truncate">
                    {song.lastModified}
                </div>

                {/* Created */}
                <div className="col-span-2 text-xs text-neutral-400 truncate">
                    {song.created}
                </div>

                {/* Collaborators */}
                <div className="col-span-2 flex items-center">
                    {song.collabs > 0 ? (
                        <div className="flex -space-x-1.5">
                            {[...Array(Math.min(song.collabs, 3))].map(
                                (_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                    >
                                        <Image
                                            src={
                                                ALL_AVATARS[
                                                    (index + i) %
                                                        ALL_AVATARS.length
                                                ]
                                            }
                                            alt="Collab"
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                        />
                                    </div>
                                ),
                            )}
                            {song.collabs > 3 && (
                                <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                    +{song.collabs - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-neutral-600">-</span>
                    )}
                </div>
            </div>
        </div>
    );
};
