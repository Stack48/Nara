"use client";

import { useState, useEffect } from "react";
import { useProjects, Project, renameProject } from "@/lib/projectStore";
import { MenuContext } from "@/context/MenuContext";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { ProjectCard } from "./projectCard";
import { useSelection } from "@/context/SelectionContext";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useApiProjects } from "@/hooks/useApiProjects";
import { SkeletonGrid, SkeletonList } from "@/components/ui/SkeletonCard";

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

    const { selectedIds, handleSelect } = useSelection();

    // Après
    const { projects: allProjects, loading } = useApiProjects();
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
        storageKey: "projects",
    });

    const handleHeaderSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "alphabetical" ? "asc" : "desc");
        }
    };

    const handleContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            project,
        });
    };

    return (
        <div className="w-full font-arimo text-n-text pb-10 min-h-[600px]">
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
            {loading ? (
                viewMode === "grid" ? <SkeletonGrid type="project" /> : <SkeletonList />
            ) : sortedProjectList.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-20 text-n-text-2 border border-n-border/80 rounded-2xl bg-n-surface border-dashed">
                    <p>No projects found matching "{searchQuery}".</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    <ProjectCard
                        viewMode="grid"
                        context="library"
                        isCreatePlaceholder={true}
                    />
                    {sortedProjectList.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            viewMode="grid"
                            context="library"
                            isSelected={selectedIds.includes(project.id)}
                            onSelect={(e) => handleSelect(project.id, "project", project, e, sortedProjectList)}
                            onContextMenu={(e) => handleContextMenu(e, project)}
                        />
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE --- */
                <div className="w-full">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-n-text-2 border-b border-n-border">
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("alphabetical")}
                            className="col-span-6 pl-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                        >
                            <span>Name</span>
                            {sortBy === "alphabetical" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("modified")}
                            className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
                        >
                            <span>Last modified</span>
                            {sortBy === "modified" && (
                                sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleHeaderSort("created")}
                            className="col-span-2 flex items-center gap-1 hover:text-n-text transition-colors text-left font-medium"
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
                        <ProjectCard
                            viewMode="list"
                            context="library"
                            isCreatePlaceholder={true}
                        />
                        {sortedProjectList.map((project, index) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                viewMode="list"
                                context="library"
                                index={index}
                                isLast={index === sortedProjectList.length - 1}
                                isSelected={selectedIds.includes(project.id)}
                                onSelect={(e) => handleSelect(project.id, "project", project, e, sortedProjectList)}
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
                        setRenameModal({
                            projectId: contextMenu.project.id,
                            initialTitle: contextMenu.project.title,
                        })
                    }
                />
            )}

            {renameModal && (
                <RenameModal
                    isOpen={true}
                    onClose={() => setRenameModal(null)}
                    title="Rename project folder"
                    label="Project Name"
                    placeholder="Enter project name"
                    initialValue={renameModal.initialTitle}
                    onSave={async (newValue) => {
                        try {
                            const { getCurrentUser } = await import("aws-amplify/auth");
                            const user = await getCurrentUser();
                            await fetch(`/api/projects/${renameModal.projectId}/rename`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-cognito-id": user.userId,
                                },
                                body: JSON.stringify({ name: newValue }),
                            });
                            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                                detail: { message: `Project renamed to "${newValue}"` },
                            }));
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
