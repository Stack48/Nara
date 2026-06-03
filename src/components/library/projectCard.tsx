"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, RotateCcw, Trash2 } from "lucide-react";
import { Project } from "@/lib/projectStore";

import { ALL_AVATARS, getOwnerAvatar } from "@/lib/avatars";

const formatDeletedTime = (timeStr: string) => {
    if (!timeStr) return "Deleted recently";
    const lower = timeStr.toLowerCase();
    if (lower.startsWith("deleted")) return timeStr;
    if (lower.startsWith("edited")) {
        return timeStr.replace(/^[Ee]dited\s+/, "Deleted ");
    }
    return `Deleted ${timeStr}`;
};

export interface ProjectCardProps {
    project: Project;
    viewMode: "grid" | "list";
    context?: "library" | "shared" | "deleted" | "favorite" | "recent";
    index?: number;
    isLast?: boolean;
    onContextMenu?: React.MouseEventHandler;
    onRestore?: (id: string, title: string) => void;
    onPermanentDelete?: (title: string) => void;
}

export const ProjectCard = ({
    project,
    viewMode,
    context = "library",
    index = 0,
    isLast = false,
    onContextMenu,
    onRestore,
    onPermanentDelete,
}: ProjectCardProps) => {
    const isDeletedView = context === "deleted";
    const isSharedView = context === "shared";

    // Resolve URL path
    const getHref = () => {
        if (isDeletedView) return null;
        if (isSharedView || project.isShared) {
            return `/shared/${project.id}`;
        }
        return `/projects/${project.id}`;
    };

    const href = getHref();

    if (viewMode === "grid") {
        const cardContent = (
            <>
                {/* Image de fond (Prend tout le bloc) */}
                <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Favorite badge */}
                {project.isFavorite && (
                    <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-sm p-1.5 rounded-full text-[#D90097]">
                        <Heart size={14} className="fill-[#D90097]" />
                    </div>
                )}

                {/* Actions (Restaurer / Supprimer) - Placées en haut à droite en vue supprimée */}
                {isDeletedView && (
                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                        <button
                            className="p-2 bg-neutral-900/80 hover:bg-[#D90097] text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-800"
                            title="Restaurer"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRestore?.(project.id, project.title);
                            }}
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            className="p-2 bg-neutral-900/80 hover:bg-red-500 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-800"
                            title="Supprimer définitivement"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPermanentDelete?.(project.title);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {/* Dégradé sombre puissant en bas pour une visibilité parfaite du texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Contenu textuel */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end h-full">
                    <div className="flex flex-col gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-[11px] font-bold text-neutral-300 capitalize tracking-wide">
                            {project.type} • {project.songsCount}{" "}
                            {project.songsCount > 1 ? "songs" : "song"}
                        </span>

                        <h3 className="font-bold text-white text-xl line-clamp-2 leading-tight">
                            {project.title}
                        </h3>
                    </div>

                    {/* Section Collaborateurs / Owner / Trashed Info */}
                    <div className="mt-3">
                        {isDeletedView ? (
                            <div className="pt-3 border-t border-white/10">
                                <span className="text-[11px] font-medium text-neutral-400">
                                    {formatDeletedTime(project.lastModified)}
                                </span>
                            </div>
                        ) : isSharedView || project.isShared ? (
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[11px] font-medium text-[#D90097]">
                                    Shared by {project.owner}
                                </span>
                                <div className="w-6 h-6 rounded-full border border-neutral-800 overflow-hidden relative z-10">
                                    <Image
                                        src={getOwnerAvatar(project.owner || "") || ALL_AVATARS[0]}
                                        alt={project.owner || "Owner"}
                                        fill
                                        className="object-cover"
                                        sizes="24px"
                                    />
                                </div>
                            </div>
                        ) : project.collabs > 0 ? (
                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <span className="text-[11px] font-medium text-neutral-400">
                                    {project.collabs} Collaborator{project.collabs > 1 ? "s" : ""}
                                </span>
                                <div className="flex -space-x-1.5">
                                    {[...Array(Math.min(project.collabs, 3))].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full border border-neutral-800 overflow-hidden relative z-10"
                                        >
                                            <Image
                                                src={ALL_AVATARS[(index + i) % ALL_AVATARS.length]}
                                                alt="Collab"
                                                fill
                                                className="object-cover"
                                                sizes="24px"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-3 border-t border-white/10">
                                <span className="text-[11px] font-medium text-neutral-500">
                                    Personal Project
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );

        const gridClassName = "group relative aspect-square rounded-2xl overflow-hidden border border-neutral-800/80 hover:border-neutral-500 transition-colors animate-in fade-in";

        if (href) {
            return (
                <Link href={href} onContextMenu={onContextMenu} className={`${gridClassName} cursor-pointer`}>
                    {cardContent}
                </Link>
            );
        }

        return (
            <div onContextMenu={onContextMenu} className={`${gridClassName} cursor-default`}>
                {cardContent}
            </div>
        );
    }

    // --- VUE LISTE ---
    const listContent = (
        <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors group">
            {/* Name + Image */}
            <div className={`${isSharedView ? "col-span-3" : "col-span-4"} flex items-center gap-4 pl-1`}>
                <div className="relative w-14 h-14 flex-shrink-0 mt-1 mb-1">
                    {/* Stack effects pour signifier un "Projet" (dossier) */}
                    <div className="absolute -top-2 inset-x-2 h-full bg-neutral-800/40 rounded-xl border border-neutral-800/50 transition-transform group-hover:-translate-y-0.5"></div>
                    <div className="absolute -top-1 inset-x-1 h-full bg-neutral-800/60 rounded-xl border border-neutral-700/50 transition-transform group-hover:-translate-y-0.5"></div>

                    {/* Image principale */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-neutral-700 z-10">
                        <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="56px"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 capitalize tracking-wide mb-0.5 font-bold">
                        {project.type} • {project.songsCount}{" "}
                        {project.songsCount > 1 ? "songs" : "song"}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-bold text-sm text-white line-clamp-1 ${href ? "group-hover:text-[#D90097] transition-colors" : ""}`}>
                            {project.title}
                        </span>
                        {project.isFavorite && (
                            <Heart
                                size={12}
                                className="text-[#D90097] fill-[#D90097] flex-shrink-0"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Layout adaptable en colonnes selon le contexte */}
            {isDeletedView ? (
                <>
                    {/* Deleted time */}
                    <div className="col-span-3 text-xs text-white truncate">
                        {formatDeletedTime(project.lastModified)}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-3 flex items-center">
                        {project.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(project.collabs, 3))].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                    >
                                        <Image
                                            src={ALL_AVATARS[(index + i) % ALL_AVATARS.length]}
                                            alt="Collab"
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                        />
                                    </div>
                                ))}
                                {project.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{project.collabs - 3}
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
                                e.preventDefault();
                                onRestore?.(project.id, project.title);
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer définitivement"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPermanentDelete?.(project.title);
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
                        {project.owner}
                    </div>

                    {/* State */}
                    <div className="col-span-1 text-xs font-bold text-white truncate">
                        {project.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {project.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {project.created}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-2 flex items-center">
                        {project.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(project.collabs, 3))].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                    >
                                        <Image
                                            src={ALL_AVATARS[(index + i) % ALL_AVATARS.length]}
                                            alt="Collab"
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                        />
                                    </div>
                                ))}
                                {project.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{project.collabs - 3}
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
                        {project.state}
                    </div>

                    {/* Last modified */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {project.lastModified}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-xs text-white truncate">
                        {project.created}
                    </div>

                    {/* Collaborators */}
                    <div className="col-span-2 flex items-center">
                        {project.collabs > 0 ? (
                            <div className="flex -space-x-1.5">
                                {[...Array(Math.min(project.collabs, 3))].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                    >
                                        <Image
                                            src={ALL_AVATARS[(index + i) % ALL_AVATARS.length]}
                                            alt="Collab"
                                            fill
                                            className="object-cover"
                                            sizes="24px"
                                        />
                                    </div>
                                ))}
                                {project.collabs > 3 && (
                                    <div className="w-6 h-6 rounded-full border border-[#151515] bg-neutral-800 flex items-center justify-center relative z-10 text-[9px] font-bold text-neutral-300">
                                        +{project.collabs - 3}
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
        <div className="flex flex-col">
            {href ? (
                <Link
                    href={href}
                    onContextMenu={onContextMenu}
                    className="cursor-pointer"
                >
                    {listContent}
                </Link>
            ) : (
                <div onContextMenu={onContextMenu} className="cursor-context-menu">
                    {listContent}
                </div>
            )}
        </div>
    );
};
