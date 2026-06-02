"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Search,
    ChevronDown,
    LayoutGrid,
    List,
    Music,
    Play,
    Pause,
} from "lucide-react";
import { useAudioClick } from "@/hooks/useAudioClick";
import { useSongs, Song } from "@/lib/songStore";
import { useProjects, Project } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { Toast } from "./Toast";
import { LibraryHeader } from "./LibraryHeader";
import {
    SortByOption,
    SortOrderOption,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";

import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

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
                <div className="flex flex-col gap-8">
                    {/* PROJECTS SECTION */}
                    {(filterValue === "all" || filterValue === "projects") &&
                        filteredSharedProjects.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                    Projects ({filteredSharedProjects.length})
                                </h2>
                                {viewMode === "grid" ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredSharedProjects.map(
                                            (proj, index) => (
                                                <SharedProjectGridItem
                                                    key={proj.id}
                                                    project={proj}
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
                                        {/* En-tête uniquement s'il n'y a pas de musiques partagées, sinon on fusionne visuellement */}
                                        <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                                            <div className="col-span-5 pl-2">
                                                Name
                                            </div>
                                            <div className="col-span-2">
                                                Owner
                                            </div>
                                            <div className="col-span-2">
                                                State
                                            </div>
                                            <div className="col-span-3 text-right pr-2">
                                                Shared time
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            {filteredSharedProjects.map(
                                                (proj, index) => (
                                                    <SharedProjectListItem
                                                        key={proj.id}
                                                        project={proj}
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
                                            <SharedGridItem
                                                key={file.id}
                                                file={file}
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
                                        {filteredSharedProjects.length ===
                                            0 && (
                                            <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                                                <div className="col-span-5 pl-2">
                                                    Name
                                                </div>
                                                <div className="col-span-2">
                                                    Owner
                                                </div>
                                                <div className="col-span-2">
                                                    State
                                                </div>
                                                <div className="col-span-3 text-right pr-2">
                                                    Shared time
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            {filteredShared.map(
                                                (file, index) => (
                                                    <SharedListItem
                                                        key={file.id}
                                                        file={file}
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

const SharedGridItem = ({
    file,
    index,
    onContextMenu,
}: {
    file: Song;
    index: number;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(file.audioSrc || "", 30);

    return (
        <div
            onContextMenu={onContextMenu}
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-context-menu"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer">
                <Image
                    src={file.image}
                    alt={file.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
                {file.audioSrc && (
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
                )}
            </div>
            <div className="flex flex-col flex-1 justify-center gap-1 py-1 relative">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-white text-base line-clamp-2 leading-tight mt-1">
                            {file.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            {file.projectName || "Standalone"}
                        </p>
                    </div>
                    <span className="sm:absolute sm:top-0 sm:right-0 border border-neutral-700 text-neutral-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit">
                        {file.state}
                    </span>
                </div>
                <p className="text-[11px] text-[#D90097]">
                    Shared by {file.owner}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">
                        {file.time}
                    </span>
                    <div className="flex -space-x-2">
                        {[...Array(Math.min(file.collabs, 3))].map((_, i) => (
                            <div
                                key={i}
                                className="w-6 h-6 rounded-full overflow-hidden relative z-10"
                            >
                                <Image
                                    src={
                                        ALL_AVATARS[
                                            (index + i) % ALL_AVATARS.length
                                        ]
                                    }
                                    alt={`Collab ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SharedListItem = ({
    file,
    isLast,
    onContextMenu,
}: {
    file: Song;
    isLast: boolean;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(file.audioSrc || "", 30);

    return (
        <div className="flex flex-col">
            <div
                onContextMenu={onContextMenu}
                className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group cursor-context-menu"
            >
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 cursor-pointer">
                        <Image
                            src={file.image}
                            alt={file.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                        {file.audioSrc && (
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
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-white"}`}
                        >
                            {file.title}
                        </span>
                        <span className="text-xs text-neutral-500">
                            {file.projectName || "Standalone"}
                        </span>
                    </div>
                </div>

                <div className="col-span-2 text-xs text-white">
                    {file.owner}
                </div>

                <div className="col-span-2 text-xs font-bold text-white">
                    {file.state}
                </div>

                <div className="col-span-3 text-xs text-white text-right pr-2">
                    {file.time}
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};

const SharedProjectGridItem = ({
    project,
    onContextMenu,
}: {
    project: Project;
    onContextMenu?: React.MouseEventHandler;
}) => {
    return (
        <Link
            href={`/shared/${project.id}`}
            onContextMenu={onContextMenu}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-context-menu border border-neutral-800/80 hover:border-neutral-500 transition-colors animate-in fade-in"
        >
            <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-[#111111]/40 group-hover:bg-[#111111]/60 transition-colors"></div>

            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col pointer-events-none">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-neutral-300 tracking-wide">
                        {project.type} • {project.songsCount}{" "}
                        {project.songsCount > 1 ? "songs" : "song"}
                    </span>
                </div>
                <h3 className="font-bold text-white text-lg line-clamp-1">
                    {project.title}
                </h3>
                <p className="text-[11px] text-[#D90097] mt-1 font-semibold">
                    Shared by {project.owner}
                </p>
            </div>
        </Link>
    );
};

const SharedProjectListItem = ({
    project,
    isLast,
    onContextMenu,
}: {
    project: Project;
    isLast: boolean;
    onContextMenu?: React.MouseEventHandler;
}) => {
    return (
        <div className="flex flex-col">
            <Link
                href={`/shared/${project.id}`}
                onContextMenu={onContextMenu}
                className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group cursor-context-menu"
            >
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-white group-hover:text-[#D90097] transition-colors">
                            {project.title}
                        </span>
                        <span className="text-xs text-neutral-500">
                            {project.type} Folder
                        </span>
                    </div>
                </div>
                <div className="col-span-2 text-xs text-[#D90097] font-medium">
                    {project.owner}
                </div>
                <div className="col-span-2 text-xs font-bold text-white">
                    {project.state}
                </div>
                <div className="col-span-3 text-xs text-white text-right pr-2">
                    Just now
                </div>
            </Link>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};
