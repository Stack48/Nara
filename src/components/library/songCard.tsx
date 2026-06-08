"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Heart, RotateCcw, Trash2, Plus, Music } from "lucide-react";
import { useAudioClick } from "@/hooks/useAudioClick";
import { Song } from "@/lib/songStore";
import { ALL_AVATARS, getOwnerAvatar } from "@/lib/avatars";
import { useRouter } from "next/navigation";
import { useRef } from "react";

const isValidImageSrc = (img: any): boolean => {
    if (!img) return false;
    if (typeof img === "string") return img.trim() !== "";
    if (typeof img === "object") return !!img.src;
    return false;
};

const formatDeletedTime = (timeStr: string) => {
    if (!timeStr) return "Deleted recently";
    const lower = timeStr.toLowerCase();
    if (lower.startsWith("deleted")) return timeStr;
    if (lower.startsWith("edited")) {
        return timeStr.replace(/^[Ee]dited\s+/, "Deleted ");
    }
    return `Deleted ${timeStr}`;
};

export interface SongCardProps {
    song?: Song;
    viewMode: "grid" | "list";
    context?:
        | "library"
        | "shared"
        | "deleted"
        | "favorite"
        | "recent"
        | "insideProject";
    index?: number;
    isLast?: boolean;
    onContextMenu?: React.MouseEventHandler;
    onRestore?: (id: string, title: string) => void;
    onPermanentDelete?: (id: string, title: string) => void;
    isCreatePlaceholder?: boolean;
    projectId?: string;
    projectName?: string;
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent) => void;
    onDragStart?: React.DragEventHandler;
    onDragOver?: React.DragEventHandler;
    onDragEnd?: React.DragEventHandler;
    onDragEnter?: React.DragEventHandler;
    onDragLeave?: React.DragEventHandler;
    onDrop?: React.DragEventHandler;
    isDragOver?: boolean;
    dragOverType?: "insert-before" | "insert-after" | "swap" | null;
}

export const SongCard = ({
    song,
    viewMode,
    context = "library",
    index = 0,
    isLast = false,
    onContextMenu,
    onRestore,
    onPermanentDelete,
    isCreatePlaceholder = false,
    projectId = "",
    projectName = "",
    isSelected = false,
    onSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDrop,
    isDragOver = false,
    dragOverType = null,
}: SongCardProps) => {
    const router = useRouter();
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { togglePlay, isPlaying } = useAudioClick(song?.audioSrc || "", 30);

    if (isCreatePlaceholder) {
        const handleClick = () => {
            window.dispatchEvent(
                new CustomEvent("open-create-modal", {
                    detail: {
                        type: "song",
                        projectId: projectId,
                        projectName: projectName,
                    },
                }),
            );
        };

        if (viewMode === "grid") {
            return (
                <button
                    type="button"
                    onClick={handleClick}
                    className="bg-[#151515]/30 border border-dashed border-neutral-800 hover:border-[#D90097]/60 hover:bg-[#121212]/50 transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-pointer animate-in fade-in relative items-center text-left"
                >
                    {/* Cover Image Container Placeholder */}
                    <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl border border-dashed border-neutral-800/80 group-hover:border-[#D90097]/40 flex items-center justify-center flex-shrink-0 bg-[#171717]/50 transition-colors">
                        <Plus
                            size={24}
                            className="text-neutral-500 group-hover:text-[#D90097] transition-colors"
                        />
                    </div>
                    {/* Content Container */}
                    <div className="flex flex-col flex-1 justify-center py-1.5">
                        <h3 className="font-syne font-bold text-neutral-400 group-hover:text-white transition-colors text-base">
                            New Song
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 font-medium font-arimo">
                            Create a standalone track or add to project
                        </p>
                    </div>
                </button>
            );
        }

        // List View
        return (
            <button
                type="button"
                onClick={handleClick}
                className="w-full grid grid-cols-12 gap-4 items-center p-3 rounded-xl border border-dashed border-neutral-800/80 hover:border-[#D90097]/60 hover:bg-[#121212]/50 transition-all duration-300 group cursor-pointer text-left mb-2"
            >
                <div className="col-span-12 flex items-center gap-4 pl-1">
                    <div className="w-12 h-12 rounded-xl border border-dashed border-neutral-700/80 group-hover:border-[#D90097]/40 flex items-center justify-center bg-[#171717]/50 transition-colors">
                        <Plus
                            size={16}
                            className="text-neutral-400 group-hover:text-[#D90097]"
                        />
                    </div>
                    <span className="font-bold text-sm text-neutral-400 group-hover:text-white transition-colors font-syne">
                        New Song
                    </span>
                </div>
            </button>
        );
    }

    if (!song) return null;

    const isDeletedView = context === "deleted";
    const isSharedView = context === "shared";
    const isInsideProjectView = context === "insideProject";

    const handleDragStart = (e: React.DragEvent) => {
        // Disable drag for deleted view
        if (isDeletedView) return;

        e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
                id: song.id,
                title: song.title,
                projectId: song.projectId || "",
                projectName: song.projectName || "",
            }),
        );
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isCreatePlaceholder) return;
        e.preventDefault();
        e.stopPropagation();

        const ctrlKey = e.ctrlKey || e.metaKey;
        const metaKey = e.metaKey;
        const shiftKey = e.shiftKey;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return;
        }

        clickTimeoutRef.current = setTimeout(() => {
            if (onSelect) {
                onSelect({ ctrlKey, metaKey, shiftKey } as any);
            }
            clickTimeoutRef.current = null;
        }, 200);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (isCreatePlaceholder) return;
        e.preventDefault();
        e.stopPropagation();

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        router.push(`/songs/${song.id}`);
    };

    // Grid View
    if (viewMode === "grid") {
        return (
            <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                className={`border transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group ${
                    isSelected
                        ? "bg-[#D90097]/5 border-[#D90097] shadow-[0_0_15px_rgba(217,0,151,0.15)]"
                        : isDragOver && dragOverType === "swap"
                          ? "bg-[#D90097]/10 border-[#D90097] shadow-[0_0_15px_rgba(217,0,151,0.2)] scale-[1.02]"
                          : "bg-[#151515] border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a]"
                } ${
                    isDeletedView
                        ? "cursor-context-menu"
                        : "cursor-grab active:cursor-grabbing song-card"
                } animate-in fade-in relative`}
                draggable={!isDeletedView}
                onDragStart={onDragStart || handleDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onContextMenu={onContextMenu}
            >
                {/* Visual Drag Insertion Indicators for Grid View */}
                {isDragOver && dragOverType === "insert-before" && (
                    <div className="absolute top-0 bottom-0 left-[-10px] w-[3px] bg-[#D90097] shadow-[0_0_10px_rgba(217,0,151,0.8)] z-30 animate-pulse rounded-full" />
                )}
                {isDragOver && dragOverType === "insert-after" && (
                    <div className="absolute top-0 bottom-0 right-[-10px] w-[3px] bg-[#D90097] shadow-[0_0_10px_rgba(217,0,151,0.8)] z-30 animate-pulse rounded-full" />
                )}

                {/* Cover Image Container */}
                <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer">
                    {isValidImageSrc(song.image) ? (
                        <Image
                            src={song.image}
                            alt={song.title}
                            fill
                            className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
                            sizes="(max-width: 640px) 100vw, 128px"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-[#181818] to-neutral-950 flex items-center justify-center transition-all duration-500 group-hover:scale-105">
                            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/10 border border-neutral-800/30 group-hover:border-[#D90097]/20 group-hover:bg-[#D90097]/5 transition-all duration-500">
                                <Music
                                    size={28}
                                    className="text-neutral-500 group-hover:text-[#D90097] transition-all duration-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Favorite badge */}
                    {song.isFavorite && (
                        <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm p-1 rounded-full text-[#D90097]">
                            <Heart
                                size={12}
                                className=" text-red-500 fill-red-500"
                            />
                        </div>
                    )}

                    {/* Hover Play/Pause Overlay */}
                    {song.audioSrc && (
                        <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                                className={`w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                            >
                                {isPlaying ? (
                                    <Pause
                                        size={16}
                                        className="text-white fill-white"
                                    />
                                ) : (
                                    <Play
                                        size={16}
                                        className="text-white fill-white ml-0.5"
                                    />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Container */}
                <div className="flex flex-col flex-1 justify-between py-1.5 relative sm:min-h-[128px]">
                    {/* Vertical centering container for Title + Project */}
                    <div
                        className="flex-1 flex flex-col justify-center"
                    >
                        <h3
                            className={`font-bold text-white line-clamp-2 leading-snug pr-2 flex items-center gap-2 ${
                                isInsideProjectView
                                    ? "text-base mt-1"
                                    : `text-[17px] sm:text-[18px] ${!isDeletedView ? "sm:pr-16" : ""}`
                            }`}
                        >
                            {isInsideProjectView && (
                                <span className="text-xs font-bold text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded font-mono shrink-0">
                                    {index + 1}
                                </span>
                            )}
                            <span>{song.title}</span>
                        </h3>

                        {song.projectName && !isInsideProjectView && (
                            <Link
                                href={
                                    isSharedView || song.isShared
                                        ? `/shared/${song.projectId}`
                                        : `/projects/${song.projectId}`
                                }
                                className="text-xs text-neutral-400 font-semibold mt-1 block hover:text-white hover:underline transition-colors w-fit pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {song.projectName}
                            </Link>
                        )}

                        {(isSharedView || song.isShared) && (
                            <span className="text-[11px] text-[#D90097] font-semibold mt-0.5 block">
                                Shared by {song.owner}
                            </span>
                        )}
                    </div>

                    {/* Bottom container for Time & Collaborators/Owner */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900 sm:border-t-0 sm:pt-0 sm:mt-0">
                        <span className="text-[11px] text-neutral-400 font-medium">
                            {isDeletedView
                                ? formatDeletedTime(song.time)
                                : song.time}
                        </span>

                        <div className="flex items-center gap-1.5">
                            {isInsideProjectView ? (
                                <>
                                    <span className="text-[10px] text-neutral-500 hidden sm:block">
                                        Collaborators ({song.collabs})
                                    </span>
                                    <div className="flex -space-x-2">
                                        {[
                                            ...Array(Math.min(song.collabs, 3)),
                                        ].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full overflow-hidden relative z-10"
                                            >
                                                <Image
                                                    src={
                                                        ALL_AVATARS[
                                                            (index + i) %
                                                                ALL_AVATARS.length
                                                        ]
                                                    }
                                                    alt={`Collab ${i + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="24px"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : song.owner &&
                              !(isSharedView || song.isShared) ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-neutral-400 hidden sm:block">
                                        Owner: {song.owner}
                                    </span>
                                    <div className="w-6 h-6 rounded-full overflow-hidden relative z-10">
                                        <Image
                                            src={
                                                getOwnerAvatar(
                                                    song.owner,
                                                    index,
                                                ) ||
                                                ALL_AVATARS[
                                                    index % ALL_AVATARS.length
                                                ]
                                            }
                                            alt={song.owner}
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex -space-x-2">
                                        {[
                                            ...Array(Math.min(song.collabs, 3)),
                                        ].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full border border-neutral-800 overflow-hidden relative z-10"
                                            >
                                                <Image
                                                    src={
                                                        ALL_AVATARS[
                                                            (index + i) %
                                                                ALL_AVATARS.length
                                                        ]
                                                    }
                                                    alt={`Collab ${i + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="24px"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {song.collabs > 3 && (
                                        <span className="text-[10px] text-neutral-400 font-semibold ml-1.5">
                                            +{song.collabs - 3}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* State Badge in Top Right */}
                    {!isDeletedView &&
                        (!isInsideProjectView ? (
                            <span className="absolute top-0 right-0 border border-neutral-800 bg-neutral-900/50 text-neutral-400 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                                {song.state}
                            </span>
                        ) : (
                            <span
                                className={`sm:absolute sm:top-0 sm:right-0 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit ${
                                    song.title === "F.I.C.O."
                                        ? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
                                        : "border border-neutral-700 text-neutral-400"
                                }`}
                            >
                                {song.state}
                            </span>
                        ))}
                </div>
            </div>
        );
    }

    // --- VUE LISTE (TABLEAU) ---
    const listContent = (
        <div className={`grid grid-cols-12 gap-4 items-center p-2 rounded-xl transition-all duration-200 group relative ${
            isSelected
                ? "bg-[#D90097]/10 border border-[#D90097]/30 shadow-[0_0_10px_rgba(217,0,151,0.1)]"
                : isDragOver && dragOverType === "swap"
                  ? "bg-[#D90097]/15 border border-[#D90097]/50 shadow-[0_0_12px_rgba(217,0,151,0.2)] scale-[1.01]"
                  : "hover:bg-[#151515]"
        }`}>

            {/* Name + Image */}
            <div
                className={`${
                    isInsideProjectView
                        ? "col-span-4"
                        : isSharedView
                          ? "col-span-3"
                          : "col-span-4"
                } flex items-center gap-4 pl-1`}
            >
                {isInsideProjectView && (
                    <span className="text-xs font-bold text-neutral-500 min-w-[16px] text-center font-mono shrink-0">
                        {index + 1}
                    </span>
                )}
                <div className="relative w-14 h-14 flex-shrink-0 mt-1 mb-1">
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-neutral-700 z-10 bg-gradient-to-br from-neutral-900 to-neutral-950 flex items-center justify-center">
                        {isValidImageSrc(song.image) ? (
                            <Image
                                src={song.image}
                                alt={song.title}
                                fill
                                className="object-cover"
                                sizes="56px"
                            />
                        ) : (
                            <Music
                                size={20}
                                className="text-neutral-500 group-hover:text-[#D90097] transition-colors duration-300"
                            />
                        )}
                        {song.audioSrc && (
                            <div
                                className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"} z-20`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className={`w-7 h-7 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_10px_rgba(217,0,151,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                                >
                                    {isPlaying ? (
                                        <Pause
                                            size={12}
                                            className="text-white fill-white"
                                        />
                                    ) : (
                                        <Play
                                            size={12}
                                            className="text-white fill-white ml-0.5"
                                        />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`font-bold text-sm transition-colors line-clamp-1 ${isPlaying ? "text-[#D90097]" : "text-white"}`}
                        >
                            {song.title}
                        </span>
                        {song.isFavorite && (
                            <Heart
                                size={12}
                                className=" text-red-500 fill-red-500 flex-shrink-0"
                            />
                        )}
                    </div>
                    {song.projectName && !isInsideProjectView && (
                        <Link
                            href={
                                isSharedView || song.isShared
                                    ? `/shared/${song.projectId}`
                                    : `/projects/${song.projectId}`
                            }
                            className="text-[10px] text-neutral-500 font-semibold tracking-wider hover:text-white hover:underline transition-colors w-fit pointer-events-auto mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {song.projectName}
                        </Link>
                    )}
                </div>
            </div>

            {/* Layout adaptable en colonnes selon le contexte */}
            {isDeletedView ? (
                <>
                    {/* Deleted time */}
                    <div className="col-span-3 text-xs text-white truncate">
                        {formatDeletedTime(song.time)}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-3 flex items-center">
                        {song.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(song.collabs, 3))].map(
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                        >
                                            <Image
                                                src={
                                                    ALL_AVATARS[
                                                        (index + i) %
                                                            ALL_AVATARS.length
                                                    ]
                                                }
                                                alt="Collab"
                                                fill
                                                className="object-cover"
                                                sizes="24px"
                                            />
                                        </div>
                                    ),
                                )}
                                {song.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-neutral-600">-</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-2 pr-2 relative z-20">
                        <button
                            className="p-1.5 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                            title="Restaurer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore?.(song.id, song.title);
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer définitivement"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPermanentDelete?.(song.id, song.title);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </>
            ) : isSharedView ? (
                <>
                    {/* Owner */}
                    <div className="col-span-2 text-xs text-[#D90097] font-semibold truncate">
                        {song.owner}
                    </div>

                    {/* State */}
                    <div className="col-span-1 text-xs font-bold text-white truncate">
                        {song.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {song.created}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-2 flex items-center">
                        {song.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(song.collabs, 3))].map(
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                        >
                                            <Image
                                                src={
                                                    ALL_AVATARS[
                                                        (index + i) %
                                                            ALL_AVATARS.length
                                                    ]
                                                }
                                                alt="Collab"
                                                fill
                                                className="object-cover"
                                                sizes="24px"
                                            />
                                        </div>
                                    ),
                                )}
                                {song.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-neutral-600">-</span>
                        )}
                    </div>
                </>
            ) : isInsideProjectView ? (
                <>
                    {/* State */}
                    <div className="col-span-2 text-xs font-bold">
                        {song.title === "F.I.C.O." ? (
                            <span className="bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] inline-block">
                                {song.state}
                            </span>
                        ) : (
                            <span className="text-white">{song.state}</span>
                        )}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-neutral-400">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-neutral-400">
                        {song.created}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-2 flex items-center">
                        {song.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(song.collabs, 3))].map(
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                        >
                                            <Image
                                                src={
                                                    ALL_AVATARS[
                                                        (index + i) %
                                                            ALL_AVATARS.length
                                                    ]
                                                }
                                                alt="Collab"
                                                fill
                                                className="object-cover"
                                                sizes="24px"
                                            />
                                        </div>
                                    ),
                                )}
                                {song.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-neutral-600">-</span>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* State */}
                    <div className="col-span-2 text-xs font-bold text-white truncate">
                        {song.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {song.created}
                    </div>

                    {/* Collaborators / Owner */}
                    <div className="col-span-2 flex items-center">
                        {song.owner ? (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10">
                                    <Image
                                        src={
                                            getOwnerAvatar(song.owner, index) ||
                                            ALL_AVATARS[
                                                index % ALL_AVATARS.length
                                            ]
                                        }
                                        alt={song.owner}
                                        fill
                                        className="object-cover"
                                        sizes="24px"
                                    />
                                </div>
                                <span className="text-xs text-neutral-400 truncate max-w-[100px] hidden md:block">
                                    {song.owner}
                                </span>
                            </div>
                        ) : song.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(song.collabs, 3))].map(
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                        >
                                            <Image
                                                src={
                                                    ALL_AVATARS[
                                                        (index + i) %
                                                            ALL_AVATARS.length
                                                    ]
                                                }
                                                alt="Collab"
                                                fill
                                                className="object-cover"
                                                sizes="24px"
                                            />
                                        </div>
                                    ),
                                )}
                                {song.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-neutral-600">-</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div
            className={`flex flex-col song-card relative ${isDeletedView ? "" : "cursor-grab active:cursor-grabbing"}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable={!isDeletedView}
            onDragStart={onDragStart || handleDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onContextMenu={onContextMenu}
        >
            {/* Visual Drag Insertion Indicators for List View */}
            {isDragOver && dragOverType === "insert-before" && (
                <div className="absolute top-[-5px] left-0 right-0 h-[3px] bg-[#D90097] shadow-[0_0_10px_rgba(217,0,151,0.8)] z-30 animate-pulse rounded-full" />
            )}
            {isDragOver && dragOverType === "insert-after" && (
                <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-[#D90097] shadow-[0_0_10px_rgba(217,0,151,0.8)] z-30 animate-pulse rounded-full" />
            )}
            {listContent}
        </div>
    );
};
