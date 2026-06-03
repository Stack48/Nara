"use client";

import { useState } from "react";
import { useSongs, Song } from "@/lib/songStore";
import { useProjects, Project } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { LibraryHeader } from "./LibraryHeader";
import {
    SortByOption,
    SortOrderOption,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { ProjectCard } from "./projectCard";
import { SongCard } from "./songCard";

export const SharedFiles = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortByOption>("modified");
    const [sortOrder, setSortOrder] = useState<SortOrderOption>("desc");
    const [filterValue, setFilterValue] = useState<string>("all");
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song?: Song;
        project?: Project;
        itemType: "song" | "project";
    } | null>(null);

    const allSongs = useSongs();
    const sharedList = allSongs.filter(
        (song) => song.isShared && !song.isDeleted,
    );

    const allProjects = useProjects();
    const sharedProjectsList = allProjects.filter(
        (proj) => proj.isShared && !proj.isDeleted,
    );

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

    return (
        <div className="w-full font-arimo text-white pb-10">
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

            {totalSharedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No shared files found.</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* Unique En-tête du tableau en haut en mode Liste */}
                    {viewMode === "list" && (
                        <div className="grid grid-cols-12 gap-4 pb-4 mb-6 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                            <div className="col-span-3 pl-2">Name</div>
                            <div className="col-span-2">Owner</div>
                            <div className="col-span-1">State</div>
                            <div className="col-span-2">Last modified</div>
                            <div className="col-span-2">Created</div>
                            <div className="col-span-2">Collaborators</div>
                        </div>
                    )}
                    <div className="flex flex-col gap-8">
                        {/* PROJECTS SECTION */}
                        {(filterValue === "all" || filterValue === "projects") &&
                            filteredSharedProjects.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                        Projects ({filteredSharedProjects.length})
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {filteredSharedProjects.map(
                                                (proj, index) => (
                                                    <ProjectCard
                                                        key={proj.id}
                                                        project={proj}
                                                        viewMode="grid"
                                                        context="shared"
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
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
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
                <ContextMenu
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
