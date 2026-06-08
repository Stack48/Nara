"use client";

import { useRef, useEffect, useState } from "react";
import {
    Music,
    FolderOpen,
    Copy,
    Edit2,
    Heart,
    FolderSymlink,
    Share2,
    Trash2,
    RotateCcw,
    ChevronRight,
    X,
    Check,
    Download,
} from "lucide-react";
import {
    toggleSongFavorite,
    setSongDeleted,
    setSongProject,
    Song,
    createSong,
} from "@/lib/songStore";
import {
    toggleProjectFavorite,
    setProjectDeleted,
    Project,
    createProject,
} from "@/lib/projectStore";
import { useProjects } from "@/lib/projectStore";
import { useRouter } from "next/navigation";

interface MenuContextProps {
    x: number;
    y: number;
    itemType: "song" | "project";
    context?: "default" | "shared" | "trash";
    song?: Song;
    project?: Project;
    itemId?: string; // Fallback for trash context where full object might not be passed
    itemTitle?: string; // Fallback for trash context
    onClose: () => void;
    onRenameClick?: () => void;
    onRestore?: (id: string, title: string) => void;
    onPermanentDelete?: (id: string, title: string) => void;
}

export const MenuContext = ({
    x,
    y,
    itemType,
    context = "default",
    song,
    project,
    itemId,
    itemTitle,
    onClose,
    onRenameClick,
    onRestore,
    onPermanentDelete,
}: MenuContextProps) => {
    const allProjects = useProjects();
    const activeProjects = allProjects.filter((p) => !p.isDeleted);
    const menuRef = useRef<HTMLDivElement>(null);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [adjustedCoords, setAdjustedCoords] = useState({ x, y });
    const router = useRouter();

    // Derived properties
    const id = song?.id || project?.id || itemId || "";
    const title = song?.title || project?.title || itemTitle || "";
    const isFavorite = song?.isFavorite || project?.isFavorite || false;
    const currentProjectId = song?.projectId;

    // Adjust coordinates to ensure the context menu stays on screen
    useEffect(() => {
        if (!menuRef.current) return;
        const menuWidth = 192; // Approx width
        const menuHeight = context === "trash" ? 100 : 280; // Approx height
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + menuWidth > winWidth) {
            finalX = winWidth - menuWidth - 10;
        }
        if (y + menuHeight > winHeight) {
            finalY = winHeight - menuHeight - 10;
        }

        setAdjustedCoords({ x: finalX, y: finalY });
    }, [x, y, context]);

    // Handle clicks outside the menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [onClose]);

    // Actions
    const handleOpen = () => {
        onClose();
        if (itemType === "song") {
            router.push(`/songs/${id}`);
        } else {
            router.push(`/projects/${id}`);
        }
    };

    const handleCopy = () => {
        onClose();
        if (typeof navigator !== "undefined") {
            const urlPath = itemType === "song" ? "songs" : "projects";
            navigator.clipboard.writeText(`https://nara.app/${urlPath}/${id}`);
            window.dispatchEvent(
                new CustomEvent("show-nara-toast", {
                    detail: {
                        message: `${itemType === "song" ? "Song" : "Project"} link copied to clipboard!`,
                    },
                }),
            );
        }
    };

    const handleFavorite = () => {
        onClose();
        if (itemType === "song") {
            toggleSongFavorite(id);
        } else {
            toggleProjectFavorite(id);
        }
        const action = isFavorite
            ? "Removed from Favorites"
            : "Added to Favorites";
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `${action}!` },
            }),
        );
    };

    const handleDuplicate = () => {
        onClose();
        if (itemType === "song") {
            const currentTitle = song?.title || "Untitled";
            createSong(
                `${currentTitle} (Copy)`,
                song?.projectId || "",
                song?.projectName || "",
            );
            window.dispatchEvent(
                new CustomEvent("show-nara-toast", {
                    detail: {
                        message: `Song "${currentTitle}" duplicated!`,
                    },
                }),
            );
        } else {
            const currentTitle = project?.title || "Untitled";
            createProject(
                `${currentTitle} (Copy)`,
                (project?.type as any) || "Album",
            );
            window.dispatchEvent(
                new CustomEvent("show-nara-toast", {
                    detail: {
                        message: `Project "${currentTitle}" duplicated!`,
                    },
                }),
            );
        }
    };

    const handleDownload = () => {
        onClose();
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `Downloading ${itemType === "song" ? "audio track" : "project files"}...`,
                },
            }),
        );
    };

    const handleShare = () => {
        onClose();
        window.dispatchEvent(
            new CustomEvent("open-share-modal", {
                detail: {
                    items: [
                        {
                            id,
                            title,
                            type: itemType,
                            originalItem: song || project,
                        },
                    ],
                },
            }),
        );
    };

    const handleDeleteToTrash = () => {
        onClose();
        if (itemType === "song") {
            setSongDeleted(id, true);
        } else {
            setProjectDeleted(id, true);
        }
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `"${title}" moved to Trash.` },
            }),
        );
    };

    const handleMoveToProject = (pid: string, ptitle: string) => {
        onClose();
        if (itemType === "song") {
            setSongProject(id, pid, ptitle);
            const msg = pid
                ? `Moved to "${ptitle}"`
                : "Unlinked from project (made Standalone)";
            window.dispatchEvent(
                new CustomEvent("show-nara-toast", {
                    detail: { message: msg },
                }),
            );
        }
    };

    const handleRemoveFromSharedList = () => {
        onClose();
        if (itemType === "song") {
            setSongDeleted(id, true);
        } else {
            setProjectDeleted(id, true);
        }
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `"${title}" removed from shared list.` },
            }),
        );
    };

    // Render TRASH Context Menu
    if (context === "trash") {
        return (
            <div
                ref={menuRef}
                className="fixed w-48 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[999] py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-arimo select-none"
                style={{
                    top: `${adjustedCoords.y}px`,
                    left: `${adjustedCoords.x}px`,
                }}
            >
                <button
                    onClick={() => {
                        onClose();
                        if (onRestore) onRestore(id, title);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <RotateCcw size={14} className="text-neutral-500" />
                    <span>
                        Restore {itemType === "song" ? "Song" : "Project"}
                    </span>
                </button>

                <button
                    onClick={() => {
                        onClose();
                        if (onPermanentDelete) onPermanentDelete(id, title);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Trash2 size={14} className="text-red-500" />
                    <span>Delete Permanently</span>
                </button>
            </div>
        );
    }

    // Render DEFAULT and SHARED Context Menu
    if (itemType === "song") {
        return (
            <div
                ref={menuRef}
                className="fixed w-48 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[999] py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-arimo select-none"
                style={{
                    top: `${adjustedCoords.y}px`,
                    left: `${adjustedCoords.x}px`,
                }}
            >
                {/* 1. Open Lyric Editor */}
                <button
                    onClick={handleOpen}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Music size={14} className="text-neutral-500" />
                    <span>Open Lyric Editor</span>
                </button>

                {/* 2. Edit */}
                {context === "default" && (
                    <button
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(
                                new CustomEvent("open-edit-modal", {
                                    detail: {
                                        type: "song",
                                        itemId: id,
                                    },
                                }),
                            );
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Edit2 size={14} className="text-neutral-500" />
                        <span>Edit</span>
                    </button>
                )}

                {/* 3. Duplicate */}
                <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Copy size={14} className="text-neutral-500" />
                    <span>Duplicate</span>
                </button>

                {/* 4. Favorite */}
                <button
                    onClick={handleFavorite}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Heart
                        size={14}
                        className={
                            isFavorite
                                ? "text-red-500 fill-red-500"
                                : "text-neutral-500"
                        }
                    />
                    <span>
                        {isFavorite ? "Unfavorite Song" : "Add to Favorites"}
                    </span>
                </button>

                {/* 5. Move to... */}
                {context === "default" && (
                    <button
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(
                                new CustomEvent("open-moveto-modal", {
                                    detail: {
                                        items: [
                                            {
                                                id,
                                                title,
                                                type: "song",
                                                originalItem: song,
                                            },
                                        ],
                                    },
                                }),
                            );
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <FolderSymlink size={14} className="text-neutral-500" />
                        <span>Move to...</span>
                    </button>
                )}

                {/* Divider */}
                <hr className="border-neutral-800 my-1 mx-2" />

                {/* 6. Share */}
                <button
                    onClick={handleShare}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Share2 size={14} className="text-neutral-500" />
                    <span>Share</span>
                </button>

                {/* 7. Download */}
                <button
                    onClick={handleDownload}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Download size={14} className="text-neutral-500" />
                    <span>Download</span>
                </button>

                {/* 8. Suppress */}
                {context === "default" ? (
                    <button
                        onClick={handleDeleteToTrash}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Move to trash</span>
                    </button>
                ) : (
                    <button
                        onClick={handleRemoveFromSharedList}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Remove from List</span>
                    </button>
                )}
            </div>
        );
    } else {
        return (
            <div
                ref={menuRef}
                className="fixed w-48 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[999] py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-arimo select-none"
                style={{
                    top: `${adjustedCoords.y}px`,
                    left: `${adjustedCoords.x}px`,
                }}
            >
                {/* 1. Open Project */}
                <button
                    onClick={handleOpen}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <FolderOpen size={14} className="text-neutral-500" />
                    <span>Open Project</span>
                </button>

                {/* 2. Edit */}
                {context === "default" && (
                    <button
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(
                                new CustomEvent("open-edit-modal", {
                                    detail: {
                                        type: "project",
                                        itemId: id,
                                    },
                                }),
                            );
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Edit2 size={14} className="text-neutral-500" />
                        <span>Edit</span>
                    </button>
                )}

                {/* 3. Duplicate */}
                <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Copy size={14} className="text-neutral-500" />
                    <span>Duplicate</span>
                </button>

                {/* 4. Favorite */}
                <button
                    onClick={handleFavorite}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Heart
                        size={14}
                        className={
                            isFavorite
                                ? "text-red-500 fill-red-500"
                                : "text-neutral-500"
                        }
                    />
                    <span>
                        {isFavorite ? "Unfavorite Project" : "Add to Favorites"}
                    </span>
                </button>

                {/* Divider */}
                <hr className="border-neutral-800 my-1 mx-2" />

                {/* 5. Share */}
                <button
                    onClick={handleShare}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Share2 size={14} className="text-neutral-500" />
                    <span>Share</span>
                </button>

                {/* 6. Download */}
                <button
                    onClick={handleDownload}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                    <Download size={14} className="text-neutral-500" />
                    <span>Download</span>
                </button>

                {/* 7. Suppress */}
                {context === "default" ? (
                    <button
                        onClick={handleDeleteToTrash}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Move to trash</span>
                    </button>
                ) : (
                    <button
                        onClick={handleRemoveFromSharedList}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Remove from List</span>
                    </button>
                )}
            </div>
        );
    }
};
