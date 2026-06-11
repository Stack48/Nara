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

    const handleCreateSong = async () => {
        console.log("Creating song...");
        try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const user = await getCurrentUser();
            console.log("User:", user.userId);
            const res = await fetch("/api/songs/new", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-cognito-id": user.userId,
                },
                body: JSON.stringify({ 
                    title: "Sans titre",
                    projectId: projectId || null,
                }),
            });
            if (!res.ok) throw new Error("Erreur création");
            const data = await res.json();
            router.push(`/write/${data.id}`);
        } catch (err) {
            console.error("Create song error:", err);
        }
    };

    if (isCreatePlaceholder) {
        if (viewMode === "grid") {
            return (
                <button
                    onClick={handleCreateSong}
                    className="w-full bg-n-surface/30 border border-dashed border-n-border hover:border-[#b4783c]/60 hover:bg-n-bg/50 transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group cursor-pointer animate-in fade-in relative items-center text-left"
                >
                    {/* Cover Image Container Placeholder */}
                    <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl border border-dashed border-n-border/80 group-hover:border-[#b4783c]/40 flex items-center justify-center flex-shrink-0 bg-n-hover/50 transition-colors">
                        <Plus
                            size={24}
                            className="text-n-text-2 group-hover:text-[#b4783c] transition-colors"
                        />
                    </div>
                    {/* Content Container */}
                    <div className="flex flex-col flex-1 justify-center py-1.5">
                        <h3 className="font-serif font-bold text-n-text-2 group-hover:text-n-text transition-colors text-base">
                            New Song
                        </h3>
                        <p className="text-xs text-n-text-2 mt-1 font-medium font-arimo">
                            Create a standalone track or add to project
                        </p>
                    </div>
                </button>
            );
        }

        // List View
        return (
            <button
                onClick={handleCreateSong}
                className="w-full grid grid-cols-12 gap-4 items-center p-3 rounded-xl border border-dashed border-n-border/80 hover:border-[#b4783c]/60 hover:bg-n-bg/50 transition-all duration-300 group cursor-pointer text-left mb-2"
            >
                <div className="col-span-12 flex items-center gap-4 pl-1">
                    <div className="w-12 h-12 rounded-xl border border-dashed border-n-border-2/80 group-hover:border-[#b4783c]/40 flex items-center justify-center bg-n-hover/50 transition-colors">
                        <Plus
                            size={16}
                            className="text-n-text-2 group-hover:text-[#b4783c]"
                        />
                    </div>
                    <span className="font-bold text-sm text-n-text-2 group-hover:text-n-text transition-colors font-serif">
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
    const isDraggable = 
        (context === "library" || context === "insideProject" || context === "recent") && 
        !song.owner && 
        !song.isShared;

    const handleDragStart = (e: React.DragEvent) => {
        if (!isDraggable) {
            e.preventDefault();
            return;
        }
        window.dispatchEvent(new CustomEvent("nara-song-drag-start"));

        e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
                id: song.id,
                title: song.title,
                projectId: song.projectId || "",
                projectName: song.projectName || "",
            }),
        );

        // Custom drag preview element (vignette + title) positioned to the right of the cursor
        const dragPreview = document.createElement("div");
        dragPreview.style.position = "absolute";
        dragPreview.style.top = "-1000px";
        dragPreview.style.left = "-1000px";
        dragPreview.style.display = "flex";
        dragPreview.style.alignItems = "center";
        dragPreview.style.gap = "10px";
        dragPreview.style.padding = "6px 12px 6px 36px"; // 36px left padding to offset the cursor
        dragPreview.style.background = "#151515";
        dragPreview.style.border = "1px solid #262626";
        dragPreview.style.borderRadius = "12px";
        dragPreview.style.boxShadow = "0 8px 25px rgba(0,0,0,0.6)";
        dragPreview.style.color = "white";
        dragPreview.style.fontFamily = "Syne, sans-serif";
        dragPreview.style.fontWeight = "bold";
        dragPreview.style.fontSize = "13px";
        dragPreview.style.pointerEvents = "none";
        dragPreview.style.zIndex = "9999";

        // Create cover thumbnail (vignette) using cloned DOM image if loaded, or fallback
        const existingImg = e.currentTarget.querySelector("img");
        let imgEl: HTMLElement;
        if (existingImg && existingImg.src) {
            const clonedImg = existingImg.cloneNode(true) as HTMLImageElement;
            clonedImg.style.width = "32px";
            clonedImg.style.height = "32px";
            clonedImg.style.objectFit = "cover";
            clonedImg.style.borderRadius = "6px";
            clonedImg.style.position = "static";
            clonedImg.removeAttribute("class");
            imgEl = clonedImg;
        } else {
            const fallbackDiv = document.createElement("div");
            fallbackDiv.style.background = "linear-gradient(135deg, #AB0063, #D50093)";
            fallbackDiv.style.width = "32px";
            fallbackDiv.style.height = "32px";
            fallbackDiv.style.borderRadius = "6px";
            imgEl = fallbackDiv;
        }
        dragPreview.appendChild(imgEl);

        // Create title
        const titleSpan = document.createElement("span");
        titleSpan.innerText = song.title;
        titleSpan.style.whiteSpace = "nowrap";
        titleSpan.style.overflow = "hidden";
        titleSpan.style.textOverflow = "ellipsis";
        titleSpan.style.maxWidth = "160px";
        dragPreview.appendChild(titleSpan);

        document.body.appendChild(dragPreview);

        // Offset: 10px from the left, 18px from the top of the padding-covered zone
        e.dataTransfer.setDragImage(dragPreview, 10, 18);

        setTimeout(() => {
            if (dragPreview.parentNode) {
                dragPreview.parentNode.removeChild(dragPreview);
            }
        }, 0);
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

        router.push(`/write/${song.id}`);
    };

    // Grid View
    if (viewMode === "grid") {
        return (
            <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                className={`border transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 group ${
                    isSelected
                        ? "bg-[#b4783c]/5 border-[#b4783c] shadow-[0_0_15px_rgba(180,120,60,0.15)]"
                        : isDragOver && dragOverType === "swap"
                          ? "bg-[#b4783c]/10 border-[#b4783c] shadow-[0_0_15px_rgba(180,120,60,0.2)] scale-[1.02]"
                          : "bg-n-surface border-n-border/80 hover:border-neutral-600 hover:bg-n-surface-2"
                } ${
                    isDraggable
                        ? "cursor-grab active:cursor-grabbing"
                        : isDeletedView
                          ? "cursor-context-menu"
                          : "cursor-pointer"
                } song-card animate-in fade-in relative`}
                draggable={isDraggable}
                onDragStart={(e) => {
                    handleDragStart(e);
                    if (onDragStart) onDragStart(e);
                }}
                onDragOver={onDragOver}
                onDragEnd={(e) => {
                    window.dispatchEvent(new CustomEvent("nara-song-drag-end"));
                    if (onDragEnd) onDragEnd(e);
                }}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onContextMenu={onContextMenu}
            >
                {/* Visual Drag Insertion Indicators for Grid View */}
                {isDragOver && dragOverType === "insert-before" && (
                    <div className="absolute top-0 bottom-0 left-[-10px] w-[3px] bg-[#b4783c] shadow-[0_0_10px_rgba(180,120,60,0.8)] z-30 animate-pulse rounded-full" />
                )}
                {isDragOver && dragOverType === "insert-after" && (
                    <div className="absolute top-0 bottom-0 right-[-10px] w-[3px] bg-[#b4783c] shadow-[0_0_10px_rgba(180,120,60,0.8)] z-30 animate-pulse rounded-full" />
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
                            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-n-hover/10 border border-n-border/30 group-hover:border-[#b4783c]/20 group-hover:bg-[#b4783c]/5 transition-all duration-500">
                                <Music
                                    size={28}
                                    className="text-n-text-2 group-hover:text-[#b4783c] transition-all duration-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Favorite badge */}
                    {song.isFavorite && (
                        <div className="absolute top-2 left-2 z-20 bg-n-bg/60 backdrop-blur-sm p-1 rounded-full text-[#b4783c]">
                            <Heart
                                size={12}
                                className=" text-red-500 fill-red-500"
                            />
                        </div>
                    )}

                    {/* Hover Play/Pause Overlay */}
                    {song.audioSrc && (
                        <div
                            className={`absolute inset-0 bg-n-bg/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                                className={`w-10 h-10 rounded-full bg-[#b4783c] flex items-center justify-center shadow-[0_0_15px_rgba(180,120,60,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                            >
                                {isPlaying ? (
                                    <Pause
                                        size={16}
                                        className="text-n-text fill-white"
                                    />
                                ) : (
                                    <Play
                                        size={16}
                                        className="text-n-text fill-white ml-0.5"
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
                            className={`font-bold text-n-text line-clamp-2 leading-snug pr-2 flex items-center gap-2 ${
                                isInsideProjectView
                                    ? "text-base mt-1"
                                    : `text-[17px] sm:text-[18px] ${!isDeletedView ? "sm:pr-16" : ""}`
                            }`}
                        >
                            {isInsideProjectView && (
                                <span className="text-xs font-bold text-n-text-2 bg-n-surface-2 border border-n-border px-1.5 py-0.5 rounded font-mono shrink-0">
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
                                className="text-xs text-n-text-2 font-semibold mt-1 block hover:text-n-text hover:underline transition-colors w-fit pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {song.projectName}
                            </Link>
                        )}

                        {(isSharedView || song.isShared) && (
                            <span className="text-[11px] text-[#b4783c] font-semibold mt-0.5 block">
                                Shared by {song.owner}
                            </span>
                        )}
                    </div>

                    {/* Bottom container for Time & Collaborators/Owner */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900 sm:border-t-0 sm:pt-0 sm:mt-0">
                        <span className="text-[11px] text-n-text-2 font-medium">
                            {isDeletedView
                                ? formatDeletedTime(song.time)
                                : song.time}
                        </span>

                        <div className="flex items-center gap-1.5">
                            {isInsideProjectView ? (
                                <>
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
                                                className="w-6 h-6 rounded-full border border-n-border overflow-hidden relative z-10"
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
                                        <span className="text-[10px] text-n-text-2 font-semibold ml-1.5">
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
                            <span className="absolute top-0 right-0 border border-n-border bg-n-surface-2/50 text-n-text-2 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                                {song.state}
                            </span>
                        ) : (
                            <span
                                className={`sm:absolute sm:top-0 sm:right-0 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit ${
                                    song.title === "F.I.C.O."
                                        ? "bg-[#b4783c]/10 text-[#b4783c] border border-[#b4783c]/30 font-bold"
                                        : "border border-n-border-2 text-n-text-2"
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
                ? "bg-[#b4783c]/10 border border-[#b4783c]/30 shadow-[0_0_10px_rgba(180,120,60,0.1)]"
                : isDragOver && dragOverType === "swap"
                  ? "bg-[#b4783c]/15 border border-[#b4783c]/50 shadow-[0_0_12px_rgba(180,120,60,0.2)] scale-[1.01]"
                  : "hover:bg-n-surface"
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
                    <span className="text-xs font-bold text-n-text-2 min-w-[16px] text-center font-mono shrink-0">
                        {index + 1}
                    </span>
                )}
                <div className="relative w-14 h-14 flex-shrink-0 mt-1 mb-1">
                    <div className="bg-n-cta text-n-cta-text hover:bg-n-cta-hover rounded-lg px-4 py-2 font-semibold transition-colors w-full">
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
                                className="text-n-text-2 group-hover:text-[#b4783c] transition-colors duration-300"
                            />
                        )}
                        {song.audioSrc && (
                            <div
                                className={`absolute inset-0 bg-n-bg/50 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"} z-20`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className={`w-7 h-7 rounded-full bg-[#b4783c] flex items-center justify-center shadow-[0_0_10px_rgba(180,120,60,0.5)] transform hover:scale-105 transition-transform duration-200 ${isPlaying ? "animate-pulse" : ""}`}
                                >
                                    {isPlaying ? (
                                        <Pause
                                            size={12}
                                            className="text-n-text fill-white"
                                        />
                                    ) : (
                                        <Play
                                            size={12}
                                            className="text-n-text fill-white ml-0.5"
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
                            className={`font-bold text-sm transition-colors line-clamp-1 ${isPlaying ? "text-[#b4783c]" : "text-n-text"}`}
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
                            className="text-[10px] text-n-text-2 font-semibold tracking-wider hover:text-n-text hover:underline transition-colors w-fit pointer-events-auto mt-0.5"
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
                    <div className="col-span-3 text-xs text-n-text truncate">
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
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-n-hover flex items-center justify-center relative z-10 text-[9px] font-bold text-n-text">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-n-text-3">-</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-2 pr-2 relative z-20">
                        <button
                            className="p-1.5 text-n-text-2 hover:text-[#b4783c] hover:bg-[#b4783c]/10 rounded transition-colors"
                            title="Restaurer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore?.(song.id, song.title);
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1.5 text-n-text-2 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
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
                    <div className="col-span-2 text-xs text-[#b4783c] font-semibold truncate">
                        {song.owner}
                    </div>

                    {/* State */}
                    <div className="col-span-1 text-xs font-bold text-n-text truncate">
                        {song.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-n-text truncate">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-n-text truncate">
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
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-n-hover flex items-center justify-center relative z-10 text-[9px] font-bold text-n-text">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-n-text-3">-</span>
                        )}
                    </div>
                </>
            ) : isInsideProjectView ? (
                <>
                    {/* State */}
                    <div className="col-span-2 text-xs font-bold">
                        {song.title === "F.I.C.O." ? (
                            <span className="bg-[#b4783c]/10 text-[#b4783c] border border-[#b4783c]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] inline-block">
                                {song.state}
                            </span>
                        ) : (
                            <span className="text-n-text">{song.state}</span>
                        )}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-n-text-2">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-n-text-2">
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
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-n-hover flex items-center justify-center relative z-10 text-[9px] font-bold text-n-text">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-n-text-3">-</span>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* State */}
                    <div className="col-span-2 text-xs font-bold text-n-text truncate">
                        {song.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-n-text truncate">
                        {song.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-n-text truncate">
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
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-n-hover flex items-center justify-center relative z-10 text-[9px] font-bold text-n-text">
                                        +{song.collabs - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-n-text-3">-</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div
            className={`flex flex-col song-card relative ${
                isDraggable
                    ? "cursor-grab active:cursor-grabbing"
                    : isDeletedView
                      ? "cursor-context-menu"
                      : "cursor-pointer"
            }`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable={isDraggable}
            onDragStart={(e) => {
                handleDragStart(e);
                if (onDragStart) onDragStart(e);
            }}
            onDragOver={onDragOver}
            onDragEnd={(e) => {
                window.dispatchEvent(new CustomEvent("nara-song-drag-end"));
                if (onDragEnd) onDragEnd(e);
            }}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onContextMenu={onContextMenu}
        >
            {/* Visual Drag Insertion Indicators for List View */}
            {isDragOver && dragOverType === "insert-before" && (
                <div className="absolute top-[-5px] left-0 right-0 h-[3px] bg-[#b4783c] shadow-[0_0_10px_rgba(180,120,60,0.8)] z-30 animate-pulse rounded-full" />
            )}
            {isDragOver && dragOverType === "insert-after" && (
                <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-[#b4783c] shadow-[0_0_10px_rgba(180,120,60,0.8)] z-30 animate-pulse rounded-full" />
            )}
            {listContent}
        </div>
    );
};
