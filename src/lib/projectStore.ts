"use client";

import { useState, useEffect } from "react";

// Cover images imports
import lgseo from "@/assets/cover/lgseo.png";
import america from "@/assets/cover/america.jpg";
import mrclean from "@/assets/cover/mrclean.jpg";
import aquemini from "@/assets/cover/aquemini.jpg";
import infamous from "@/assets/cover/infamous.jpg";
import alfredo from "@/assets/cover/alfredo.png";
import microphone from "@/assets/cover/microphone.jpg";
import whocoppin from "@/assets/cover/whocoppin.jpg";

export const PROJECT_IMAGES: { [key: string]: any } = {
    Let_God_Sort_Em_Out: lgseo,
    This_Is_America: america,
    Mr_Clean_Modern_Day_Mugging: mrclean,
    Aquemini: aquemini,
    The_Infamous: infamous,
    Alfredo_2: alfredo,
    Microphone_Champion: microphone,
    Who_Coppin: whocoppin,
};

export interface Project {
    id: string;
    title: string;
    type: string; // "Album" | "EP" | "Single"
    songsCount: number;
    collabs: number;
    state: string; // "En cours" | "Terminé"
    lastModified: string;
    created: string;
    lastModifiedDate: Date;
    createdDate: Date;
    imageKey: string;
    image: any;
    isFavorite: boolean;
    isDeleted: boolean;
    isShared?: boolean;
    owner?: string;
}

const STATIC_PROJECTS = [
    {
        id: "Let_God_Sort_Em_Out",
        title: "Let God Sort Em Out",
        type: "Album",
        collabs: 3,
        state: "En cours",
        lastModified: "5 mins ago",
        created: "6 days ago",
        lastModifiedDate: new Date(Date.now() - 5 * 60 * 1000),
        createdDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        imageKey: "Let_God_Sort_Em_Out",
    },
    {
        id: "This_Is_America",
        title: "This Is America",
        type: "Single",
        collabs: 0,
        state: "Terminé",
        lastModified: "10 mins ago",
        created: "10 days ago",
        lastModifiedDate: new Date(Date.now() - 10 * 60 * 1000),
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        imageKey: "This_Is_America",
    },
    {
        id: "Mr_Clean_Modern_Day_Mugging",
        title: "Mr. Clean / Modern Day Mugging",
        type: "EP",
        collabs: 3,
        state: "En cours",
        lastModified: "1 hour ago",
        created: "15 days ago",
        lastModifiedDate: new Date(Date.now() - 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        imageKey: "Mr_Clean_Modern_Day_Mugging",
    },
    {
        id: "Aquemini",
        title: "Aquemini",
        type: "Album",
        collabs: 3,
        state: "Terminé",
        lastModified: "2 hours ago",
        created: "20 days ago",
        lastModifiedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        imageKey: "Aquemini",
        isDeleted: true,
    },
    {
        id: "The_Infamous",
        title: "The Infamous",
        type: "Album",
        collabs: 0,
        state: "En cours",
        lastModified: "1 day ago",
        created: "1 month ago",
        lastModifiedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        imageKey: "The_Infamous",
    },
    {
        id: "Alfredo_2",
        title: "Alfredo 2",
        type: "Album",
        collabs: 0,
        state: "En cours",
        lastModified: "2 days ago",
        created: "1.5 months ago",
        lastModifiedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        imageKey: "Alfredo_2",
        isDeleted: false,
        isShared: true,
        owner: "Tim Duncan",
    },
    {
        id: "Microphone_Champion",
        title: "Microphone Champion",
        type: "Album",
        collabs: 0,
        state: "En cours",
        lastModified: "3 days ago",
        created: "2 months ago",
        lastModifiedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        imageKey: "Microphone_Champion",
    },
    {
        id: "Who_Coppin",
        title: "Who Coppin'",
        type: "Single",
        collabs: 0,
        state: "Terminé",
        lastModified: "4 days ago",
        created: "3 months ago",
        lastModifiedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        imageKey: "Who_Coppin",
    },
];

const LOCAL_STORAGE_KEY = "nara_projects_mappings";
const EVENT_NAME = "project-store-updated";

interface StoredProjects {
    [projectId: string]: {
        id: string;
        title: string;
        type: string;
        collabs: number;
        state: string;
        lastModified: string;
        created: string;
        lastModifiedDate: string;
        createdDate: string;
        imageKey: string;
        isFavorite: boolean;
        isDeleted: boolean;
        isShared?: boolean;
        owner?: string;
    };
}

const getSongsCountForProject = (projectId: string): number => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("nara_song_project_mappings");
    if (!stored) return 0;
    try {
        const mappings = JSON.parse(stored);
        return Object.values(mappings).filter(
            (song: any) => song.projectId === projectId && !song.isDeleted,
        ).length;
    } catch {
        return 0;
    }
};

export const getProjectsFromStorage = (): StoredProjects => {
    if (typeof window === "undefined") {
        return {};
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (
                parsed["Aquemini"] &&
                parsed["Aquemini"].isDeleted !== true &&
                !localStorage.getItem("aquemini_migrated")
            ) {
                parsed["Aquemini"].isDeleted = true;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
                localStorage.setItem("aquemini_migrated", "true");
            }
            if (
                parsed["Alfredo_2"] &&
                !localStorage.getItem("alfredo2_shared_migrated")
            ) {
                parsed["Alfredo_2"].isDeleted = false;
                parsed["Alfredo_2"].isShared = true;
                parsed["Alfredo_2"].owner = "Tim Duncan";
                parsed["Alfredo_2"].type = "Album";
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
                localStorage.setItem("alfredo2_shared_migrated", "true");
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse local storage projects", e);
        }
    }

    // Default initial storage creation
    const initialProjects: StoredProjects = {};
    STATIC_PROJECTS.forEach((proj) => {
        initialProjects[proj.id] = {
            id: proj.id,
            title: proj.title,
            type: proj.type,
            collabs: proj.collabs,
            state: proj.state,
            lastModified: proj.lastModified,
            created: proj.created,
            lastModifiedDate: proj.lastModifiedDate.toISOString(),
            createdDate: proj.createdDate.toISOString(),
            imageKey: proj.imageKey,
            isFavorite: false,
            isDeleted: (proj as any).isDeleted || false,
            isShared: (proj as any).isShared || false,
            owner: (proj as any).owner || "",
        };
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialProjects));
    return initialProjects;
};

export const toggleProjectFavorite = (projectId: string) => {
    if (typeof window === "undefined") return;
    const current = getProjectsFromStorage();
    if (current[projectId]) {
        current[projectId].isFavorite = !current[projectId].isFavorite;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
};

export const setProjectDeleted = (projectId: string, isDeleted: boolean) => {
    if (typeof window === "undefined") return;
    const current = getProjectsFromStorage();
    if (current[projectId]) {
        current[projectId].isDeleted = isDeleted;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));

        // Also trigger sidebar project updates event
        window.dispatchEvent(new CustomEvent("song-project-updated"));
    }
};

export const renameProject = (projectId: string, newTitle: string) => {
    if (typeof window === "undefined") return;
    const current = getProjectsFromStorage();
    if (current[projectId]) {
        current[projectId].title = newTitle;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));

        // Dispatch update song event too so songs in this project reflect name change
        window.dispatchEvent(new CustomEvent("song-project-updated"));
    }
};

export const createProject = (
    title: string,
    type: "Album" | "EP" | "Single",
) => {
    if (typeof window === "undefined") return;
    const current = getProjectsFromStorage();
    const id = title.replace(/\s+/g, "_");

    current[id] = {
        id,
        title,
        type,
        collabs: 0,
        state: "En cours",
        lastModified: "Just now",
        created: "Just now",
        lastModifiedDate: new Date().toISOString(),
        createdDate: new Date().toISOString(),
        imageKey: "Let_God_Sort_Em_Out", // fallback cover art preset
        isFavorite: false,
        isDeleted: false,
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
    window.dispatchEvent(new CustomEvent("song-project-updated"));
};

export const getProjectTitle = (projectId: string): string => {
    if (typeof window === "undefined" || !projectId) return "";
    const current = getProjectsFromStorage();
    return current[projectId] ? current[projectId].title : "";
};

export const useProjects = (): Project[] => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const updateProjectsList = () => {
            const stored = getProjectsFromStorage();
            const list: Project[] = Object.values(stored).map((proj) => {
                const songsCount = getSongsCountForProject(proj.id);
                return {
                    id: proj.id,
                    title: proj.title,
                    type: proj.type,
                    songsCount,
                    collabs: proj.collabs,
                    state: proj.state,
                    lastModified: proj.lastModified,
                    created: proj.created,
                    lastModifiedDate: new Date(proj.lastModifiedDate),
                    createdDate: new Date(proj.createdDate),
                    imageKey: proj.imageKey,
                    image: PROJECT_IMAGES[proj.imageKey] || lgseo,
                    isFavorite: !!proj.isFavorite,
                    isDeleted: !!proj.isDeleted,
                    isShared: !!proj.isShared,
                    owner: proj.owner || "",
                };
            });
            setProjects(list);
        };

        updateProjectsList();

        window.addEventListener(EVENT_NAME, updateProjectsList);
        window.addEventListener("song-project-updated", updateProjectsList); // Listen to song updates to update song counts!

        return () => {
            window.removeEventListener(EVENT_NAME, updateProjectsList);
            window.removeEventListener(
                "song-project-updated",
                updateProjectsList,
            );
        };
    }, []);

    return projects;
};
