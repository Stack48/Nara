"use client";

import { useState, useEffect } from "react";
import { useSongs, setSongDeleted, Song } from "@/lib/songStore";
import { useProjects, setProjectDeleted, Project } from "@/lib/projectStore";
import { useSelection } from "@/context/SelectionContext";
import { MenuContext } from "@/context/MenuContext";

import { LibraryHeader } from "./LibraryHeader";
import {
    SortByOption,
    SortOrderOption,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { ProjectCard } from "./projectCard";
import { SongCard } from "./songCard";

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

    const allSongs = useSongs();
    const deletedSongs = allSongs.filter((song) => song.isDeleted);

    const allProjects = useProjects();
    const deletedProjects = allProjects.filter((proj) => proj.isDeleted);

    const handleSongRestore = (songId: string, songTitle: string) => {
        setSongDeleted(songId, false);
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `"${songTitle}" has been restored.` },
            }),
        );
    };

    const handleProjectRestore = (projectId: string, projectTitle: string) => {
        setProjectDeleted(projectId, false);
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `Project "${projectTitle}" has been restored.`,
                },
            }),
        );
    };

    const handlePermanentDelete = (title: string) => {
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `"${title}" permanently deleted.` },
            }),
        );
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
        <div className="w-full font-arimo text-white pb-10">
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

            {totalDeletedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>Trash is empty.</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* Unique En-tête du tableau en haut en mode Liste */}
                    {viewMode === "list" && (
                        <div className="grid grid-cols-12 gap-4 pb-4 mb-6 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                            <div className="col-span-4 pl-2">Name</div>
                            <div className="col-span-3">Deleted time</div>
                            <div className="col-span-3">Collaborators</div>
                            <div className="col-span-2 text-right pr-2">Actions</div>
                        </div>
                    )}
                    <div className="flex flex-col gap-8">
                        {/* DELETED PROJECTS */}
                        {(filterValue === "all" || filterValue === "projects") &&
                            filteredProjects.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
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
                                                    onPermanentDelete={
                                                        handlePermanentDelete
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
                                                            onPermanentDelete={
                                                                handlePermanentDelete
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
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
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
                                                        handlePermanentDelete(title)
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
                                                                    title,
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
                        handlePermanentDelete(title);
                    }}
                />
            )}
        </div>
    );
};
