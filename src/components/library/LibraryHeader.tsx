"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, LayoutGrid, List, Check } from "lucide-react";
import { SortByOption, SortOrderOption, ViewMode } from "@/hooks/useLibrarySortAndFilter";

export interface SortOptionDefinition {
    id: SortByOption;
    label: string;
}

export interface FilterOptionDefinition {
    id: string;
    label: string;
}

interface LibraryHeaderProps {
    title: React.ReactNode;
    itemCount: number;
    itemLabelSingular?: string;
    itemLabelPlural?: string;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    sortBy: SortByOption;
    setSortBy: (val: SortByOption) => void;
    sortOrder: SortOrderOption;
    setSortOrder: (val: SortOrderOption) => void;
    sortOptions?: SortOptionDefinition[];
    viewMode: ViewMode;
    setViewMode: (val: ViewMode) => void;
    filterLabel?: string;
    filterOptions?: FilterOptionDefinition[];
    filterValue?: string;
    setFilterValue?: (val: string) => void;
    children?: React.ReactNode;
}

export const LibraryHeader = ({
    title,
    itemCount,
    itemLabelSingular = "item",
    itemLabelPlural = "items",
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    sortOptions = [
        { id: "alphabetical", label: "Alphabetical" },
        { id: "created", label: "Date created" },
        { id: "modified", label: "Last modified" },
    ],
    viewMode,
    setViewMode,
    filterLabel = "Filter",
    filterOptions,
    filterValue,
    setFilterValue,
    children,
}: LibraryHeaderProps) => {
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setIsSortMenuOpen(false);
            }
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setIsFilterMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getSortLabel = () => {
        const option = sortOptions.find((opt) => opt.id === sortBy);
        return option ? option.label : "Sort";
    };

    const getFilterLabel = () => {
        if (!filterOptions) return filterLabel;
        const option = filterOptions.find((opt) => opt.id === filterValue);
        return option ? option.label : filterLabel;
    };

    return (
        <>
            {/* TITRE */}
            <h1 className="text-xl font-bold font-syne mb-6">{title}</h1>

            {/* BARRE DE RECHERCHE */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400" />
                </div>
                <input
                    type="text"
                    placeholder={`Search ${itemLabelPlural}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
            </div>

            {/* ONGLETS ET FILTRES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {/* Compteur à gauche */}
                <div className="text-sm font-semibold text-neutral-400">
                    {itemCount} {itemCount === 1 ? itemLabelSingular : itemLabelPlural}
                </div>

                {/* Filtres de droite */}
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap pb-2 md:pb-0">
                    
                    {/* Extra Filters (passed as children) */}
                    {children}

                    {/* Generic Dropdown Filtre */}
                    {filterOptions && filterOptions.length > 0 && setFilterValue && (
                        <div className="relative" ref={filterMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                className="flex items-center gap-2 bg-[#151515] border border-neutral-800 hover:border-neutral-700 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                            >
                                <span>{getFilterLabel()}</span>
                                <ChevronDown size={14} className="text-neutral-400" />
                            </button>

                            {isFilterMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl z-50 py-2.5 px-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                        {filterLabel}
                                    </div>
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => {
                                                setFilterValue(option.id);
                                                setIsFilterMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                {filterValue === option.id && (
                                                    <Check size={12} strokeWidth={3} className="text-[#D90097]" />
                                                )}
                                            </div>
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dropdown Tri */}
                    <div className="relative" ref={sortMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            className="flex items-center gap-2 bg-[#151515] border border-neutral-800 hover:border-neutral-700 transition-colors px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                        >
                            <span>{getSortLabel()}</span>
                            <ChevronDown size={14} className="text-neutral-400" />
                        </button>

                        {isSortMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl z-50 py-2.5 px-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* Section Sort by */}
                                <div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Sort by
                                </div>
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(option.id);
                                            setIsSortMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                            {sortBy === option.id && <Check size={12} strokeWidth={3} className="text-[#D90097]" />}
                                        </div>
                                        <span>{option.label}</span>
                                    </button>
                                ))}

                                {/* Divider */}
                                <hr className="border-neutral-800/80 my-1.5 mx-1" />

                                {/* Section Order */}
                                <div className="px-3 py-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Order
                                </div>
                                {[
                                    { id: "asc", label: sortBy === "alphabetical" ? "A to Z" : "Oldest first" },
                                    { id: "desc", label: sortBy === "alphabetical" ? "Z to A" : "Newest first" },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setSortOrder(option.id as SortOrderOption);
                                            setIsSortMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                            {sortOrder === option.id && <Check size={12} strokeWidth={3} className="text-[#D90097]" />}
                                        </div>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Toggle View (Grille / Liste) */}
                    <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden shrink-0 ml-2">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
