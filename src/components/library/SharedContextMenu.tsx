"use client";

import { useRef, useEffect, useState } from "react";
import { 
    Music, 
    Copy, 
    Heart, 
    Share2, 
    Trash2, 
} from "lucide-react";
import { 
    toggleSongFavorite, 
    setSongDeleted, 
    Song 
} from "@/lib/songStore";
import { useRouter } from "next/navigation";

interface SharedContextMenuProps {
    x: number;
    y: number;
    song: Song;
    onClose: () => void;
}

export const SharedContextMenu = ({ x, y, song, onClose }: SharedContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedCoords, setAdjustedCoords] = useState({ x, y });
    const router = useRouter();

    // Adjust coordinates to keep context menu on-screen
    useEffect(() => {
        if (!menuRef.current) return;
        const menuWidth = 192; // Approx width
        const menuHeight = 200; // Approx height
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
        router.push(`/songs/${song.id}`);
    };

    const handleCopy = () => {
        onClose();
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(`https://nara.app/songs/${song.id}`);
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

    const handleRemoveFromList = () => {
        onClose();
        setSongDeleted(song.id, true);
        window.dispatchEvent(new CustomEvent("show-nara-toast", {
            detail: { message: `"${song.title}" removed from shared list.` }
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

            {/* Favorite */}
            <button
                onClick={handleFavorite}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Heart size={14} className={song.isFavorite ? "text-[#D90097] fill-[#D90097]" : "text-neutral-500"} />
                <span>{song.isFavorite ? "Unfavorite Song" : "Add to Favorites"}</span>
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

            {/* Remove from shared list */}
            <button
                onClick={handleRemoveFromList}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Trash2 size={14} className="text-red-500" />
                <span>Remove from List</span>
            </button>
        </div>
    );
};
