"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Search,
    LayoutGrid,
    List,
    RotateCcw,
    Trash2,
    Music,
    Play,
    Pause,
} from "lucide-react";
import { useAudioClick } from "@/hooks/useAudioClick";
import { useSongs, setSongDeleted, Song } from "@/lib/songStore";
import { useProjects, setProjectDeleted, Project } from "@/lib/projectStore";
import { TrashContextMenu } from "./TrashContextMenu";
import { Toast } from "./Toast";

export const Deleted = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        itemId: string;
        itemTitle: string;
        itemType: "song" | "project";
    } | null>(null);

    const allSongs = useSongs();
    const deletedSongs = allSongs.filter((song) => song.isDeleted);

    const allProjects = useProjects();
    const deletedProjects = allProjects.filter((proj) => proj.isDeleted);

    const handleSongRestore = (songId: string, songTitle: string) => {
        setSongDeleted(songId, false);
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `"${songTitle}" has been restored.` }
        }));
    };

    const handleProjectRestore = (projectId: string, projectTitle: string) => {
        setProjectDeleted(projectId, false);
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `Project "${projectTitle}" has been restored.` }
        }));
    };

    const handlePermanentDelete = (title: string) => {
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `"${title}" permanently deleted.` }
        }));
    };

    const handleContextMenu = (e: React.MouseEvent, itemId: string, itemTitle: string, itemType: "song" | "project") => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            itemId,
            itemTitle,
            itemType
        });
    };

    const filteredSongs = deletedSongs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.projectName && song.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredProjects = deletedProjects.filter((proj) =>
        proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalDeletedCount = filteredSongs.length + filteredProjects.length;

    return (
        <div className="w-full font-arimo text-white pb-10">
            <h1 className="text-xl font-bold font-syne mb-6">Deleted files</h1>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search deleted files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
            </div>

            <div className="flex items-center justify-between gap-3 mb-8">
                <div className="text-sm font-semibold text-neutral-400">
                    {totalDeletedCount} deleted {totalDeletedCount === 1 ? "item" : "items"}
                </div>
                <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden ml-2">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {totalDeletedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>Trash is empty.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* DELETED PROJECTS */}
                    {filteredProjects.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                Projects ({filteredProjects.length})
                            </h2>
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredProjects.map((project) => (
                                        <DeletedProjectGridItem
                                            key={project.id}
                                            project={project}
                                            onRestore={handleProjectRestore}
                                            onPermanentDelete={handlePermanentDelete}
                                            onContextMenu={(e) => handleContextMenu(e, project.id, project.title, "project")}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full bg-[#101010] border border-neutral-900 rounded-xl p-2">
                                    <div className="flex flex-col">
                                        {filteredProjects.map((project, index) => (
                                            <DeletedProjectListItem
                                                key={project.id}
                                                project={project}
                                                isLast={index === filteredProjects.length - 1}
                                                onRestore={handleProjectRestore}
                                                onPermanentDelete={handlePermanentDelete}
                                                onContextMenu={(e) => handleContextMenu(e, project.id, project.title, "project")}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DELETED SONGS */}
                    {filteredSongs.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                                Songs ({filteredSongs.length})
                            </h2>
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredSongs.map((song) => (
                                        <DeletedGridItem
                                            key={song.id}
                                            song={song}
                                            onRestore={handleSongRestore}
                                            onPermanentDelete={(id, title) => handlePermanentDelete(title)}
                                            onContextMenu={(e) => handleContextMenu(e, song.id, song.title, "song")}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                                        <div className="col-span-5 pl-2">Name</div>
                                        <div className="col-span-4">Deleted time</div>
                                        <div className="col-span-3 text-right pr-2">
                                            Actions
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {filteredSongs.map((song, index) => (
                                            <DeletedListItem
                                                key={song.id}
                                                song={song}
                                                isLast={index === filteredSongs.length - 1}
                                                onRestore={handleSongRestore}
                                                onPermanentDelete={(id, title) => handlePermanentDelete(title)}
                                                onContextMenu={(e) => handleContextMenu(e, song.id, song.title, "song")}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {contextMenu && (
                <TrashContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemId={contextMenu.itemId}
                    itemTitle={contextMenu.itemTitle}
                    itemType={contextMenu.itemType}
                    onRestore={contextMenu.itemType === "song" ? handleSongRestore : handleProjectRestore}
                    onPermanentDelete={(id, title) => handlePermanentDelete(title)}
                    onClose={() => setContextMenu(null)}
                />
            )}

            <Toast />
        </div>
    );
};

const DeletedProjectGridItem = ({
    project,
    onRestore,
    onPermanentDelete,
    onContextMenu,
}: {
    project: Project;
    onRestore: (id: string, title: string) => void;
    onPermanentDelete: (title: string) => void;
    onContextMenu?: React.MouseEventHandler;
}) => {
    return (
        <div 
            onContextMenu={onContextMenu}
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-context-menu"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
                <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    sizes="128px"
                />
            </div>
            <div className="flex flex-col flex-1 justify-between py-1 relative">
                <div>
                    <h3 className="font-bold text-base line-clamp-2 leading-tight mt-1 text-neutral-400 group-hover:text-white transition-colors">
                        {project.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Project Folder • {project.type}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <span className="text-[10px] text-neutral-500">
                        {project.songsCount} tracks
                    </span>
                    <div className="flex gap-2 relative z-20">
                        <button
                            className="p-1 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                            title="Restaurer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore(project.id, project.title);
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer définitivement"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPermanentDelete(project.title);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeletedProjectListItem = ({
    project,
    isLast,
    onRestore,
    onPermanentDelete,
    onContextMenu,
}: {
    project: Project;
    isLast: boolean;
    onRestore: (id: string, title: string) => void;
    onPermanentDelete: (title: string) => void;
    onContextMenu?: React.MouseEventHandler;
}) => {
    return (
        <div className="flex flex-col" onContextMenu={onContextMenu}>
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-white/[2%] transition-colors group cursor-context-menu">
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            sizes="48px"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-neutral-400 group-hover:text-white transition-colors">
                            {project.title}
                        </span>
                        <span className="text-xs text-neutral-500">
                            Project Folder • {project.type}
                        </span>
                    </div>
                </div>
                <div className="col-span-4 text-xs text-neutral-450">
                    Deleted recently
                </div>
                <div className="col-span-3 flex justify-end gap-2 pr-2 relative z-20">
                    <button
                        className="p-1.5 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                        title="Restaurer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestore(project.id, project.title);
                        }}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Supprimer définitivement"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDelete(project.title);
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-900 mx-2 my-1"></div>
            )}
        </div>
    );
};

const DeletedGridItem = ({
    song,
    onRestore,
    onPermanentDelete,
    onContextMenu,
}: {
    song: Song;
    onRestore: (id: string, title: string) => void;
    onPermanentDelete: (id: string, title: string) => void;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(song.audioSrc || "", 30);

    return (
        <div
            onContextMenu={onContextMenu}
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-context-menu"
        >
            <div
                className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer"
            >
                <Image
                    src={song.image}
                    alt={song.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105 opacity-100" : "opacity-60 group-hover:scale-105 group-hover:opacity-100"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
                {song.audioSrc && (
                    <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200"
                        >
                            {isPlaying ? (
                                <Pause size={16} className="text-white fill-white" />
                            ) : (
                                <Play size={16} className="text-white fill-white ml-0.5" />
                            )}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 justify-between py-1 relative">
                <div>
                    <h3
                        className={`font-bold text-base line-clamp-2 leading-tight mt-1 transition-colors ${isPlaying ? "text-white" : "text-neutral-400 group-hover:text-white"}`}
                    >
                        {song.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        {song.projectName || "Standalone"}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <span className="text-[10px] text-neutral-500">
                        {song.time}
                    </span>
                    <div className="flex gap-2 relative z-20">
                        <button
                            className="p-1 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                            title="Restaurer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore(song.id, song.title);
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer définitivement"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPermanentDelete(song.id, song.title);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeletedListItem = ({
    song,
    isLast,
    onRestore,
    onPermanentDelete,
    onContextMenu,
}: {
    song: Song;
    isLast: boolean;
    onRestore: (id: string, title: string) => void;
    onPermanentDelete: (id: string, title: string) => void;
    onContextMenu?: React.MouseEventHandler;
}) => {
    const { togglePlay, isPlaying } = useAudioClick(song.audioSrc || "", 30);

    return (
        <div className="flex flex-col" onContextMenu={onContextMenu}>
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group cursor-context-menu">
                <div className="col-span-5 flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 cursor-pointer"
                    >
                        <Image
                            src={song.image}
                            alt={song.title}
                            fill
                            className={`object-cover transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                            sizes="48px"
                        />
                        {song.audioSrc && (
                            <div
                                className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            >
                                <button
                                    onClick={togglePlay}
                                    className="w-7 h-7 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_10px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200"
                                >
                                    {isPlaying ? (
                                        <Pause size={12} className="text-white fill-white" />
                                    ) : (
                                        <Play size={12} className="text-white fill-white ml-0.5" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-neutral-400 group-hover:text-white"}`}
                        >
                            {song.title}
                        </span>
                        <span className="text-xs text-neutral-500">
                            {song.projectName || "Standalone"}
                        </span>
                    </div>
                </div>

                <div className="col-span-4 text-xs text-neutral-400">
                    {song.time}
                </div>

                <div className="col-span-3 flex justify-end gap-2 pr-2 relative z-20">
                    <button
                        className="p-1.5 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                        title="Restaurer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestore(song.id, song.title);
                        }}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Supprimer définitivement"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDelete(song.id, song.title);
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};
