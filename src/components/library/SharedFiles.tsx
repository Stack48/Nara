"use client";

import { useState, useEffect } from "react";
import { useSongs, Song } from "@/lib/songStore";
import { useProjects, Project } from "@/lib/projectStore";
import { MenuContext } from "@/context/MenuContext";
import { LibraryHeader } from "./LibraryHeader";
import { useSelection } from "@/context/SelectionContext";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useApiProjects } from "@/hooks/useApiProjects";
import { useApiSongs } from "@/hooks/useApiSongs";
import { SkeletonGrid, SkeletonList } from "@/components/ui/SkeletonCard";
import {
    SortByOption,
    SortOrderOption,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { ProjectCard } from "./projectCard";
import { SongCard } from "./songCard";

export const SharedFiles = () => {
    const [viewMode, setViewModeState] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortByOption>("modified");
    const [sortOrder, setSortOrder] = useState<SortOrderOption>("desc");
    const [filterValue, setFilterValue] = useState<string>("all");

    const setViewMode = (mode: "grid" | "list") => {
        setViewModeState(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("nara_view_mode_shared", mode);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem("nara_view_mode_shared");
        if (stored === "grid" || stored === "list") {
            setViewModeState(stored);
        }
    }, []);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song?: Song;
        project?: Project;
        itemType: "song" | "project";
    } | null>(null);

    const { selectedIds, handleSelect } = useSelection();

    const { songs: allSongs, loading: loadingSongs } = useApiSongs();
    const sharedList = allSongs.filter(
        (song) => song.isShared && !song.isDeleted,
    );

    const { projects: allProjects, loading: loadingProjects } = useApiProjects();
    const sharedProjectsList = allProjects.filter(
        (proj) => proj.isShared && !proj.isDeleted,
    );
    
    const loading = loadingSongs || loadingProjects;

    const handleHeaderSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "alphabetical" ? "asc" : "desc");
        }
    };

    const handleContextMenu = (
        e: React.MouseEvent,
        item: any,
        itemType: "song" | "project",
    ) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            song: itemType === "song" ? item : undefined,
            project: itemType === "project" ? item : undefined,
            itemType,
        });
    };

    const filteredShared = sortItems(
        sharedList.filter(
            (song) =>
                song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (song.owner &&
                    song.owner
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())) ||
                (song.projectName &&
                    song.projectName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())),
        ),
        sortBy,
        sortOrder,
    );

    const filteredSharedProjects = sortItems(
        sharedProjectsList.filter(
            (proj) =>
                proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (proj.owner &&
                    proj.owner
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())),
        ),
        sortBy,
        sortOrder,
    );

    const totalSharedCount =
        filteredShared.length + filteredSharedProjects.length;
    const combinedViewItems = [...filteredSharedProjects, ...filteredShared];

    return (
        <div className="w-full font-arimo text-n-text pb-10 min-h-[600px]">
            <LibraryHeader
                title="Shared with me"
                itemCount={totalSharedCount}
                itemLabelSingular="shared item"
                itemLabelPlural="shared items"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                sortOptions={[
                    { id: "alphabetical", label: "Alphabetical" },
                    { id: "owner", label: "Created by" },
                    { id: "modified", label: "Last modified" },
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
                viewMode === "grid" ? <SkeletonGrid type="song" /> : <SkeletonList />
            ) : totalSharedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-n-text-2 border border-n-border/80 rounded-2xl bg-n-surface border-dashed">
                    <p>No shared files found.</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* Unique En-tête du tableau en haut en mode Liste */}
                    {viewMode === "list" && (
                        <div className="grid grid-cols-12 gap-4 pb-4 mb-6 text-xs font-medium text-n-text-2 border-b border-n-border">
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("alphabetical")}
                                className="col-span-3 pl-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Name</span>
                                {sortBy === "alphabetical" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("owner")}
                                className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Owner</span>
                                {sortBy === "owner" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <div className="col-span-1">State</div>
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("modified")}
                                className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Last modified</span>
                                {sortBy === "modified" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleHeaderSort("created")}
                                className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                            >
                                <span>Created</span>
                                {sortBy === "created" && (
                                    sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                            </button>
                            <div className="col-span-2">Collaborators</div>
                        </div>
                    )}
                    <div className="flex flex-col gap-8">
                        {/* PROJECTS SECTION */}
                        {(filterValue === "all" || filterValue === "projects") &&
                            filteredSharedProjects.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                        Projects ({filteredSharedProjects.length})
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                            {filteredSharedProjects.map(
                                                (proj, index) => (
                                                    <ProjectCard
                                                        key={proj.id}
                                                        project={proj}
                                                        viewMode="grid"
                                                        context="shared"
                                                        isSelected={selectedIds.includes(proj.id)}
                                                        onSelect={(e) => handleSelect(proj.id, "project", proj, e, combinedViewItems)}
                                                        onContextMenu={(e) =>
                                                            handleContextMenu(
                                                                e,
                                                                proj,
                                                                "project",
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex flex-col">
                                                {filteredSharedProjects.map(
                                                    (proj, index) => (
                                                        <ProjectCard
                                                            key={proj.id}
                                                            project={proj}
                                                            viewMode="list"
                                                            context="shared"
                                                            index={index}
                                                            isLast={
                                                                index ===
                                                                filteredSharedProjects.length -
                                                                1
                                                            }
                                                            isSelected={selectedIds.includes(proj.id)}
                                                            onSelect={(e) => handleSelect(proj.id, "project", proj, e, combinedViewItems)}
                                                            onContextMenu={(e) =>
                                                                handleContextMenu(
                                                                    e,
                                                                    proj,
                                                                    "project",
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* SONGS SECTION */}
                        {(filterValue === "all" || filterValue === "songs") &&
                            filteredShared.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-n-text-2 mb-4 font-serif">
                                        Songs ({filteredShared.length})
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filteredShared.map((file, index) => (
                                                <SongCard
                                                    key={file.id}
                                                    song={file}
                                                    viewMode="grid"
                                                    context="shared"
                                                    index={index}
                                                    isSelected={selectedIds.includes(file.id)}
                                                    onSelect={(e) => handleSelect(file.id, "song", file, e, combinedViewItems)}
                                                    onContextMenu={(e) =>
                                                        handleContextMenu(
                                                            e,
                                                            file,
                                                            "song",
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex flex-col">
                                                {filteredShared.map(
                                                    (file, index) => (
                                                        <SongCard
                                                            key={file.id}
                                                            song={file}
                                                            viewMode="list"
                                                            context="shared"
                                                            index={index}
                                                            isLast={
                                                                index ===
                                                                filteredShared.length -
                                                                1
                                                            }
                                                            isSelected={selectedIds.includes(file.id)}
                                                            onSelect={(e) => handleSelect(file.id, "song", file, e, combinedViewItems)}
                                                            onContextMenu={(e) =>
                                                                handleContextMenu(
                                                                    e,
                                                                    file,
                                                                    "song",
                                                                )
                                                            }
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
                    context="shared"
                    itemType={contextMenu.itemType}
                    song={contextMenu.song}
                    project={contextMenu.project}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};
