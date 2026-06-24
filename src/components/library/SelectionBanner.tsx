"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelection } from "@/context/SelectionContext";
import { useProjects, renameProject, setProjectDeleted, deleteProjectPermanently } from "@/lib/projectStore";
import { renameSong, setSongDeleted, deleteSongPermanently } from "@/lib/songStore";
import { PermanentDeleteFileModal } from "@/components/library/PermanentDeleteFileModal";
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
    const isSharedView = pathname === "/shared" || pathname.startsWith("/shared/");

    const allProjects = useProjects();
    const activeProjects = allProjects.filter((p) => !p.isDeleted);

    const [hoveredAction, setHoveredAction] = useState<string>("");
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isMoveToOpen, setIsMoveToOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // "Photo" des éléments à supprimer, prise à l'ouverture de la boîte.
    // Indispensable : la sélection peut se vider (clic) pendant que la boîte est ouverte.
    const [pendingItems, setPendingItems] = useState<typeof selectedItems>([]);
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

    // N'ouvre QUE la boîte de dialogue + mémorise les éléments à supprimer.
    const handlePermanentDeleteSelected = () => {
        setPendingItems([...selectedItems]);
        setIsDeleteModalOpen(true);
    };

    // La vraie suppression, lancée seulement quand on valide la boîte.
    // On supprime les `pendingItems` (la photo), pas `selectedItems` qui peut être vide.
    const confirmPermanentDeleteSelected = () => {
        pendingItems.forEach((item) => {
            if (item.type === "song") {
                deleteSongPermanently(item.id);
            } else {
                deleteProjectPermanently(item.id);
            }
        });
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `${pendingItems.length} item(s) permanently deleted.` },
            })
        );
        setIsDeleteModalOpen(false);
        setPendingItems([]);
        clearSelection();
    };

    const handleRemoveSharedSelected = () => {
        selectedItems.forEach((item) => {
            if (item.type === "song") {
                setSongDeleted(item.id, true);
            } else {
                setProjectDeleted(item.id, true);
            }
        });
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `${selectedItems.length} item(s) removed from shared list.` },
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
    const allFavorited = selectedItems.length > 0 && selectedItems.every(item => !!item.originalItem.isFavorite);

    // Nom affiché dans la boîte (basé sur la photo, pas sur la sélection live)
    const pendingLabel = pendingItems.length === 1 ? pendingItems[0].title : `${pendingItems.length} items`;

    return (
        <>
            {/* La barre ne s'affiche que s'il y a une sélection */}
            {selectedItems.length > 0 && (
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
                                        {singleItem && !isSharedView && (
                                            <button
                                                onClick={() => {
                                                    window.dispatchEvent(
                                                        new CustomEvent("open-edit-modal", {
                                                            detail: {
                                                                type: singleItem.type,
                                                                itemId: singleItem.id,
                                                            },
                                                        }),
                                                    );
                                                    clearSelection();
                                                }}
                                                className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                                onMouseEnter={() => handleMouseEnter("Edit")}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}

                                        {/* Duplicate Button */}
                                        <button
                                            onClick={duplicateSelected}
                                            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                            onMouseEnter={() => handleMouseEnter("Duplicate items")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <Copy size={16} />
                                        </button>

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

                                        {/* Move to project (Only if songs are in selection) */}
                                        {hasSongs && !isSharedView && (
                                            <button
                                                onClick={() => {
                                                    window.dispatchEvent(
                                                        new CustomEvent("open-moveto-modal", {
                                                            detail: {
                                                                items: selectedItems,
                                                            },
                                                        }),
                                                    );
                                                    clearSelection();
                                                }}
                                                className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                                onMouseEnter={() => handleMouseEnter("Move to...")}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <FolderSymlink size={16} />
                                            </button>
                                        )}

                                        {/* Share Button */}
                                        <button
                                            onClick={() => {
                                                window.dispatchEvent(
                                                    new CustomEvent("open-share-modal", {
                                                        detail: {
                                                            items: selectedItems,
                                                        },
                                                    }),
                                                );
                                                clearSelection();
                                            }}
                                            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                            onMouseEnter={() => handleMouseEnter("Share")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <Share2 size={16} />
                                        </button>

                                        {/* Download Button */}
                                        <button
                                            onClick={downloadSelected}
                                            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                                            onMouseEnter={() => handleMouseEnter("Download")}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <Download size={16} />
                                        </button>

                                        {/* Trash / Remove Button */}
                                        {isSharedView ? (
                                            <button
                                                onClick={handleRemoveSharedSelected}
                                                className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                onMouseEnter={() => handleMouseEnter("Remove from list")}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={deleteSelected}
                                                className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                onMouseEnter={() => handleMouseEnter("Delete")}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
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
                </div>
            )}

            {/* Boîte de confirmation  */}
            <PermanentDeleteFileModal
                isOpen={isDeleteModalOpen}
                fileName={pendingLabel}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmPermanentDeleteSelected}
            />
        </>
    );
};