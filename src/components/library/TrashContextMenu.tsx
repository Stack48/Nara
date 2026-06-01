"use client";

import { useRef, useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

interface TrashContextMenuProps {
    x: number;
    y: number;
    itemId: string;
    itemTitle: string;
    itemType: "song" | "project";
    onRestore: (id: string, title: string) => void;
    onPermanentDelete: (id: string, title: string) => void;
    onClose: () => void;
}

export const TrashContextMenu = ({
    x,
    y,
    itemId,
    itemTitle,
    itemType,
    onRestore,
    onPermanentDelete,
    onClose,
}: TrashContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedCoords, setAdjustedCoords] = useState({ x, y });

    useEffect(() => {
        if (!menuRef.current) return;
        const menuWidth = 180;
        const menuHeight = 100;
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

    return (
        <div
            ref={menuRef}
            className="fixed w-44 bg-[#151515]/95 border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[999] py-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-arimo select-none"
            style={{ top: `${adjustedCoords.y}px`, left: `${adjustedCoords.x}px` }}
        >
            <button
                onClick={() => {
                    onClose();
                    onRestore(itemId, itemTitle);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <RotateCcw size={14} className="text-neutral-500" />
                <span>Restore {itemType === "song" ? "Song" : "Project"}</span>
            </button>

            <button
                onClick={() => {
                    onClose();
                    onPermanentDelete(itemId, itemTitle);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/[3%] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
                <Trash2 size={14} className="text-red-500" />
                <span>Delete Permanently</span>
            </button>
        </div>
    );
};
