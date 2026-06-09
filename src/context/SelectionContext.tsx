"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    Song,
    toggleSongFavorite,
    setSongDeleted,
    setSongProject,
    createSong,
} from "@/lib/songStore";
import {
    Project,
    toggleProjectFavorite,
    setProjectDeleted,
    createProject,
} from "@/lib/projectStore";

export interface SelectedItem {
    id: string;
    title: string;
    type: "song" | "project";
    originalItem: any;
}

interface SelectionContextType {
    selectedIds: string[];
    selectedItems: SelectedItem[];
    handleSelect: (
        id: string,
        type: "song" | "project",
        originalItem: any,
        event: React.MouseEvent,
        itemsInView: any[],
    ) => void;
    clearSelection: () => void;
    deleteSelected: () => void;
    favoriteSelected: () => void;
    duplicateSelected: () => void;
    shareSelected: () => void;
    downloadSelected: () => void;
    moveSelectedSongsToProject: (
        projectId: string,
        projectName: string,
    ) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
    undefined,
);

export const SelectionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [firstSelectedId, setFirstSelectedId] = useState<string | null>(null);
    const pathname = usePathname();

    // Clear selection on route change
    useEffect(() => {
        setSelectedItems([]);
        setFirstSelectedId(null);
    }, [pathname]);

    // Handle clicking outside card elements to deselect
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.closest("[role='menu']") || // Context menus
                target.closest(".selection-banner") || // Selection banner
                target.closest(".toast") ||
                target.closest("dialog") || // Modals
                target.closest(".modal") ||
                target.closest("button")
            ) {
                return;
            }

            // Do not clear if we clicked a card itself
            if (
                target.closest(".project-card") ||
                target.closest(".song-card")
            ) {
                return;
            }

            clearSelection();
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedIds = selectedItems.map((item) => item.id);

    const clearSelection = () => {
        setSelectedItems([]);
        setFirstSelectedId(null);
    };

    const handleSelect = (
        id: string,
        type: "song" | "project",
        originalItem: any,
        event: React.MouseEvent,
        itemsInView: any[],
    ) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;

        // If shift clicked and we have a starting point
        if (isShift && firstSelectedId && itemsInView.length > 0) {
            const idx1 = itemsInView.findIndex(
                (item) => item.id === firstSelectedId,
            );
            const idx2 = itemsInView.findIndex((item) => item.id === id);

            if (idx1 !== -1 && idx2 !== -1) {
                const start = Math.min(idx1, idx2);
                const end = Math.max(idx1, idx2);
                const rangeItems = itemsInView.slice(start, end + 1);

                const newSelections = rangeItems.map((item) => {
                    const itemType =
                        "audioSrc" in item || "origin" in item
                            ? ("song" as const)
                            : ("project" as const);
                    return {
                        id: item.id,
                        title: item.title,
                        type: itemType,
                        originalItem: item,
                    };
                });

                if (isCtrl) {
                    setSelectedItems((prev) => {
                        const filteredPrev = prev.filter(
                            (p) => !newSelections.some((ns) => ns.id === p.id),
                        );
                        return [...filteredPrev, ...newSelections];
                    });
                } else {
                    setSelectedItems(newSelections);
                }
                return;
            }
        }

        // Standard select/toggle behavior
        const existingIndex = selectedItems.findIndex((item) => item.id === id);
        const newItem = {
            id,
            title: originalItem.title || id,
            type,
            originalItem,
        };

        if (isCtrl) {
            if (existingIndex !== -1) {
                setSelectedItems((prev) =>
                    prev.filter((item) => item.id !== id),
                );
            } else {
                setSelectedItems((prev) => [...prev, newItem]);
                setFirstSelectedId(id);
            }
        } else {
            setSelectedItems([newItem]);
            setFirstSelectedId(id);
        }
    };

    const favoriteSelected = () => {
        if (selectedItems.length === 0) return;

        // Check if any of them are not favorited to determine if we are adding or removing
        const anyUnfavorited = selectedItems.some(
            (item) => !item.originalItem.isFavorite,
        );

        selectedItems.forEach((item) => {
            // If they have mismatching states, we favor adding to all
            const itemFav = !!item.originalItem.isFavorite;
            if (anyUnfavorited && !itemFav) {
                if (item.type === "song") toggleSongFavorite(item.id);
                else toggleProjectFavorite(item.id);
            } else if (!anyUnfavorited && itemFav) {
                if (item.type === "song") toggleSongFavorite(item.id);
                else toggleProjectFavorite(item.id);
            }
        });

        const action = anyUnfavorited
            ? "Added to Favorites"
            : "Removed from Favorites";
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `${action} for ${selectedItems.length} item(s)!`,
                },
            }),
        );
        clearSelection();
    };

    const deleteSelected = () => {
        if (selectedItems.length === 0) return;
        selectedItems.forEach((item) => {
            if (item.type === "song") {
                setSongDeleted(item.id, true);
            } else {
                setProjectDeleted(item.id, true);
            }
        });
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `${selectedItems.length} item(s) moved to Trash.`,
                },
            }),
        );
        clearSelection();
    };

    const duplicateSelected = () => {
        if (selectedItems.length === 0) return;
        selectedItems.forEach((item) => {
            if (item.type === "song") {
                createSong(
                    `${item.title} (Copy)`,
                    item.originalItem.projectId || "",
                    item.originalItem.projectName || "",
                );
            } else {
                createProject(
                    `${item.title} (Copy)`,
                    (item.originalItem.type as any) || "Album",
                );
            }
        });
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `${selectedItems.length} item(s) duplicated!`,
                },
            }),
        );
        clearSelection();
    };

    const shareSelected = () => {
        if (selectedItems.length === 0) return;
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `Sharing links generated for ${selectedItems.length} item(s)!`,
                },
            }),
        );
        clearSelection();
    };

    const downloadSelected = () => {
        if (selectedItems.length === 0) return;
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `Downloading ${selectedItems.length} item(s)...`,
                },
            }),
        );
        clearSelection();
    };

    const moveSelectedSongsToProject = (
        projectId: string,
        projectName: string,
    ) => {
        const songs = selectedItems.filter((item) => item.type === "song");
        if (songs.length === 0) return;
        songs.forEach((song) => {
            setSongProject(song.id, projectId, projectName);
        });
        const msg = projectId
            ? `Moved ${songs.length} song(s) to "${projectName}"`
            : `Unlinked ${songs.length} song(s) from project`;
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: msg },
            }),
        );
        clearSelection();
    };

    return (
        <SelectionContext.Provider
            value={{
                selectedIds,
                selectedItems,
                handleSelect,
                clearSelection,
                deleteSelected,
                favoriteSelected,
                duplicateSelected,
                shareSelected,
                downloadSelected,
                moveSelectedSongsToProject,
            }}
        >
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error("useSelection must be used within a SelectionProvider");
    }
    return context;
};
