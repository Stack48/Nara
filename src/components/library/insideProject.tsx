"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSongs, Song, renameSong } from "@/lib/songStore";
import { getProjectTitle } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { SongCard } from "./songCard";

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
            />

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {sortedProjectList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No tracks in this project yet.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedProjectList.map((song, index) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            viewMode="grid"
                            context="insideProject"
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
                            <SongCard
                                key={song.id}
                                song={song}
                                viewMode="list"
                                context="insideProject"
                                index={index}
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
                    title="Rename song"
                    label="Song Title"
                    placeholder="Enter song title"
                    initialValue={renameModal.initialTitle}
                    onSave={(newValue) => {
                        renameSong(renameModal.songId, newValue);
                        window.dispatchEvent(
                            new CustomEvent("show-nara-toast", {
                                detail: {
                                    message: `Song renamed to "${newValue}"`,
                                },
                            }),
                        );
                    }}
                />
            )}
        </div>
    );
};
