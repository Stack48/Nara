"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown, FolderOpen, Edit3 } from "lucide-react";
import { getProjectTitle, useProjects } from "@/lib/projectStore";
import { MenuContext } from "@/context/MenuContext";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { SongCard } from "./songCard";
import { useSelection } from "@/context/SelectionContext";
import { useApiProjects } from "@/hooks/useApiProjects";
import { Song, renameSong, getSongOrder, saveSongOrder } from "@/lib/songStore";
import { useApiProjectSongs } from "@/hooks/useApiProjectSongs";
import { Skeleton } from "@/components/ui/Skeleton";

export const insideProject = ({ isShared = false }: { isShared?: boolean }) => {
    const params = useParams();
    const projectId = (params?.id as string) || "Project";
    const { projects, loading: projectsLoading } = useApiProjects();
    const currentProject = projects.find((p) => p.id === projectId);
    
    // Resolve title dynamically from API, fallback to slug
    const displayTitle = currentProject?.title || projectId.replace(/_/g, " ");
    const [filterValue, setFilterValue] = useState<string>("all");

    // Modal & Context Menu states
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song: Song;
    } | null>(null);

    const { selectedIds, handleSelect } = useSelection();

    const { songs, loading: songsLoading } = useApiProjectSongs(projectId);

    // Custom song ordering state
    const [songsListWithPositions, setSongsListWithPositions] = useState<Song[]>([]);

    // Drag-and-drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragOverType, setDragOverType] = useState<"insert-before" | "insert-after" | "swap" | null>(null);

    const [orderTrigger, setOrderTrigger] = useState(0);

    useEffect(() => {
        const handler = () => setOrderTrigger((t) => t + 1);
        window.addEventListener("song-project-updated", handler);
        return () => window.removeEventListener("song-project-updated", handler);
    }, []);

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
    }, [songs, projectId, orderTrigger]);

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
        storageKey: `inside_project_${projectId}`,
    });

    // Drag and Drop Event Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
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

    const handleHeaderSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "alphabetical" ? "asc" : "desc");
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

    if (projectsLoading || songsLoading) {
        return (
            <div className="w-full font-arimo text-white pb-10">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-24 h-4" />
                    <span className="text-neutral-600">&gt;</span>
                    <Skeleton className="w-32 h-4" />
                </div>
                <div className="bg-gradient-to-r from-[#121212] to-[#181818] border border-neutral-800/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <Skeleton className="w-32 h-32 md:w-36 md:h-36 rounded-2xl shrink-0" />
                    <div className="flex-1 flex flex-col w-full">
                        <Skeleton className="w-16 h-5 mb-2.5 rounded" />
                        <Skeleton className="w-64 h-10 mb-2" />
                        <Skeleton className="w-full max-w-2xl h-16 mb-4" />
                        <div className="border-t border-neutral-900 pt-3.5 mt-4">
                            <Skeleton className="w-48 h-4" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="w-32 h-8" />
                    <Skeleton className="w-64 h-10 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="h-[200px] rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full font-arimo text-white pb-10">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 font-syne mb-6 text-sm">
                <Link
                    href={breadcrumbLink}
                    className="text-neutral-500 hover:text-white transition-colors"
                >
                    {breadcrumbLabel}
                </Link>
                <span className="text-neutral-600">&gt;</span>
                <span className="text-neutral-300">{displayTitle}</span>
            </div>

            {/* Project Details Banner */}
            <div className="bg-gradient-to-r from-[#121212] to-[#181818] border border-neutral-800/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden group shadow-lg">
                {/* Background Glow */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#D90097]/5 blur-3xl group-hover:bg-[#D90097]/8 transition-all duration-750 pointer-events-none" />

                {/* Project Image */}
                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl shrink-0 bg-neutral-900 flex items-center justify-center">
                    {currentProject?.image ? (
                        <img
                            src={typeof currentProject.image === "string" ? currentProject.image : currentProject.image?.src}
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <FolderOpen size={40} className="text-neutral-600" />
                    )}
                </div>

                {/* Project Info */}
                <div className="flex-1 flex flex-col justify-between w-full">
                    <div className="flex items-center gap-2 mb-2.5">
                        <span className="bg-neutral-850 text-neutral-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-neutral-805">
                            {currentProject?.type || "Project"}
                        </span>
                    </div>

                    <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white mb-2 leading-tight">
                        {displayTitle}
                    </h1>

                    {/* Project Description */}
                    <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed mb-4">
                        {currentProject?.description || (
                            <span className="text-neutral-600 italic">No description yet. Edit this project to add one.</span>
                        )}
                    </p>

                    {/* Footer Meta Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500 font-semibold border-t border-neutral-900 pt-3.5">
                        <div className="flex items-center gap-4">
                            <div>
                                Songs: <span className="text-neutral-300">{sortedProjectList.length}</span>
                            </div>
                            {currentProject?.collaboratorsList && currentProject.collaboratorsList.length > 0 && (
                                <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
                                    <span>Collaborators ({currentProject.collaboratorsList.length}):</span>
                                    <span className="text-neutral-300">
                                        {currentProject.collaboratorsList.join(", ")}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                window.dispatchEvent(
                                    new CustomEvent("open-edit-modal", {
                                        detail: {
                                            type: "project",
                                            itemId: projectId,
                                        },
                                    })
                                );
                            }}
                            className="text-xs font-bold text-[#D90097] hover:text-white transition-colors cursor-pointer border border-[#D90097]/25 hover:border-white px-3.5 py-1.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-800/40 flex items-center gap-1.5"
                        >
                            <Edit3 size={12} />
                            <span>Edit Details</span>
                        </button>
                    </div>
                </div>
            </div>

            <LibraryHeader
                title=""
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
                            onDragStart={(e) => handleDragStart(e, index)}
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
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("alphabetical")}
                            className="col-span-4 pl-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Name</span>
                            {sortBy === "alphabetical" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <div className="col-span-2">State</div>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("modified")}
                            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Last modified</span>
                            {sortBy === "modified" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("created")}
                            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Created</span>
                            {sortBy === "created" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <div className="col-span-2">Collaborators</div>
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
                                onDragStart={(e) => handleDragStart(e, index)}
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
                />
            )}
        </div>
    );
};
