"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelection } from "@/context/SelectionContext";
import { useProjects, renameProject, setProjectDeleted } from "@/lib/projectStore";
import { renameSong, setSongDeleted } from "@/lib/songStore";
import { RenameModal } from "../modals/RenameModal";
import {
    Heart,
    Trash2,
    Copy,
    Share2,
    Download,
    FolderSymlink,
    Edit2,
    X,
    FolderOpen,
    Music,
    Check,
    RotateCcw,
} from "lucide-react";

export const SelectionBanner = () => {
    const {
        selectedItems,
        clearSelection,
        favoriteSelected,
        deleteSelected,
        duplicateSelected,
        shareSelected,
        downloadSelected,
        moveSelectedSongsToProject,
    } = useSelection();

    const router = useRouter();
    const pathname = usePathname();
    const isDeletedView = pathname === "/deleted";

    const allProjects = useProjects();
    const activeProjects = allProjects.filter((p) => !p.isDeleted);

    const [hoveredAction, setHoveredAction] = useState<string>("");
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isMoveToOpen, setIsMoveToOpen] = useState(false);
    const moveToRef = useRef<HTMLDivElement>(null);

    const handleRestoreSelected = () => {
        selectedItems.forEach((item) => {
            if (item.type === "song") {
                setSongDeleted(item.id, false);
            } else {
                setProjectDeleted(item.id, false);
            }
        });
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `Restored ${selectedItems.length} item(s).` },
            })
        );
        clearSelection();
    };

    const handlePermanentDeleteSelected = () => {
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `${selectedItems.length} item(s) permanently deleted.` },
            })
        );
        clearSelection();
    };

    // Close move to dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moveToRef.current && !moveToRef.current.contains(e.target as Node)) {
                setIsMoveToOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (selectedItems.length === 0) return null;

    const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;
    const hasSongs = selectedItems.some((item) => item.type === "song");
    
    // Actions
    const handleOpen = () => {
        if (!singleItem) return;
        const id = singleItem.id;
        if (singleItem.type === "song") {
            router.push(`/songs/${id}`);
        } else {
            const isShared = !!singleItem.originalItem.isShared;
            router.push(isShared ? `/shared/${id}` : `/projects/${id}`);
        }
        clearSelection();
    };

    const handleRenameSave = (newValue: string) => {
        if (!singleItem) return;
        if (singleItem.type === "song") {
            renameSong(singleItem.id, newValue);
        } else {
            renameProject(singleItem.id, newValue);
        }
        setIsRenameOpen(false);
        clearSelection();

        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `${singleItem.type === "song" ? "Song" : "Project"} renamed to "${newValue}"`,
                },
            }),
        );
    };

    // Hover helper
    const handleMouseEnter = (label: string) => setHoveredAction(label);
    const handleMouseLeave = () => setHoveredAction("");

    // Determine default hint
    const getDefaultHint = () => {
        if (singleItem) {
            return `Selected: "${singleItem.title}" (${singleItem.type})`;
        }
        return `${selectedItems.length} items selected (mixed)`;
    };

    // Check if favorite icon should be highlighted
    const allFavorited = selectedItems.every(item => !!item.originalItem.isFavorite);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] w-[90%] max-w-lg selection-banner">
            {/* Main floating container */}
            <div className="bg-[#121212]/95 border border-neutral-800/80 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    {/* Count & Close */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearSelection}
                            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
                            onMouseEnter={() => handleMouseEnter("Clear selection")}
                            onMouseLeave={handleMouseLeave}
                        >
                            <X size={16} />
                        </button>
                        <span className="text-sm font-bold font-syne text-white">
                            {selectedItems.length} selected
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 relative">
                        {isDeletedView ? (
                            <>
                                {/* Restore Button */}
                                <button
                                    onClick={handleRestoreSelected}
                                    className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Restore selected items")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <RotateCcw size={16} />
                                </button>

                                {/* Delete Permanently Button */}
                                <button
                                    onClick={handlePermanentDeleteSelected}
                                    className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Delete permanently")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Open Button (Single Select) */}
                                {singleItem && (
                                    <button
                                        onClick={handleOpen}
                                        className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                        onMouseEnter={() =>
                                            handleMouseEnter(
                                                singleItem.type === "song" ? "Open Lyric Editor" : "Open Project"
                                            )
                                        }
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {singleItem.type === "song" ? <Music size={16} /> : <FolderOpen size={16} />}
                                    </button>
                                )}

                                {/* Edit Button (Single Select) */}
                                {singleItem && (
                                    <button
                                        onClick={() => setIsRenameOpen(true)}
                                        className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                        onMouseEnter={() => handleMouseEnter("Rename item")}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}

                                {/* Favorite Button */}
                                <button
                                    onClick={favoriteSelected}
                                    className={`p-2 rounded-xl hover:bg-neutral-800/80 transition-colors ${
                                        allFavorited ? "text-[#D90097]" : "text-neutral-300 hover:text-white"
                                    }`}
                                    onMouseEnter={() =>
                                        handleMouseEnter(
                                            allFavorited ? "Remove from Favorites" : "Add to Favorites"
                                        )
                                    }
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Heart size={16} className={allFavorited ? "fill-[#D90097]" : ""} />
                                </button>

                                {/* Duplicate Button */}
                                <button
                                    onClick={duplicateSelected}
                                    className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Duplicate items")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Copy size={16} />
                                </button>

                                {/* Move to project (Only if songs are in selection) */}
                                {hasSongs && (
                                    <div className="relative" ref={moveToRef}>
                                        <button
                                            onClick={() => setIsMoveToOpen(!isMoveToOpen)}
                                            className={`p-2 rounded-xl hover:bg-neutral-800/80 transition-colors ${
                                                isMoveToOpen ? "text-[#D90097] bg-neutral-800/80" : "text-neutral-300 hover:text-white"
                                            }`}
                                            onMouseEnter={() => handleMouseEnter("Move selected songs to project")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <FolderSymlink size={16} />
                                        </button>

                                        {/* Popup drop-down */}
                                        {isMoveToOpen && (
                                            <div className="absolute bottom-full right-0 mb-2 w-52 bg-[#151515] border border-neutral-800 rounded-xl shadow-2xl py-2 z-[100] max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                                    Move songs to...
                                                </div>
                                                {activeProjects.map((proj) => (
                                                    <button
                                                        key={proj.id}
                                                        onClick={() => {
                                                            moveSelectedSongsToProject(proj.id, proj.title);
                                                            setIsMoveToOpen(false);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                                                    >
                                                        <span className="truncate">{proj.title}</span>
                                                        {singleItem &&
                                                            singleItem.type === "song" &&
                                                            singleItem.originalItem.projectId === proj.id && (
                                                                <Check size={12} className="text-[#D90097]" />
                                                            )}
                                                    </button>
                                                ))}
                                                <hr className="border-neutral-800 my-1 mx-2" />
                                                <button
                                                    onClick={() => {
                                                        moveSelectedSongsToProject("", "");
                                                        setIsMoveToOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-1.5 transition-colors cursor-pointer"
                                                >
                                                    <X size={12} />
                                                    <span>Remove from project</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Share Button */}
                                <button
                                    onClick={shareSelected}
                                    className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Share selected")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Share2 size={16} />
                                </button>

                                {/* Download Button */}
                                <button
                                    onClick={downloadSelected}
                                    className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Download files")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Download size={16} />
                                </button>

                                {/* Trash Button */}
                                <button
                                    onClick={deleteSelected}
                                    className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    onMouseEnter={() => handleMouseEnter("Suppress / Move to Trash")}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Sub-label text description for hovering / info */}
                <div className="text-[11px] text-center border-t border-neutral-900 pt-2 h-5 font-medium transition-colors duration-200">
                    {hoveredAction ? (
                        <span className="text-[#D90097] animate-in fade-in duration-150">
                            {hoveredAction}
                        </span>
                    ) : (
                        <span className="text-neutral-500">
                            {getDefaultHint()}
                        </span>
                    )}
                </div>
            </div>

            {/* Rename Modal Container */}
            {isRenameOpen && singleItem && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setIsRenameOpen(false)}
                    title={singleItem.type === "song" ? "Rename song" : "Rename project folder"}
                    label={singleItem.type === "song" ? "Song Title" : "Project Name"}
                    placeholder={singleItem.type === "song" ? "Enter song title" : "Enter project name"}
                    initialValue={singleItem.title}
                    onSave={handleRenameSave}
                />
            )}
        </div>
    );
};
