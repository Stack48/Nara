"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, LayoutGrid, List, Check } from "lucide-react";
import { useProjects, Project } from "@/lib/projectStore";
import { ProjectContextMenu } from "./ProjectContextMenu";
import { RenameProjectModal } from "../modals/RenameProjectModal";
import { Toast } from "./Toast";

import avisProfil from "@/assets/user/haslem.png";
import duncan from "@/assets/user/duncan.png";
import allen from "@/assets/user/allen.png";

export const Projects = () => {
    // État pour gérer la vue actuelle ("grid" ou "list")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // État pour le tri
    const [sortBy, setSortBy] = useState<"alphabetical" | "created" | "modified">("modified");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    
    // État pour la recherche
    const [searchQuery, setSearchQuery] = useState("");

    // États pour le menu contextuel et renommage
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
    const [renameModal, setRenameModal] = useState<{ projectId: string; initialTitle: string } | null>(null);

    const sortMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setIsSortMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allProjects = useProjects();
    const projectsList = allProjects.filter((project) => !project.isDeleted);

    const handleContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            project
        });
    };

    // Filtrage dynamique selon la recherche
    const filteredProjects = projectsList.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Tri dynamique de la liste
    const sortedProjectList = [...filteredProjects].sort((a, b) => {
        if (sortBy === "alphabetical") {
            const comparison = a.title.localeCompare(b.title);
            return sortOrder === "asc" ? comparison : -comparison;
        } else if (sortBy === "created") {
            const comparison = a.createdDate.getTime() - b.createdDate.getTime();
            return sortOrder === "asc" ? comparison : -comparison;
        } else {
            // modified
            const comparison = a.lastModifiedDate.getTime() - b.lastModifiedDate.getTime();
            return sortOrder === "asc" ? comparison : -comparison;
        }
    });

    const getSortLabel = () => {
        switch (sortBy) {
            case "alphabetical": return "Alphabetical";
            case "created": return "Date created";
            case "modified": return "Last modified";
            default: return "Last modified";
        }
    };

    return (
        <div className="w-full font-arimo text-white pb-10">
            {/* TITRE */}
            <h1 className="text-xl font-bold font-syne mb-6">My Projects</h1>

            {/* BARRE DE RECHERCHE */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
            </div>

            {/* ONGLETS ET FILTRES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {/* Compteur de projets à gauche */}
                <div className="text-sm font-semibold text-neutral-400">
                    {filteredProjects.length} projects
                </div>

                {/* Filtres de droite */}
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap pb-2 md:pb-0">
                    {/* Dropdown Tri (Last modified) */}
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
                                {[
                                    { id: "alphabetical", label: "Alphabetical" },
                                    { id: "created", label: "Date created" },
                                    { id: "modified", label: "Last modified" },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(option.id as any);
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
                                            setSortOrder(option.id as any);
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

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No projects found.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedProjectList.map((project) => {
                        const isLgseo = project.id === "Let_God_Sort_Em_Out";

                        if (isLgseo) {
                            return (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    onContextMenu={(e) => handleContextMenu(e, project)}
                                    className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer border border-neutral-800/80 hover:border-neutral-500 transition-all duration-500 shadow-2xl bg-neutral-950 animate-in fade-in"
                                >
                                    {/* Image de fond (Prend tout le bloc) */}
                                    <Image
                                        src={project.image}
                                        alt={project.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />

                                    {/* Overlay sombre discret */}
                                    <div className="absolute inset-0 bg-[#111111]/20 group-hover:bg-[#111111]/30 transition-colors duration-500"></div>

                                    {/* Contenu textuel en bas - Style photo (h-[44%], border-t, backdrop-blur) */}
                                    <div className="absolute bottom-0 left-0 right-0 h-[44%] bg-[#121214]/80 backdrop-blur-md border-t border-neutral-800/40 p-5 flex flex-col justify-between transition-all duration-500 group-hover:bg-[#121214]/95 group-hover:h-[48%]">
                                        {/* Ligne 1 : Type & Songs + Date de création */}
                                        <div className="flex justify-between items-center text-xs font-semibold text-neutral-400">
                                            <span>
                                                {project.type} • {project.songsCount} songs
                                            </span>
                                            <span className="text-[10px] text-neutral-500">
                                                Created {project.created}
                                            </span>
                                        </div>

                                        {/* Ligne 2 : Titre principal (Grand & gras) */}
                                        <h3 className="font-syne font-bold text-white text-2xl tracking-tight leading-tight group-hover:text-[#D90097] transition-colors duration-300">
                                            {project.title}
                                        </h3>

                                        {/* Ligne 3 : Collaborateurs */}
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[10px] text-neutral-400">
                                                Collaborators ({project.collabs})
                                            </span>
                                            <div className="flex -space-x-1.5">
                                                <div className="w-5.5 h-5.5 rounded-full border border-neutral-900 overflow-hidden relative z-30">
                                                    <Image
                                                        src={avisProfil}
                                                        alt="Collab"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="w-5.5 h-5.5 rounded-full border border-neutral-900 overflow-hidden relative z-20">
                                                    <Image
                                                        src={duncan}
                                                        alt="Collab"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="w-5.5 h-5.5 rounded-full border border-neutral-900 overflow-hidden relative z-10">
                                                    <Image
                                                        src={allen}
                                                        alt="Collab"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        }

                        return (
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

                                {/* Dégradé sombre pour lire le texte */}
                                <div className="absolute inset-0 bg-[#111111]/40 group-hover:bg-[#111111]/60 transition-colors"></div>

                                {/* Contenu textuel en bas */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-neutral-300 tracking-wide">
                                            {project.type} • {project.songsCount}{" "}
                                            {project.songsCount > 1
                                                ? "songs"
                                                : "song"}
                                        </span>
                                        <span className="text-[10px] text-neutral-500">
                                            Created {project.created}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-white text-lg line-clamp-1">
                                        {project.title}
                                    </h3>

                                    {/* Section Collaborateurs (affichée seulement s'il y en a) */}
                                    {project.collabs > 0 ? (
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            <span className="text-[10px] text-neutral-500 hidden sm:block">
                                                Collaborators ({project.collabs})
                                            </span>
                                            <div className="flex -space-x-2">
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
                                                        className="w-6 h-6 rounded-full border-2 border-[#111] overflow-hidden relative z-10"
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
                                        // Diviseur invisible pour garder la même hauteur si pas de collabs
                                        <div className="h-8 mt-2"></div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                /* --- VUE LISTE (Ton code exact avec les props adaptées) --- */
                <div className="w-full">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <div className="col-span-5 pl-2">Name</div>
                        <div className="col-span-2">State</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-3">Created</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        {sortedProjectList.map((project, index) => (
                            <div key={project.id} className="flex flex-col">
                                <Link
                                    href={`/projects/${project.id}`}
                                    onContextMenu={(e) => handleContextMenu(e, project)}
                                    className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer"
                                >
                                    {/* Name + Image */}
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                            <Image
                                                src={project.image}
                                                alt={project.title}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                        <span className="font-bold text-sm text-white">
                                            {project.title}
                                        </span>
                                    </div>

                                    {/* State */}
                                    <div className="col-span-2 text-xs font-bold text-white">
                                        {project.state}
                                    </div>

                                    {/* Last modified */}
                                    <div className="col-span-2 text-xs text-white">
                                        {project.lastModified}
                                    </div>

                                    {/* Created */}
                                    <div className="col-span-3 text-xs text-white">
                                        {project.created}
                                    </div>
                                </Link>
                                {index !== sortedProjectList.length - 1 && (
                                    <div className="border-b border-neutral-800 mx-2 my-1"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {contextMenu && (
                <ProjectContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    project={contextMenu.project}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() => setRenameModal({ projectId: contextMenu.project.id, initialTitle: contextMenu.project.title })}
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

            <Toast />
        </div>
    );
};
