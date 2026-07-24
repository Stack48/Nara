"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Project } from "@/lib/projectStore";
import { MenuContext } from "@/context/MenuContext";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter, SortByOption, SortOrderOption } from "@/hooks/useLibrarySortAndFilter";
import { ProjectCard } from "./projectCard";
import { useSelection } from "@/context/SelectionContext";
import { ChevronDown, ChevronRight, ChevronUp, LayoutGrid, List, Check } from "lucide-react";
import { useApiProjects } from "@/hooks/useApiProjects";
import { SkeletonGrid, SkeletonList } from "@/components/ui/SkeletonCard";

// Filtres par statut (pastilles)
type StatusId = "all" | "in-progress" | "draft" | "shared" | "done";
const STATUS_FILTERS: { id: StatusId; label: string; match: (p: Project) => boolean }[] = [
    { id: "all", label: "Tous", match: () => true },
    { id: "in-progress", label: "En cours", match: (p) => p.state === "En cours" },
    { id: "draft", label: "Brouillons", match: (p) => p.state === "Draft" },
    { id: "shared", label: "Partagés", match: (p) => !!p.isShared },
    { id: "done", label: "Terminés", match: (p) => p.state === "Terminé" },
];

// Options de tri (mappées vers sortBy/sortOrder du hook)
const SORT_CHOICES: { id: string; label: string; sortBy: SortByOption; sortOrder: SortOrderOption }[] = [
    { id: "recent", label: "Récents", sortBy: "modified", sortOrder: "desc" },
    { id: "old", label: "Plus anciens", sortBy: "modified", sortOrder: "asc" },
    { id: "az", label: "A → Z", sortBy: "alphabetical", sortOrder: "asc" },
    { id: "za", label: "Z → A", sortBy: "alphabetical", sortOrder: "desc" },
    { id: "created", label: "Date de création", sortBy: "created", sortOrder: "desc" },
];

export const Projects = () => {
    // Menu contextuel et renommage
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
    const [renameModal, setRenameModal] = useState<{ projectId: string; initialTitle: string } | null>(null);

    // Filtre de statut actif + dropdown de tri
    const [statusFilter, setStatusFilter] = useState<StatusId>("all");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const { selectedIds, handleSelect } = useSelection();

    const { projects: allProjects, loading } = useApiProjects();
    const projectsList = useMemo(
        () => allProjects.filter((project) => !project.isDeleted && !project.isShared),
        [allProjects],
    );

    const {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        filteredAndSortedItems: sortedProjectList,
    } = useLibrarySortAndFilter({
        items: projectsList,
        searchKeys: ["title", "type"],
        defaultSortBy: "modified",
        defaultSortOrder: "desc",
        defaultViewMode: "grid",
        storageKey: "projects",
    });

    // Fermer le dropdown de tri au clic extérieur
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // Statistiques d'en-tête
    const stats = useMemo(() => {
        const drafts = projectsList.filter((p) => p.state === "Draft").length;
        const collaborators = new Set<string>();
        projectsList.forEach((p) => (p.collaboratorsList ?? []).forEach((n) => n && collaborators.add(n)));
        const collabCount = collaborators.size || projectsList.reduce((sum, p) => sum + (p.collabs || 0), 0);
        return { total: projectsList.length, drafts, collabCount };
    }, [projectsList]);

    // Compteurs des pastilles (sur la liste complète, indépendamment du filtre actif)
    const statusCounts = useMemo(
        () => Object.fromEntries(STATUS_FILTERS.map((f) => [f.id, projectsList.filter(f.match).length])) as Record<StatusId, number>,
        [projectsList],
    );

    // Liste finale : tri (hook) puis filtre de statut
    const displayedProjects = useMemo(() => {
        const matcher = STATUS_FILTERS.find((f) => f.id === statusFilter)?.match ?? (() => true);
        return sortedProjectList.filter(matcher);
    }, [sortedProjectList, statusFilter]);

    const currentSortLabel = SORT_CHOICES.find((c) => c.sortBy === sortBy && c.sortOrder === sortOrder)?.label ?? "Récents";

    const handleHeaderSort = (field: SortByOption) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "alphabetical" ? "asc" : "desc");
        }
    };

    const handleContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, project });
    };

    return (
        <div className="w-full font-arimo text-n-text pb-10 min-h-[600px]">
            {/* EN-TÊTE : titre + statistiques */}
            <header className="mb-7">
                <h1 className="text-3xl font-semibold tracking-tight text-n-text">Mes projets</h1>
                <p className="mt-2 text-sm text-n-text-2">
                    {stats.total} {stats.total === 1 ? "projet" : "projets"} · {stats.drafts}{" "}
                    {stats.drafts === 1 ? "brouillon" : "brouillons"} · {stats.collabCount}{" "}
                    {stats.collabCount === 1 ? "collaborateur" : "collaborateurs"}
                </p>
            </header>

            {/* BARRE DE FILTRES : pastilles à gauche, tri + vue à droite */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
                {/* Pastilles de statut */}
                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_FILTERS.map((f) => {
                        const active = statusFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setStatusFilter(f.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                                    active
                                        ? "border-n-accent/35 bg-n-accent/10 text-n-accent"
                                        : "border-n-border bg-n-surface text-n-text-2 hover:text-n-text hover:border-n-border-2"
                                }`}
                            >
                                <span>{f.label}</span>
                                <span className={`text-xs ${active ? "text-n-accent" : "text-n-text-3"}`}>
                                    {statusCounts[f.id] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tri + bascule de vue */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative" ref={sortMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsSortOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-lg border border-n-border bg-n-surface px-3 py-2 text-sm font-medium text-n-text hover:border-n-border-2 transition-colors cursor-pointer"
                        >
                            <span className="text-n-text-2">Trier :</span>
                            <span>{currentSortLabel}</span>
                            <ChevronDown size={15} className="text-n-text-2" />
                        </button>

                        {isSortOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-n-surface border border-n-border rounded-2xl shadow-2xl z-50 py-2 px-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="px-3 py-1 text-[11px] font-bold text-n-text-3 uppercase tracking-wider">
                                    Trier par
                                </div>
                                {SORT_CHOICES.map((choice) => {
                                    const active = choice.sortBy === sortBy && choice.sortOrder === sortOrder;
                                    return (
                                        <button
                                            key={choice.id}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(choice.sortBy);
                                                setSortOrder(choice.sortOrder);
                                                setIsSortOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm font-medium rounded-lg text-n-text hover:bg-n-hover flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                {active && <Check size={13} strokeWidth={3} className="text-n-accent" />}
                                            </div>
                                            <span>{choice.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bascule Grille / Liste */}
                    <div className="flex items-center border border-n-border rounded-lg overflow-hidden shrink-0">
                        <button
                            type="button"
                            aria-label="Vue grille"
                            onClick={() => setViewMode("grid")}
                            className={`p-2 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-n-accent/10 text-n-accent" : "bg-transparent text-n-text-3 hover:bg-n-hover/50"}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label="Vue liste"
                            onClick={() => setViewMode("list")}
                            className={`p-2 transition-colors cursor-pointer ${viewMode === "list" ? "bg-n-accent/10 text-n-accent" : "bg-transparent text-n-text-3 hover:bg-n-hover/50"}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION : Récemment modifiés */}
            <div className="flex items-center gap-1 mb-5">
                <h2 className="text-lg font-semibold text-n-text">Récemment modifiés</h2>
                <ChevronRight size={18} className="text-n-text-3" />
            </div>

            {/* CONTENU */}
            {loading ? (
                viewMode === "grid" ? <SkeletonGrid type="project" /> : <SkeletonList />
            ) : displayedProjects.length === 0 && statusFilter !== "all" ? (
                <div className="flex flex-col items-center justify-center py-20 text-n-text-2 border border-dashed border-n-border/80 rounded-2xl bg-n-surface">
                    <p>Aucun projet dans « {STATUS_FILTERS.find((f) => f.id === statusFilter)?.label} ».</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    <ProjectCard viewMode="grid" context="library" isCreatePlaceholder={true} />
                    {displayedProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            viewMode="grid"
                            context="library"
                            isSelected={selectedIds.includes(project.id)}
                            onSelect={(e) => handleSelect(project.id, "project", project, e, displayedProjects)}
                            onContextMenu={(e) => handleContextMenu(e, project)}
                        />
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE --- */
                <div className="w-full">
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-n-text-2 border-b border-n-border">
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("alphabetical")}
                            className="col-span-6 pl-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                        >
                            <span>Nom</span>
                            {sortBy === "alphabetical" && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("modified")}
                            className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                        >
                            <span>Dernière modification</span>
                            {sortBy === "modified" && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("created")}
                            className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                        >
                            <span>Créé</span>
                            {sortBy === "created" && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </button>
                        <div className="col-span-2">Collaborateurs</div>
                    </div>

                    <div className="flex flex-col">
                        <ProjectCard viewMode="list" context="library" isCreatePlaceholder={true} />
                        {displayedProjects.map((project, index) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                viewMode="list"
                                context="library"
                                index={index}
                                isLast={index === displayedProjects.length - 1}
                                isSelected={selectedIds.includes(project.id)}
                                onSelect={(e) => handleSelect(project.id, "project", project, e, displayedProjects)}
                                onContextMenu={(e) => handleContextMenu(e, project)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {contextMenu && (
                <MenuContext
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemType="project"
                    project={contextMenu.project}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() =>
                        setRenameModal({ projectId: contextMenu.project.id, initialTitle: contextMenu.project.title })
                    }
                />
            )}

            {renameModal && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setRenameModal(null)}
                    title="Renommer le dossier projet"
                    label="Nom du projet"
                    placeholder="Saisir le nom du projet"
                    initialValue={renameModal.initialTitle}
                    onSave={async (newValue) => {
                        try {
                            const { getCurrentUser } = await import("aws-amplify/auth");
                            const user = await getCurrentUser();
                            await fetch(`/api/projects/${renameModal.projectId}/rename`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", "x-cognito-id": user.userId },
                                body: JSON.stringify({ name: newValue }),
                            });
                            window.dispatchEvent(
                                new CustomEvent("show-nara-toast", { detail: { message: `Projet renommé en « ${newValue} »` } }),
                            );
                            window.dispatchEvent(new CustomEvent("nara-data-updated"));
                        } catch (err) {
                            console.error("Rename error:", err);
                        }
                    }}
                />
            )}
        </div>
    );
};
