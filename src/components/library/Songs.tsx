"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useSongs, Song, renameSong } from "@/lib/songStore";
import { MenuContext } from "@/context/MenuContext";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { SongCard } from "./songCard";
import { useSelection } from "@/context/SelectionContext";

export const Songs = () => {
    // État pour le filtrage par origine (standalone ou projet)
    const [filterOrigin, setFilterOrigin] = useState<
        "all" | "standalone" | "project"
    >("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(event.target as Node)
            ) {
                setIsFilterMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getFilterLabel = () => {
        if (filterOrigin === "all") return "All songs";
        if (filterOrigin === "standalone") return "Standalone";
        return "In a project";
    };

    const allSongs = useSongs();

    // Pre-filtrer par "origin" et supprimer les deleted
    const preFilteredSongs = allSongs.filter((song) => {
        if (song.isDeleted) return false;
        if (filterOrigin === "all") return true;
        return song.origin === filterOrigin;
    });

    const { selectedIds, handleSelect } = useSelection();

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        filteredAndSortedItems: sortedSongsList,
    } = useLibrarySortAndFilter({
        items: preFilteredSongs,
        searchKeys: ["title", "projectName"],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
        storageKey: "songs",
    });

    const handleHeaderSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "alphabetical" ? "asc" : "desc");
        }
    };

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        song: Song;
    } | null>(null);
    const [renameModal, setRenameModal] = useState<{
        songId: string;
        initialTitle: string;
    } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, song: Song) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            song,
        });
    };

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title="All songs"
                itemCount={sortedSongsList.length}
                itemLabelSingular="song"
                itemLabelPlural="songs"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
            >
                {/* Extra Filter: Dropdown Filtre Origine */}
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
                                Filter by origin
                            </div>
                            {[
                                { id: "all", label: "All songs" },
                                { id: "standalone", label: "Standalone" },
                                { id: "project", label: "In a project" },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        setFilterOrigin(option.id as any);
                                        setIsFilterMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                        {filterOrigin === option.id && (
                                            <Check
                                                size={12}
                                                strokeWidth={3}
                                                className="text-[#D90097]"
                                            />
                                        )}
                                    </div>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </LibraryHeader>

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {sortedSongsList.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No songs found matching "{searchQuery}".</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <SongCard
                        viewMode="grid"
                        context="library"
                        isCreatePlaceholder={true}
                    />
                    {sortedSongsList.map((song, index) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            viewMode="grid"
                            context="library"
                            index={index}
                            isSelected={selectedIds.includes(song.id)}
                            onSelect={(e) => handleSelect(song.id, "song", song, e, sortedSongsList)}
                            onContextMenu={(e) => handleContextMenu(e, song)}
                        />
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE (TABLEAU) --- */
                <div className="w-full">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("alphabetical")}
                            className="col-span-4 pl-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Name</span>
                            {sortBy === "alphabetical" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <div className="col-span-2">State</div>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("modified")}
                            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Last modified</span>
                            {sortBy === "modified" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("created")}
                            className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left font-medium"
                        >
                            <span>Created</span>
                            {sortBy === "created" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <div className="col-span-2">Collaborators</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        <SongCard
                            viewMode="list"
                            context="library"
                            isCreatePlaceholder={true}
                        />
                        {sortedSongsList.map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                viewMode="list"
                                context="library"
                                index={index}
                                isLast={index === sortedSongsList.length - 1}
                                isSelected={selectedIds.includes(song.id)}
                                onSelect={(e) => handleSelect(song.id, "song", song, e, sortedSongsList)}
                                onContextMenu={(e) =>
                                    handleContextMenu(e, song)
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Custom overlays for actions */}
            {contextMenu && (
                <MenuContext
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemType="song"
                    song={contextMenu.song}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() =>
                        setRenameModal({
                            songId: contextMenu.song.id,
                            initialTitle: contextMenu.song.title,
                        })
                    }
                />
            )}

            {renameModal && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setRenameModal(null)}
                    title="Rename song"
                    label="Song Title"
                    placeholder="Enter song title"
                    initialValue={renameModal.initialTitle}
                    onSave={(newValue) => {
                        renameSong(renameModal.songId, newValue);
                        window.dispatchEvent(
                            new CustomEvent("show-nara-toast", {
                                detail: {
                                    message: `Song renamed to "${newValue}"`,
                                },
                            }),
                        );
                    }}
                />
            )}
        </div>
    );
};
