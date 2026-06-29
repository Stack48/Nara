"use client";

import { useState, useEffect } from "react";
import { useSongs, setSongDeleted, Song, deleteSongPermanently } from "@/lib/songStore";
import { useProjects, setProjectDeleted, Project, deleteProjectPermanently } from "@/lib/projectStore";
import { useSelection } from "@/context/SelectionContext";
import { MenuContext } from "@/context/MenuContext";
import { ChevronUp, ChevronDown } from "lucide-react";

import { LibraryHeader } from "./LibraryHeader";
import {
    SortByOption,
    SortOrderOption,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { ProjectCard } from "./projectCard";
import { SongCard } from "./songCard";
import { useApiSongs } from "@/hooks/useApiSongs";
import { useApiProjects } from "@/hooks/useApiProjects";
import { SkeletonGrid, SkeletonList } from "@/components/ui/SkeletonCard";
import { DeletedFiles } from "@/components/library/trash/DeletedFiles";

export const Deleted = () => {
    const [viewMode, setViewModeState] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortByOption>("modified");
    const [sortOrder, setSortOrder] = useState<SortOrderOption>("desc");
    const [filterValue, setFilterValue] = useState<string>("all");

    const setViewMode = (mode: "grid" | "list") => {
        setViewModeState(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("nara_view_mode_deleted", mode);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem("nara_view_mode_deleted");
        if (stored === "grid" || stored === "list") {
            setViewModeState(stored);
        }
    }, []);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        itemType: "song" | "project";
        itemId: string;
        itemTitle: string;
    } | null>(null);

    const { selectedIds, handleSelect } = useSelection();

    const { songs: allSongs, loading: loadingSongs } = useApiSongs();
    const deletedSongs = allSongs.filter((song) => song.isDeleted);

    const { projects: allProjects, loading: loadingProjects } = useApiProjects();
    const deletedProjects = allProjects.filter((proj) => proj.isDeleted);
    
    const loading = loadingSongs || loadingProjects;

    const handleSongRestore = async (songId: string, songTitle: string) => {
        try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const user = await getCurrentUser();
            await fetch(`/api/songs/${songId}/delete`, {
                method: "PATCH",
                headers: { "x-cognito-id": user.userId },
            });
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: `"${songTitle}" has been restored.` },
            }));
            window.dispatchEvent(new CustomEvent("nara-data-updated"));
        } catch (err) {
            console.error("Restore error:", err);
        }
    };

    const handleProjectRestore = async (projectId: string, projectTitle: string) => {
        try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const user = await getCurrentUser();
            await fetch(`/api/projects/${projectId}/delete`, {
                method: "PATCH",
                headers: { "x-cognito-id": user.userId },
            });
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: `Project "${projectTitle}" has been restored.` },
            }));
            window.dispatchEvent(new CustomEvent("nara-data-updated"));
        } catch (err) {
            console.error("Restore error:", err);
        }
    };

    const handlePermanentDelete = async (id: string, title: string, type: "song" | "project") => {
        try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const user = await getCurrentUser();
            const endpoint = type === "song"
                ? `/api/songs/${id}`
                : `/api/projects/${id}`;

            await fetch(endpoint, {
                method: "DELETE",
                headers: { "x-cognito-id": user.userId },
            });
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: `"${title}" permanently deleted.` },
            }));
            window.dispatchEvent(new CustomEvent("nara-data-updated"));
        } catch (err) {
            console.error("Permanent delete error:", err);
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

    const handleSongContextMenu = (e: React.MouseEvent, song: Song) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            itemType: "song",
            itemId: song.id,
            itemTitle: song.title,
        });
    };

    const handleProjectContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            itemType: "project",
            itemId: project.id,
            itemTitle: project.title,
        });
    };

    const filteredSongs = sortItems(
        deletedSongs.filter(
            (song) =>
                song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (song.projectName &&
                    song.projectName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())),
        ),
        sortBy,
        sortOrder,
    );

    const filteredProjects = sortItems(
        deletedProjects.filter(
            (proj) =>
                proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                proj.type.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
        sortBy,
        sortOrder,
    );

    const totalDeletedCount = filteredSongs.length + filteredProjects.length;
    const combinedViewItems = [...filteredProjects, ...filteredSongs];

    return (
        <div className="w-full font-arimo text-n-text pb-10 min-h-[600px]">
            <LibraryHeader
                title="Deleted files"
                itemCount={totalDeletedCount}
                itemLabelSingular="deleted item"
                itemLabelPlural="deleted items"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                sortOptions={[
                    { id: "alphabetical", label: "Alphabetical" },
                    { id: "owner", label: "Created by" },
                    { id: "modified", label: "Date trashed" },
                ]}
                viewMode={viewMode}
                setViewMode={setViewMode}
                filterLabel="Filter by type"
                filterOptions={[
                    { id: "all", label: "All" },
                    { id: "projects", label: "Projects" },
                    { id: "songs", label: "Songs" },
                ]}
                filterValue={filterValue}
                setFilterValue={setFilterValue}
            />

            {loading ? (
                <div className="flex flex-col gap-8 w-full">
                    {(filterValue === "all" || filterValue === "projects") && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                Projects
                            </h2>
                            {viewMode === "grid" ? <SkeletonGrid type="project" count={5} /> : <SkeletonList count={3} />}
                        </div>
                    )}
                    {(filterValue === "all" || filterValue === "songs") && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                Songs
                            </h2>
                            {viewMode === "grid" ? <SkeletonGrid type="song" count={4} /> : <SkeletonList count={4} />}
                        </div>
                    )}
                </div>
            ) : totalDeletedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-n-text-2 border border-n-border/80 rounded-2xl bg-n-surface border-dashed">
                    <p>Trash is empty.</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* Unique En-tête du tableau en haut en mode Liste */}
                    {viewMode === "list" && (
                        <div className="grid grid-cols-12 gap-4 pb-4 mb-6 text-xs font-medium text-n-text-2 border-b border-n-border">
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("alphabetical")}
                                className="col-span-4 pl-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Name</span>
                                {sortBy === "alphabetical" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("modified")}
                                className="col-span-3 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Deleted time</span>
                                {sortBy === "modified" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <div className="col-span-3">Collaborators</div>
                            <div className="col-span-2 text-right pr-2">Actions</div>
                        </div>
                    )}
                    <div className="flex flex-col gap-8">
                        {/* DELETED PROJECTS */}
                        {(filterValue === "all" || filterValue === "projects") &&
                            filteredProjects.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                        Projects ({filteredProjects.length})
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                            {filteredProjects.map((project) => (
                                                <ProjectCard
                                                    key={project.id}
                                                    project={project}
                                                    viewMode="grid"
                                                    context="deleted"
                                                    isSelected={selectedIds.includes(project.id)}
                                                    onSelect={(e) => handleSelect(project.id, "project", project, e, combinedViewItems)}
                                                    onRestore={handleProjectRestore}
                                                    onPermanentDelete={(id, title) =>
                                                        handlePermanentDelete(id, title, "project")
                                                    }
                                                    onContextMenu={(e) => handleProjectContextMenu(e, project)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex flex-col">
                                                {filteredProjects.map(
                                                    (project, index) => (
                                                        <ProjectCard
                                                            key={project.id}
                                                            project={project}
                                                            viewMode="list"
                                                            context="deleted"
                                                            index={index}
                                                            isLast={
                                                                index ===
                                                                filteredProjects.length -
                                                                1
                                                            }
                                                            isSelected={selectedIds.includes(project.id)}
                                                            onSelect={(e) => handleSelect(project.id, "project", project, e, combinedViewItems)}
                                                            onRestore={
                                                                handleProjectRestore
                                                            }
                                                            onPermanentDelete={(id, title) =>
                                                                handlePermanentDelete(id, title, "project")
                                                            }
                                                            onContextMenu={(e) => handleProjectContextMenu(e, project)}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* DELETED SONGS */}
                        {(filterValue === "all" || filterValue === "songs") &&
                            filteredSongs.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                        Songs ({filteredSongs.length})
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filteredSongs.map((song, index) => (
                                                <SongCard
                                                    key={song.id}
                                                    song={song}
                                                    viewMode="grid"
                                                    context="deleted"
                                                    index={index}
                                                    isSelected={selectedIds.includes(song.id)}
                                                    onSelect={(e) => handleSelect(song.id, "song", song, e, combinedViewItems)}
                                                    onRestore={handleSongRestore}
                                                    onPermanentDelete={(
                                                        id,
                                                        title,
                                                    ) =>
                                                        handlePermanentDelete(id, title, "song")
                                                    }
                                                    onContextMenu={(e) => handleSongContextMenu(e, song)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex flex-col">
                                                {filteredSongs.map(
                                                    (song, index) => (
                                                        <SongCard
                                                            key={song.id}
                                                            song={song}
                                                            viewMode="list"
                                                            context="deleted"
                                                            index={index}
                                                            isLast={
                                                                index ===
                                                                filteredSongs.length -
                                                                1
                                                            }
                                                            isSelected={selectedIds.includes(song.id)}
                                                            onSelect={(e) => handleSelect(song.id, "song", song, e, combinedViewItems)}
                                                            onRestore={
                                                                handleSongRestore
                                                            }
                                                            onPermanentDelete={(
                                                                id,
                                                                title,
                                                            ) =>
                                                                handlePermanentDelete(
                                                                    id,
                                                                    title,
                                                                    "song",
                                                                )
                                                            }
                                                            onContextMenu={(e) => handleSongContextMenu(e, song)}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            )}
             <div className="mt-10">
                <DeletedFiles />
            </div>

            {contextMenu && (
                <MenuContext
                    x={contextMenu.x}
                    y={contextMenu.y}
                    context="trash"
                    itemType={contextMenu.itemType}
                    itemId={contextMenu.itemId}
                    itemTitle={contextMenu.itemTitle}
                    onClose={() => setContextMenu(null)}
                    onRestore={(id, title) => {
                        if (contextMenu.itemType === "song") {
                            handleSongRestore(id, title);
                        } else {
                            handleProjectRestore(id, title);
                        }
                    }}
                    onPermanentDelete={(id, title) => {
                        handlePermanentDelete(id, title, contextMenu.itemType);
                    }}
                />
            )}
        </div>
    );
};
