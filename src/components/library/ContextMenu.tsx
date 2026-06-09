"use client";

import { useRef, useEffect, useState } from "react";
import { 
    Music, 
    Copy, 
    Edit2, 
    Heart, 
    FolderSymlink, 
    Share2, 
    Trash2, 
    ChevronRight,
    X,
    Check
} from "lucide-react";
import { 
    toggleSongFavorite, 
    setSongDeleted, 
    setSongProject, 
    Song 
} from "@/lib/songStore";
import { useRouter } from "next/navigation";

interface ContextMenuProps {
    x: number;
    y: number;
    song: Song;
    onClose: () => void;
    onRenameClick: () => void;
}

const PROJECTS_LIST = [
    { id: "Alfredo_2", title: "Alfredo 2" },
    { id: "Aquemini", title: "Aquemini" },
    { id: "Let_God_Sort_Em_Out", title: "Let God Sort Em Out" },
    { id: "Microphone_Champion", title: "Microphone Champion" },
    { id: "Mr_Clean_Modern_Day_Mugging", title: "Mr. Clean / Modern Day Mugging" },
    { id: "The_Infamous", title: "The Infamous" },
    { id: "This_Is_America", title: "This Is America" },
    { id: "Who_Coppin", title: "Who Coppin'" }
];

export const ContextMenu = ({ x, y, song, onClose, onRenameClick }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [adjustedCoords, setAdjustedCoords] = useState({ x, y });
    const router = useRouter();

    // Adjust coordinates to ensure the context menu stays on screen
    useEffect(() => {
        if (!menuRef.current) return;
        const menuWidth = 192; // Approx width of context menu
        const menuHeight = 280; // Approx height of context menu
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
    }, [x, y]);

    // Handle clicks outside the menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

    const handleOpen = () => {
        onClose();
        // Route to mock lyrics editor page
        router.push(`/songs/${song.id}`);
    };

    const handleCopy = () => {
        onClose();
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(`https://nara.app/songs/${song.id}`);
            // Fire toast event
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: "Song link copied to clipboard!" }
            }));
        }
    };

    const handleFavorite = () => {
        onClose();
        toggleSongFavorite(song.id);
        const action = song.isFavorite ? "Removed from Favorites" : "Added to Favorites";
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `${action}!` }
        }));
    };

    const handleShare = () => {
        onClose();
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: "Mock sharing link generated!" }
        }));
    };

    const handleDelete = () => {
        onClose();
        setSongDeleted(song.id, true);
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `"${song.title}" moved to Trash.` }
        }));
    };

    const handleMoveToProject = (projectId: string, projectTitle: string) => {
        onClose();
        setSongProject(song.id, projectId, projectTitle);
        const msg = projectId ? `Moved to "${projectTitle}"` : "Unlinked from project (made Standalone)";
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: msg }
        }));
    };

    return (
        <div 
            ref={menuRef}
            className="fixed w-48 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[999] py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-arimo select-none"
            style={{ top: `${adjustedCoords.y}px`, left: `${adjustedCoords.x}px` }}
        >
            {/* Open */}
            <button
                onClick={handleOpen}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Music size={14} className="text-neutral-500" />
                <span>Open Lyrics Editor</span>
            </button>

            {/* Copy Link */}
            <button
                onClick={handleCopy}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Copy size={14} className="text-neutral-500" />
                <span>Copy Link</span>
            </button>

            {/* Rename */}
            <button
                onClick={() => {
                    onClose();
                    onRenameClick();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Edit2 size={14} className="text-neutral-500" />
                <span>Rename</span>
            </button>

            {/* Favorite */}
            <button
                onClick={handleFavorite}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Heart size={14} className={song.isFavorite ? "text-[#D90097] fill-[#D90097]" : "text-neutral-500"} />
                <span>{song.isFavorite ? "Unfavorite" : "Add to Favorites"}</span>
            </button>

            {/* Divider */}
            <hr className="border-neutral-800 my-1 mx-2" />

            {/* Move to... (Submenu) */}
            <div 
                className="relative"
                onMouseEnter={() => setSubmenuOpen(true)}
                onMouseLeave={() => setSubmenuOpen(false)}
            >
                <button
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <FolderSymlink size={14} className="text-neutral-500" />
                        <span>Move to...</span>
                    </div>
                    <ChevronRight size={12} className="text-neutral-500" />
                </button>

                {submenuOpen && (
                    <div className="absolute top-0 left-full ml-1 w-52 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-2 backdrop-blur-md animate-in fade-in slide-in-from-left-1 duration-100 max-h-60 overflow-y-auto">
                        <div className="px-3.5 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                            Select project
                        </div>
                        {PROJECTS_LIST.map((proj) => (
                            <button
                                key={proj.id}
                                onClick={() => handleMoveToProject(proj.id, proj.title)}
                                className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <span className="truncate">{proj.title}</span>
                                {song.projectId === proj.id && <Check size={12} className="text-[#D90097] shrink-0 ml-1" />}
                            </button>
                        ))}
                        {song.projectId && (
                            <>
                                <hr className="border-neutral-800 my-1 mx-2" />
                                <button
                                    onClick={() => handleMoveToProject("", "")}
                                    className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <X size={12} />
                                    <span>Remove from project</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Share */}
            <button
                onClick={handleShare}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Share2 size={14} className="text-neutral-500" />
                <span>Share</span>
            </button>

            {/* Divider */}
            <hr className="border-neutral-800 my-1 mx-2" />

            {/* Delete */}
            <button
                onClick={handleDelete}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Trash2 size={14} className="text-red-500" />
                <span>Delete</span>
            </button>
        </div>
    );
};
