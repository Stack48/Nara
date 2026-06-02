"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProjects, Project } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { RenameProjectModal } from "../modals/RenameProjectModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";

import avisProfil from "@/assets/user/haslem.png";
import duncan from "@/assets/user/duncan.png";
import allen from "@/assets/user/allen.png";

export const Projects = () => {
    // États pour le menu contextuel et renommage
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        project: Project;
    } | null>(null);
    const [renameModal, setRenameModal] = useState<{
        projectId: string;
        initialTitle: string;
    } | null>(null);

    const allProjects = useProjects();
    const projectsList = allProjects.filter(
        (project) => !project.isDeleted && !project.isShared,
    );

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        filteredAndSortedItems: sortedProjectList,
    } = useLibrarySortAndFilter({
        items: projectsList,
        searchKeys: ["title", "type"],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
    });

    const handleContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            project,
        });
    };

    return (
        <div className="w-full font-arimo text-white pb-10">
            <LibraryHeader
                title="My Projects"
                itemCount={sortedProjectList.length}
                itemLabelSingular="project"
                itemLabelPlural="projects"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {sortedProjectList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No projects found.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedProjectList.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            onContextMenu={(e) => handleContextMenu(e, project)}
                            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-neutral-800/80 hover:border-neutral-500 transition-colors animate-in fade-in"
                        >
                            {/* Image de fond (Prend tout le bloc) */}
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />

                            {/* Dégradé sombre puissant en bas pour une visibilité parfaite du texte */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Contenu textuel */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end h-full">
                                <div className="flex flex-col gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="text-[11px] font-bold text-neutral-300 capitalize tracking-wide">
                                        {project.type} • {project.songsCount}{" "}
                                        {project.songsCount > 1
                                            ? "songs"
                                            : "song"}
                                    </span>

                                    <h3 className="font-bold text-white text-xl line-clamp-2 leading-tight">
                                        {project.title}
                                    </h3>
                                </div>

                                {/* Section Collaborateurs (affichée seulement s'il y en a) */}
                                <div className="mt-3">
                                    {project.collabs > 0 ? (
                                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                            <span className="text-[11px] font-medium text-neutral-400">
                                                {project.collabs} Collaborator
                                                {project.collabs > 1 ? "s" : ""}
                                            </span>
                                            <div className="flex -space-x-1.5">
                                                {[
                                                    ...Array(
                                                        Math.min(
                                                            project.collabs,
                                                            3,
                                                        ),
                                                    ),
                                                ].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-6 h-6 rounded-full border border-neutral-800 overflow-hidden relative z-10"
                                                    >
                                                        <Image
                                                            src={avisProfil}
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
                        </Link>
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE (Ton code exact avec les props adaptées) --- */
                <div className="w-full">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <div className="col-span-4 pl-2">Name</div>
                        <div className="col-span-2">State</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2">Collaborators</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        {sortedProjectList.map((project, index) => (
                            <div key={project.id} className="flex flex-col">
                                <Link
                                    href={`/projects/${project.id}`}
                                    onContextMenu={(e) =>
                                        handleContextMenu(e, project)
                                    }
                                    className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer"
                                >
                                    {/* Name + Image */}
                                    <div className="col-span-4 flex items-center gap-4 pl-1">
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
                                                {project.type} •{" "}
                                                {project.songsCount}{" "}
                                                {project.songsCount > 1
                                                    ? "songs"
                                                    : "song"}
                                            </span>
                                            <span className="font-bold text-sm text-white line-clamp-1">
                                                {project.title}
                                            </span>
                                        </div>
                                    </div>

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
                                                {[
                                                    ...Array(
                                                        Math.min(
                                                            project.collabs,
                                                            3,
                                                        ),
                                                    ),
                                                ].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-6 h-6 rounded-full border border-[#151515] overflow-hidden relative z-10"
                                                    >
                                                        <Image
                                                            src={avisProfil}
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
                                            <span className="text-xs text-neutral-600">
                                                -
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                {index !== sortedProjectList.length - 1 && (
                                    <div className=" mx-2 my-1"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemType="project"
                    project={contextMenu.project}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() =>
                        setRenameModal({
                            projectId: contextMenu.project.id,
                            initialTitle: contextMenu.project.title,
                        })
                    }
                />
            )}

            {renameModal && (
                <RenameProjectModal
                    isOpen={true}
                    onClose={() => setRenameModal(null)}
                    projectId={renameModal.projectId}
                    initialTitle={renameModal.initialTitle}
                />
            )}
        </div>
    );
};
