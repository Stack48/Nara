"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List } from "lucide-react";
import { useSongs, Song, renameSong } from "@/lib/songStore";
import { useProjects, Project, renameProject } from "@/lib/projectStore";
import { ProjectCard } from "./projectCard";
import { SongCard } from "./songCard";
import { MenuContext } from "@/context/MenuContext";
import { RenameModal } from "../modals/RenameModal";
import { useSelection } from "@/context/SelectionContext";

import {
    useLibrarySortAndFilter,
    sortItems,
} from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";

export const Recents = () => {
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

    const { selectedIds, handleSelect } = useSelection();

    const allSongs = useSongs();
    const activeSongs = allSongs.filter((song) => !song.isDeleted);

    const allProjects = useProjects();
    const activeProjects = allProjects.filter((project) => !project.isDeleted);

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
        storageKey: "recents",
    });

    const filteredSongs = sortItems(
        activeSongs.filter(
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
        activeProjects.filter(
            (project) =>
                project.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                project.type.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
        sortBy,
        sortOrder,
    );

    const totalRecentsCount = filteredSongs.length + filteredProjects.length;
    const combinedViewItems = [...filteredProjects, ...filteredSongs];

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title="Recents"
                itemCount={totalRecentsCount}
                itemLabelSingular="active item"
                itemLabelPlural="active items"
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

            {totalRecentsCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No recent activity found.</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* Unique En-tête du tableau en haut en mode Liste */}
                    {viewMode === "list" && (
                        <div className="grid grid-cols-12 gap-4 pb-4 mb-6 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                            <div className="col-span-4 pl-2">Name</div>
                            <div className="col-span-2">State</div>
                            <div className="col-span-2">Last modified</div>
                            <div className="col-span-2">Created</div>
                            <div className="col-span-2">Collaborators</div>
                        </div>
                    )}
                    <div className="flex flex-col gap-8">
                        {/* RECENT PROJECTS */}
                        {(filterValue === "all" || filterValue === "projects") &&
                            filteredProjects.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                        Recent Projects
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                            {filteredProjects.map((project) => (
                                                <ProjectCard
                                                    key={project.id}
                                                    project={project}
                                                    viewMode="grid"
                                                    context="recent"
                                                    isSelected={selectedIds.includes(project.id)}
                                                    onSelect={(e) => handleSelect(project.id, "project", project, e, combinedViewItems)}
                                                    onContextMenu={(e) =>
                                                        handleProjectContextMenu(
                                                            e,
                                                            project,
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {filteredProjects.map(
                                                (project, index) => (
                                                    <ProjectCard
                                                        key={project.id}
                                                        project={project}
                                                        viewMode="list"
                                                        context="recent"
                                                        index={index}
                                                        isLast={
                                                            index ===
                                                            filteredProjects.length -
                                                                1
                                                        }
                                                        isSelected={selectedIds.includes(project.id)}
                                                        onSelect={(e) => handleSelect(project.id, "project", project, e, combinedViewItems)}
                                                        onContextMenu={(e) =>
                                                            handleProjectContextMenu(
                                                                e,
                                                                project,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* RECENT SONGS */}
                        {(filterValue === "all" || filterValue === "songs") &&
                            filteredSongs.length > 0 && (
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                        Recent Songs
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filteredSongs.map((song, index) => (
                                                <SongCard
                                                    key={song.id}
                                                    song={song}
                                                    viewMode="grid"
                                                    context="recent"
                                                    index={index}
                                                    isSelected={selectedIds.includes(song.id)}
                                                    onSelect={(e) => handleSelect(song.id, "song", song, e, combinedViewItems)}
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
                                        <div className="flex flex-col">
                                            {filteredSongs.map(
                                                (song, index) => (
                                                    <SongCard
                                                        key={song.id}
                                                        song={song}
                                                        viewMode="list"
                                                        context="recent"
                                                        index={index}
                                                        isLast={
                                                            index ===
                                                            filteredSongs.length -
                                                                1
                                                        }
                                                        isSelected={selectedIds.includes(song.id)}
                                                        onSelect={(e) => handleSelect(song.id, "song", song, e, combinedViewItems)}
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
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            )}

            {songContextMenu && (
                <MenuContext
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
                <MenuContext
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
                    title="Rename song"
                    label="Song Title"
                    placeholder="Enter song title"
                    initialValue={renameSongModal.initialTitle}
                    onSave={(newValue) => {
                        renameSong(renameSongModal.songId, newValue);
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

            {renameProjectModal && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setRenameProjectModal(null)}
                    title="Rename project folder"
                    label="Project Name"
                    placeholder="Enter project name"
                    initialValue={renameProjectModal.initialTitle}
                    onSave={(newValue) => {
                        renameProject(renameProjectModal.projectId, newValue);
                        window.dispatchEvent(
                            new CustomEvent("show-nara-toast", {
                                detail: {
                                    message: `Project renamed to "${newValue}"`,
                                },
                            }),
                        );
                    }}
                />
            )}
        </div>
    );
};
