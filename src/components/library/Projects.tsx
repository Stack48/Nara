"use client";

import { useState, useEffect } from "react";
import { useProjects, Project, renameProject } from "@/lib/projectStore";
import { ContextMenu } from "./ContextMenu";
import { RenameModal } from "../modals/RenameModal";
import { useLibrarySortAndFilter } from "@/hooks/useLibrarySortAndFilter";
import { LibraryHeader } from "./LibraryHeader";
import { ProjectCard } from "./projectCard";

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
                        <ProjectCard
                            key={project.id}
                            project={project}
                            viewMode="grid"
                            context="library"
                            onContextMenu={(e) => handleContextMenu(e, project)}
                        />
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE --- */
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
                            <ProjectCard
                                key={project.id}
                                project={project}
                                viewMode="list"
                                context="library"
                                index={index}
                                isLast={index === sortedProjectList.length - 1}
                                onContextMenu={(e) => handleContextMenu(e, project)}
                            />
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
