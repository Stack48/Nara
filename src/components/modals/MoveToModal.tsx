"use client";

import { useState, useEffect } from "react";
import {
    X,
    Folder,
    Music,
    ArrowRight,
    FolderSymlink,
    Check,
    Search,
    ArrowUpDown,
} from "lucide-react";
import Image from "next/image";
import { useProjects } from "@/lib/projectStore";
import { useSongs, setSongProject } from "@/lib/songStore";

interface SelectedItem {
    id: string;
    title: string;
    type: "song" | "project";
    originalItem: any;
}

interface MoveToModalProps {
    isOpen: boolean;
    items: SelectedItem[];
    onClose: () => void;
}

export const MoveToModal = ({ isOpen, items, onClose }: MoveToModalProps) => {
    const allProjects = useProjects();
    const allSongs = useSongs();

    const activeProjects = allProjects.filter((p) => !p.isDeleted);

    // Select state (defaults to standalone or first project)
    const [selectedProjectId, setSelectedProjectId] =
        useState<string>("standalone_none");
    const [selectedProjectTitle, setSelectedProjectTitle] =
        useState<string>("");

    // Search and Sort states
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<
        "modified" | "alphabetical" | "created"
    >("modified");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        if (!isOpen) return;
        // Reset selections and filters
        setSelectedProjectId("standalone_none");
        setSelectedProjectTitle("");
        setSearchQuery("");
        setSortBy("modified");
        setSortOrder("desc");
    }, [isOpen]);

    if (!isOpen || items.length === 0) return null;

    // Filter preview songs of currently highlighted/selected project
    const previewSongs = allSongs.filter(
        (song) => song.projectId === selectedProjectId && !song.isDeleted,
    );

    const handleSelectProject = (id: string, title: string) => {
        setSelectedProjectId(id);
        setSelectedProjectTitle(title);
    };

    const handleMove = () => {
        const targetProjId =
            selectedProjectId === "standalone_none" ? "" : selectedProjectId;
        const targetProjTitle =
            selectedProjectId === "standalone_none" ? "" : selectedProjectTitle;

        items.forEach((item) => {
            if (item.type === "song") {
                setSongProject(item.id, targetProjId, targetProjTitle);
            }
        });

        const msg = targetProjId
            ? `Moved ${items.length} item(s) to project "${targetProjTitle}"`
            : `Moved ${items.length} item(s) to Standalone (No project)`;

        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: msg },
            }),
        );
        onClose();
    };

    // Filter and Sort Logic for activeProjects
    const filteredProjects = activeProjects.filter(
        (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        if (sortBy === "alphabetical") {
            const valA = a.title.toLowerCase();
            const valB = b.title.toLowerCase();
            return sortOrder === "asc"
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else if (sortBy === "created") {
            const valA = new Date(a.createdDate || 0).getTime();
            const valB = new Date(b.createdDate || 0).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
        } else {
            // Default: modified date
            const valA = new Date(a.lastModifiedDate || 0).getTime();
            const valB = new Date(b.lastModifiedDate || 0).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
        }
    });

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-2xl w-full h-[600px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D90097]/10 flex items-center justify-center text-[#D90097]">
                            <FolderSymlink size={18} />
                        </div>
                        <div>
                            <h3 className="font-syne font-bold text-white text-base">
                                Move to Project
                            </h3>
                            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                                Moving {items.length} song
                                {items.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Split Panel Finder Area */}
                <div className="flex-1 min-h-0 flex border-b border-neutral-900">
                    {/* Left Pane - Projects Selection List */}
                    <div className="w-1/2 border-r border-neutral-900 overflow-y-auto p-4 flex flex-col select-none">
                        <span className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-2 shrink-0">
                            Select Target Project
                        </span>

                        {/* Search and Sort controls */}
                        <div className="px-2 mb-3.5 space-y-2 shrink-0">
                            {/* Search bar */}
                            <div className="relative">
                                <Search
                                    size={13}
                                    className="absolute left-3 top-2.5 text-neutral-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Rechercher un projet..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full bg-[#151515] border border-neutral-850 focus:border-neutral-700 rounded-xl py-1.5 pl-8.5 pr-8 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-2.5 text-neutral-500 hover:text-white cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Sort selection drop down */}
                            <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold uppercase tracking-wider">
                                <span>Trier par</span>
                                <div className="flex items-center gap-1.5">
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value as any)
                                        }
                                        className="bg-[#151515] border border-neutral-850 rounded px-1.5 py-0.5 text-[9px] text-neutral-350 focus:outline-none cursor-pointer"
                                    >
                                        <option value="modified">
                                            Last modified
                                        </option>
                                        <option value="alphabetical">
                                            Alphabetical
                                        </option>
                                        <option value="created">
                                            Date created
                                        </option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSortOrder(
                                                sortOrder === "asc"
                                                    ? "desc"
                                                    : "asc",
                                            )
                                        }
                                        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                        title="Changer l'ordre de tri"
                                    >
                                        <ArrowUpDown size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Projects scrolling list container */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {/* Option 1: Standalone (No project) */}
                            <button
                                type="button"
                                onClick={() =>
                                    handleSelectProject(
                                        "standalone_none",
                                        "Standalone",
                                    )
                                }
                                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer shrink-0 ${
                                    selectedProjectId === "standalone_none"
                                        ? "bg-[#D90097]/5 border-[#D90097] text-white"
                                        : "bg-[#151515]/30 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400">
                                        <Music size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-xs truncate">
                                            Standalone
                                        </h4>
                                        <p className="text-[9px] text-neutral-500 font-medium">
                                            Remove from project
                                        </p>
                                    </div>
                                </div>
                                {selectedProjectId === "standalone_none" && (
                                    <Check
                                        size={14}
                                        className="text-[#D90097]"
                                    />
                                )}
                            </button>

                            {/* Sorted list of active projects */}
                            {sortedProjects.map((proj) => {
                                const isSelected =
                                    selectedProjectId === proj.id;
                                return (
                                    <button
                                        key={proj.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectProject(
                                                proj.id,
                                                proj.title,
                                            )
                                        }
                                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-[#D90097]/5 border-[#D90097] text-white"
                                                : "bg-[#151515]/30 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                                {proj.image ? (
                                                    <Image
                                                        src={proj.image}
                                                        alt={proj.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="32px"
                                                    />
                                                ) : (
                                                    <Folder size={14} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs truncate">
                                                    {proj.title}
                                                </h4>
                                                <p className="text-[10px] text-neutral-500 font-medium capitalize">
                                                    {proj.type} •{" "}
                                                    {proj.songsCount} track
                                                    {proj.songsCount > 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check
                                                size={14}
                                                className="text-[#D90097]"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                            {sortedProjects.length === 0 && (
                                <div className="p-4 text-center text-xs text-neutral-600 italic">
                                    Aucun projet trouvé
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Pane - Content Preview Panel */}
                    <div className="w-1/2 bg-neutral-950/20 overflow-y-auto p-4 space-y-3">
                        <span className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-1">
                            Project Preview
                        </span>

                        {selectedProjectId === "standalone_none" ? (
                            <div className="h-[80%] flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                                <Music
                                    size={32}
                                    className="text-neutral-700 mb-2"
                                />
                                <p className="text-xs font-medium">
                                    Moving item(s) to Standalone
                                </p>
                                <p className="text-[10px] text-neutral-600 mt-1 max-w-[180px]">
                                    This will unlink the song from its current
                                    project.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {previewSongs.length > 0 ? (
                                    previewSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            className="flex items-center gap-3 p-2 bg-[#151515]/30 border border-neutral-800/40 rounded-xl"
                                        >
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-500 shrink-0">
                                                {song.image ? (
                                                    <Image
                                                        src={song.image}
                                                        alt={song.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="32px"
                                                    />
                                                ) : (
                                                    <Music size={12} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-xs text-white truncate">
                                                    {song.title}
                                                </h5>
                                                <p className="text-[9px] text-neutral-500">
                                                    {song.state}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-600 p-4">
                                        <Folder
                                            size={24}
                                            className="text-neutral-700 mb-2"
                                        />
                                        <p className="text-xs italic">
                                            Empty Project
                                        </p>
                                        <p className="text-[10px] text-neutral-700 mt-0.5">
                                            No tracks inside this project.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-neutral-950/20 shrink-0 flex items-center justify-between">
                    {/* Status Summary */}
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold min-w-0 pr-4">
                        <span className="truncate max-w-[120px] font-bold text-white">
                            {items.length === 1
                                ? `"${items[0].title}"`
                                : `${items.length} items`}
                        </span>
                        <ArrowRight
                            size={14}
                            className="shrink-0 text-neutral-500"
                        />
                        <span className="truncate max-w-[150px] font-bold text-[#D90097] flex items-center gap-1">
                            <Folder size={12} className="shrink-0" />
                            {selectedProjectId === "standalone_none"
                                ? "Standalone"
                                : selectedProjectTitle}
                        </span>
                    </div>

                    <div className="flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleMove}
                            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span>Move Here</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
