"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List } from "lucide-react";
import { useSongs, Song } from "@/lib/songStore";
import { useProjects, Project } from "@/lib/projectStore";
import { SongGridItem, SongListItem } from "./Songs";
import { ContextMenu } from "./ContextMenu";
import { RenameModal } from "../modals/RenameModal";
import { RenameProjectModal } from "../modals/RenameProjectModal";
import {
    useLibrarySortAndFilter,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";

export const Favorites = () => {
    const [filterValue, setFilterValue] = useState<string>("all");

    // States for song context menu & rename
    const [songContextMenu, setSongContextMenu] = useState<{
        x: number;
        y: number;
        song: Song;
    } | null>(null);
    const [renameSongModal, setRenameSongModal] = useState<{
        songId: string;
        initialTitle: string;
    } | null>(null);

    // States for project context menu & rename
    const [projectContextMenu, setProjectContextMenu] = useState<{
        x: number;
        y: number;
        project: Project;
    } | null>(null);
    const [renameProjectModal, setRenameProjectModal] = useState<{
        projectId: string;
        initialTitle: string;
    } | null>(null);

    const allSongs = useSongs();
    const favoritesSongs = allSongs.filter(
        (song) => song.isFavorite && !song.isDeleted,
    );

    const allProjects = useProjects();
    const favoritesProjects = allProjects.filter(
        (project) => project.isFavorite && !project.isDeleted,
    );

    const handleSongContextMenu = (e: React.MouseEvent, song: Song) => {
        e.preventDefault();
        setSongContextMenu({
            x: e.clientX,
            y: e.clientY,
            song,
        });
    };

    const handleProjectContextMenu = (
        e: React.MouseEvent,
        project: Project,
    ) => {
        e.preventDefault();
        setProjectContextMenu({
            x: e.clientX,
            y: e.clientY,
            project,
        });
    };

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
    } = useLibrarySortAndFilter({
        items: [],
        searchKeys: [],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
    });

    const filteredSongs = sortItems(
        favoritesSongs.filter(
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
        favoritesProjects.filter(
            (project) =>
                project.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                project.type.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
        sortBy,
        sortOrder,
    );

    const totalFavoritesCount = filteredSongs.length + filteredProjects.length;

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title="Favorites"
                itemCount={totalFavoritesCount}
                itemLabelSingular="favorite item"
                itemLabelPlural="favorite items"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
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

            {totalFavoritesCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No favorites found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* PROJECTS SECTION */}
                    {(filterValue === "all" || filterValue === "projects") &&
                        filteredProjects.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                    Projects ({filteredProjects.length})
                                </h2>
                                {viewMode === "grid" ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                        {filteredProjects.map((project) => (
                                            <Link
                                                key={project.id}
                                                href={`/projects/${project.id}`}
                                                onContextMenu={(e) =>
                                                    handleProjectContextMenu(
                                                        e,
                                                        project,
                                                    )
                                                }
                                                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-neutral-800/80 hover:border-neutral-500 transition-colors animate-in fade-in"
                                            >
                                                <Image
                                                    src={project.image}
                                                    alt={project.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    sizes="250px"
                                                />
                                                <div className="absolute inset-0 bg-[#111111]/40 group-hover:bg-[#111111]/60 transition-colors"></div>
                                                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col">
                                                    <span className="text-[10px] font-bold text-neutral-300 tracking-wide mb-1">
                                                        {project.type} •{" "}
                                                        {project.songsCount}{" "}
                                                        songs
                                                    </span>
                                                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-[#D90097] transition-colors">
                                                        {project.title}
                                                    </h3>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full bg-[#101010] border border-neutral-900 rounded-xl p-2">
                                        <div className="flex flex-col">
                                            {filteredProjects.map(
                                                (project, index) => (
                                                    <div
                                                        key={project.id}
                                                        className="flex flex-col"
                                                    >
                                                        <Link
                                                            href={`/projects/${project.id}`}
                                                            onContextMenu={(
                                                                e,
                                                            ) =>
                                                                handleProjectContextMenu(
                                                                    e,
                                                                    project,
                                                                )
                                                            }
                                                            className="grid grid-cols-12 gap-4 items-center p-2.5 rounded-lg hover:bg-white/[3%] transition-colors cursor-pointer"
                                                        >
                                                            <div className="col-span-6 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
                                                                    <Image
                                                                        src={
                                                                            project.image
                                                                        }
                                                                        alt={
                                                                            project.title
                                                                        }
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="40px"
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-sm text-white">
                                                                    {
                                                                        project.title
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="col-span-3 text-xs text-neutral-400">
                                                                {project.type}
                                                            </div>
                                                            <div className="col-span-3 text-xs text-neutral-500 text-right pr-2">
                                                                {
                                                                    project.songsCount
                                                                }{" "}
                                                                tracks
                                                            </div>
                                                        </Link>
                                                        {index !==
                                                            filteredProjects.length -
                                                                1 && (
                                                            <div className="border-b border-neutral-900 mx-2 my-1"></div>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {/* SONGS SECTION */}
                    {(filterValue === "all" || filterValue === "songs") &&
                        filteredSongs.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                    Songs ({filteredSongs.length})
                                </h2>
                                {viewMode === "grid" ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredSongs.map((song, index) => (
                                            <SongGridItem
                                                key={song.id}
                                                song={song}
                                                index={index}
                                                onContextMenu={(e) =>
                                                    handleSongContextMenu(
                                                        e,
                                                        song,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {/* En-tête du tableau */}
                                        <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500">
                                            <div className="col-span-4 pl-2">
                                                Name
                                            </div>
                                            <div className="col-span-2">
                                                Project
                                            </div>
                                            <div className="col-span-2">
                                                State
                                            </div>
                                            <div className="col-span-2">
                                                Last modified
                                            </div>
                                            <div className="col-span-2">
                                                Created
                                            </div>
                                        </div>

                                        {/* Lignes du tableau */}
                                        <div className="flex flex-col">
                                            {filteredSongs.map(
                                                (song, index) => (
                                                    <SongListItem
                                                        key={song.id}
                                                        song={song}
                                                        index={index}
                                                        isLast={
                                                            index ===
                                                            filteredSongs.length -
                                                                1
                                                        }
                                                        onContextMenu={(e) =>
                                                            handleSongContextMenu(
                                                                e,
                                                                song,
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

            {songContextMenu && (
                <ContextMenu
                    x={songContextMenu.x}
                    y={songContextMenu.y}
                    itemType="song"
                    song={songContextMenu.song}
                    onClose={() => setSongContextMenu(null)}
                    onRenameClick={() =>
                        setRenameSongModal({
                            songId: songContextMenu.song.id,
                            initialTitle: songContextMenu.song.title,
                        })
                    }
                />
            )}

            {projectContextMenu && (
                <ContextMenu
                    x={projectContextMenu.x}
                    y={projectContextMenu.y}
                    itemType="project"
                    project={projectContextMenu.project}
                    onClose={() => setProjectContextMenu(null)}
                    onRenameClick={() =>
                        setRenameProjectModal({
                            projectId: projectContextMenu.project.id,
                            initialTitle: projectContextMenu.project.title,
                        })
                    }
                />
            )}

            {renameSongModal && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setRenameSongModal(null)}
                    songId={renameSongModal.songId}
                    initialTitle={renameSongModal.initialTitle}
                />
            )}

            {renameProjectModal && (
                <RenameProjectModal
                    isOpen={true}
                    onClose={() => setRenameProjectModal(null)}
                    projectId={renameProjectModal.projectId}
                    initialTitle={renameProjectModal.initialTitle}
                />
            )}
        </div>
    );
};
