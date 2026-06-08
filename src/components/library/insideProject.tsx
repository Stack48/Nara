"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSongs, Song, renameSong, getSongOrder, saveSongOrder } from "@/lib/songStore";
import { getProjectTitle } from "@/lib/projectStore";
import { MenuContext } from "@/context/MenuContext";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { SongCard } from "./songCard";
import { useSelection } from "@/context/SelectionContext";

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

    const { selectedIds, handleSelect } = useSelection();

    const songs = useSongs();

    // Custom song ordering state
    const [songsListWithPositions, setSongsListWithPositions] = useState<Song[]>([]);

    // Drag-and-drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragOverType, setDragOverType] = useState<"insert-before" | "insert-after" | "swap" | null>(null);

    useEffect(() => {
        const projectSongs = songs.filter(
            (song) => song.projectId === projectId,
        );
        const storedOrder = getSongOrder(projectId);

        // Filter storedOrder to remove any song IDs that are no longer in this project
        const currentSongIds = new Set(projectSongs.map((s) => s.id));
        const filteredStoredOrder = storedOrder.filter((id) =>
            currentSongIds.has(id),
        );

        // Find songs not in storedOrder
        const missingSongIds = projectSongs
            .map((s) => s.id)
            .filter((id) => !filteredStoredOrder.includes(id));

        let finalOrder = [...filteredStoredOrder];
        if (missingSongIds.length > 0) {
            finalOrder = [...finalOrder, ...missingSongIds];
            saveSongOrder(projectId, finalOrder);
        } else if (filteredStoredOrder.length !== storedOrder.length) {
            // Just clean up dead IDs if they were deleted/moved
            saveSongOrder(projectId, finalOrder);
        }

        const mapped = projectSongs.map((song) => {
            const index = finalOrder.indexOf(song.id);
            return {
                ...song,
                position: index !== -1 ? index : 99999,
            };
        });

        setSongsListWithPositions(mapped);
    }, [songs, projectId]);

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
        items: songsListWithPositions,
        searchKeys: ["title"],
        defaultSortBy: "custom",
        defaultSortOrder: "asc",
        defaultViewMode: "grid",
    });

    // Drag and Drop Event Handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Required to allow drop!
        if (draggedIndex === null) return;

        const rect = e.currentTarget.getBoundingClientRect();
        
        let type: "insert-before" | "insert-after" | "swap" = "swap";

        if (viewMode === "grid") {
            const mouseX = e.clientX - rect.left;
            const percentX = mouseX / rect.width;
            if (percentX < 0.25) {
                type = "insert-before";
            } else if (percentX > 0.75) {
                type = "insert-after";
            }
        } else {
            const mouseY = e.clientY - rect.top;
            const percentY = mouseY / rect.height;
            if (percentY < 0.25) {
                type = "insert-before";
            } else if (percentY > 0.75) {
                type = "insert-after";
            }
        }

        if (dragOverIndex !== index || dragOverType !== type) {
            setDragOverIndex(index);
            setDragOverType(type);
        }
    };

    const handleDragEnter = (index: number) => {
        setDragOverIndex(index);
    };

    const handleDragLeave = (index: number) => {
        if (dragOverIndex === index) {
            setDragOverIndex(null);
            setDragOverType(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDragOverType(null);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        setDragOverType(null);
        if (draggedIndex === null) return;

        // Get the IDs in the current displayed order
        const displayedIds = sortedProjectList.map((song) => song.id);
        const newDisplayedIds = [...displayedIds];

        if (dragOverType === "swap") {
            // Swap the two songs
            const temp = newDisplayedIds[draggedIndex];
            newDisplayedIds[draggedIndex] = newDisplayedIds[targetIndex];
            newDisplayedIds[targetIndex] = temp;
        } else if (draggedIndex !== targetIndex) {
            // Insert song
            let destIndex = targetIndex;
            if (dragOverType === "insert-after") {
                destIndex = targetIndex + 1;
            }

            const [removed] = newDisplayedIds.splice(draggedIndex, 1);
            
            // Adjust destIndex if we removed an item before it
            if (draggedIndex < destIndex) {
                destIndex -= 1;
            }
            
            newDisplayedIds.splice(destIndex, 0, removed);
        } else {
            // Dragged and dropped on itself without change
            return;
        }

        // Normalize order to ascending before saving to localStorage
        const updatedOrder = sortOrder === "desc" ? [...newDisplayedIds].reverse() : newDisplayedIds;

        // Now save this new order!
        saveSongOrder(projectId, updatedOrder);
        setDraggedIndex(null);

        // Force sort to "custom" if it wasn't already, so the user sees their changes!
        if (sortBy !== "custom") {
            setSortBy("custom");
            setSortOrder("asc");
        }
    };

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
                sortOptions={[
                    { id: "custom", label: "ID" },
                    { id: "alphabetical", label: "Alphabetical" },
                    { id: "created", label: "Date created" },
                    { id: "modified", label: "Last modified" },
                ]}
            />

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {sortedProjectList.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No tracks matching "{searchQuery}" in this project.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <SongCard
                        viewMode="grid"
                        context="insideProject"
                        isCreatePlaceholder={true}
                        projectId={projectId}
                        projectName={displayTitle}
                    />
                    {sortedProjectList.map((song, index) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            viewMode="grid"
                            context="insideProject"
                            index={song.position}
                            isSelected={selectedIds.includes(song.id)}
                            onSelect={(e) => handleSelect(song.id, "song", song, e, sortedProjectList)}
                            onContextMenu={(e) => handleContextMenu(e, song)}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragLeave={() => handleDragLeave(index)}
                            onDrop={(e) => handleDrop(e, index)}
                            isDragOver={dragOverIndex === index}
                            dragOverType={dragOverIndex === index ? dragOverType : null}
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
                        <SongCard
                            viewMode="list"
                            context="insideProject"
                            isCreatePlaceholder={true}
                            projectId={projectId}
                            projectName={displayTitle}
                        />
                        {sortedProjectList.map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                viewMode="list"
                                context="insideProject"
                                index={song.position}
                                isLast={index === sortedProjectList.length - 1}
                                isSelected={selectedIds.includes(song.id)}
                                onSelect={(e) => handleSelect(song.id, "song", song, e, sortedProjectList)}
                                onContextMenu={(e) =>
                                    handleContextMenu(e, song)
                                }
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragLeave={() => handleDragLeave(index)}
                                onDrop={(e) => handleDrop(e, index)}
                                isDragOver={dragOverIndex === index}
                                dragOverType={dragOverIndex === index ? dragOverType : null}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Custom overlays for actions */}
            {contextMenu && (
                <MenuContext
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
