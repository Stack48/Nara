"use client";

import { useRef, useEffect, useState } from "react";
import { 
    FolderOpen, 
    Copy, 
    Edit2, 
    Heart, 
    Share2, 
    Trash2, 
} from "lucide-react";
import { 
    toggleProjectFavorite, 
    setProjectDeleted, 
    Project 
} from "@/lib/projectStore";
import { useRouter } from "next/navigation";

interface ProjectContextMenuProps {
    x: number;
    y: number;
    project: Project;
    onClose: () => void;
    onRenameClick: () => void;
}

export const ProjectContextMenu = ({ x, y, project, onClose, onRenameClick }: ProjectContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedCoords, setAdjustedCoords] = useState({ x, y });
    const router = useRouter();

    // Adjust coordinates to keep context menu on-screen
    useEffect(() => {
        if (!menuRef.current) return;
        const menuWidth = 192; // Approx width
        const menuHeight = 240; // Approx height
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

    // Handle clicks outside menu
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
        router.push(`/projects/${project.id}`);
    };

    const handleCopy = () => {
        onClose();
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(`https://nara.app/projects/${project.id}`);
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: "Project link copied to clipboard!" }
            }));
        }
    };

    const handleFavorite = () => {
        onClose();
        toggleProjectFavorite(project.id);
        const action = project.isFavorite ? "Removed from Favorites" : "Added to Favorites";
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `${action}!` }
        }));
    };

    const handleShare = () => {
        onClose();
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: "Mock project sharing link generated!" }
        }));
    };

    const handleDelete = () => {
        onClose();
        setProjectDeleted(project.id, true);
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `Project "${project.title}" moved to Trash.` }
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
                <FolderOpen size={14} className="text-neutral-500" />
                <span>Open Project</span>
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
                <span>Rename Folder</span>
            </button>

            {/* Favorite */}
            <button
                onClick={handleFavorite}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Heart size={14} className={project.isFavorite ? "text-[#D90097] fill-[#D90097]" : "text-neutral-500"} />
                <span>{project.isFavorite ? "Unfavorite Project" : "Add to Favorites"}</span>
            </button>

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
