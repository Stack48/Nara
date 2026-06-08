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
            {sortedProjectList.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
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
                    onSave={(newValue) => {
                        renameProject(renameModal.projectId, newValue);
                        window.dispatchEvent(
                            new CustomEvent("show-nara-toast", {
                                detail: {
                                    message: `Project renamed to "${newValue}"`,
                                },
                            }),
                        );
                    }}
                />
            )}
        </div>
    );
};
