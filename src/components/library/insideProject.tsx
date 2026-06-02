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
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAudioClick } from "@/hooks/useAudioClick";
import { useSongs, Song } from "@/lib/songStore";
import { getProjectTitle } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";

import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const insideProject = ({ isShared = false }: { isShared?: boolean }) => {
    const params = useParams();
    const projectId = (params?.id as string) || "Project";
    // Resolve title dynamically from store, fallback to slug
    const displayTitle =
        getProjectTitle(projectId) || projectId.replace(/_/g, " ");
    const [filterValue, setFilterValue] = useState<string>("all");

    // Modal & Context Menu states
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song: Song;
    } | null>(null);
    const [renameModal, setRenameModal] = useState<{
        songId: string;
        initialTitle: string;
    } | null>(null);

    const songs = useSongs();
    const insideProjectList = songs.filter(
        (song) => song.projectId === projectId,
    );

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        filteredAndSortedItems: sortedProjectList,
    } = useLibrarySortAndFilter({
        items: insideProjectList,
        searchKeys: ["title"],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
    });

    const handleContextMenu = (e: React.MouseEvent, song: Song) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            song,
        });
    };

    const breadcrumbLabel = isShared ? "Shared with me" : "My Projects";
    const breadcrumbLink = isShared ? "/shared" : "/projects";

    const titleNode = (
        <div className="flex items-center gap-2 font-syne">
            <Link
                href={breadcrumbLink}
                className="text-neutral-500 hover:text-white transition-colors"
            >
                {breadcrumbLabel}
            </Link>
            <span className="text-neutral-600 text-lg">&gt;</span>
            <span className="text-white">{displayTitle}</span>
        </div>
    );

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title={titleNode}
                itemCount={sortedProjectList.length}
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
                /*
                 * Commenté car la structure actuelle ne supporte pas les sous-projets (dossiers dans des dossiers).
                 * À décommenter si on ajoute `parentId` dans `schema.prisma` et qu'on récupère les sous-projets ici.
                 *
                filterLabel="Filter by type"
                filterOptions={[
                    { id: "all", label: "All" },
                    { id: "projects", label: "Projects" },
                    { id: "songs", label: "Songs" },
                ]}
                filterValue={filterValue}
                setFilterValue={setFilterValue}
                */
            />

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {sortedProjectList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No tracks in this project yet.</p>
                </div>
            ) : /* filterValue === "projects" ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No projects found inside this project.</p>
                </div>
            ) : */ viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedProjectList.map((song, index) => (
                        <ProjectGridItem
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
                        <div className="col-span-5 pl-2">Name</div>
                        <div className="col-span-2">State</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-3">Created</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        {sortedProjectList.map((song, index) => (
                            <ProjectListItem
                                key={song.id}
                                song={song}
                                isLast={index === sortedProjectList.length - 1}
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

const ProjectGridItem = ({
    song,
    index,
    onContextMenu,
}: {
    song: Song;
    index: number;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(song.audioSrc, 30);

    return (
        <div
            onContextMenu={onContextMenu}
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-context-menu"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer">
                <Image
                    src={song.image}
                    alt={song.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
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
                    <h3 className="font-bold text-white text-base line-clamp-2 leading-tight pr-2 sm:pr-10 mt-1">
                        {song.title}
                    </h3>
                    <span
                        className={`sm:absolute sm:top-0 sm:right-0 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit ${
                            song.title === "F.I.C.O."
                                ? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
                                : "border border-neutral-700 text-neutral-400"
                        }`}
                    >
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

const ProjectListItem = ({
    song,
    isLast,
    onContextMenu,
}: {
    song: Song;
    isLast: boolean;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(song.audioSrc, 30);

    return (
        <div className="flex flex-col" onContextMenu={onContextMenu}>
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group cursor-context-menu">
                <div className="col-span-5 flex items-center gap-4">
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
                        className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-white"}`}
                    >
                        {song.title}
                    </span>
                </div>
                <div className="col-span-2 text-xs font-bold">
                    {song.title === "F.I.C.O." ? (
                        <span className="bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] inline-block">
                            {song.state}
                        </span>
                    ) : (
                        <span className="text-white">{song.state}</span>
                    )}
                </div>
                <div className="col-span-2 text-xs text-neutral-400">
                    {song.lastModified}
                </div>
                <div className="col-span-3 text-xs text-neutral-400">
                    {song.created}
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};
