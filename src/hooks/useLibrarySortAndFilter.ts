import { useState, useMemo } from "react";

export type SortByOption = "alphabetical" | "created" | "modified" | "owner" | "custom";
export type SortOrderOption = "asc" | "desc";
export type ViewMode = "grid" | "list";

export interface SortableItem {
    id: string;
    title: string;
    createdDate?: Date;
    lastModifiedDate?: Date;
    owner?: string;
    author?: string;
    position?: number;
    [key: string]: any;
}

interface UseLibrarySortAndFilterProps<T extends SortableItem> {
    items: T[];
    searchKeys: (keyof T)[];
    defaultSortBy?: SortByOption;
    defaultSortOrder?: SortOrderOption;
    defaultViewMode?: ViewMode;
}

export function sortItems<T extends SortableItem>(
    items: T[],
    sortBy: SortByOption,
    sortOrder: SortOrderOption
): T[] {
    return [...items].sort((a, b) => {
        if (sortBy === "alphabetical") {
            const comparison = a.title.localeCompare(b.title);
            return sortOrder === "asc" ? comparison : -comparison;
        } else if (sortBy === "created") {
            const dateA = a.createdDate?.getTime() || 0;
            const dateB = b.createdDate?.getTime() || 0;
            const comparison = dateA - dateB;
            return sortOrder === "asc" ? comparison : -comparison;
        } else if (sortBy === "owner") {
            const ownerA = (a.owner || a.author || "").toLowerCase();
            const ownerB = (b.owner || b.author || "").toLowerCase();
            const comparison = ownerA.localeCompare(ownerB);
            return sortOrder === "asc" ? comparison : -comparison;
        } else if (sortBy === "custom") {
            const posA = typeof a.position === "number" ? a.position : 99999;
            const posB = typeof b.position === "number" ? b.position : 99999;
            const comparison = posA - posB;
            return sortOrder === "asc" ? comparison : -comparison;
        } else {
            // modified
            const dateA = a.lastModifiedDate?.getTime() || 0;
            const dateB = b.lastModifiedDate?.getTime() || 0;
            const comparison = dateA - dateB;
            return sortOrder === "asc" ? comparison : -comparison;
        }
    });
}

export function useLibrarySortAndFilter<T extends SortableItem>({
    items,
    searchKeys,
    defaultSortBy = "modified",
    defaultSortOrder = "desc",
    defaultViewMode = "grid",
}: UseLibrarySortAndFilterProps<T>) {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
    const [sortBy, setSortBy] = useState<SortByOption>(defaultSortBy);
    const [sortOrder, setSortOrder] = useState<SortOrderOption>(defaultSortOrder);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAndSortedItems = useMemo(() => {
        // 1. Filtrage (Recherche)
        const filtered = items.filter((item) => {
            if (!searchQuery.trim()) return true;
            
            const query = searchQuery.toLowerCase();
            return searchKeys.some((key) => {
                const value = item[key];
                if (typeof value === "string") {
                    return value.toLowerCase().includes(query);
                }
                return false;
            });
        });

        // 2. Tri
        return sortItems(filtered, sortBy, sortOrder);
    }, [items, searchKeys, searchQuery, sortBy, sortOrder]);

    return {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        filteredAndSortedItems,
    };
}
