"use client";

import { useState, useEffect } from "react";

// Cover images imports
import vince from "@/assets/cover/vince.png";
import testCover from "@/assets/cover/test.jpg";
import timekillers from "@/assets/cover/timekillers.jpg";
import untitled from "@/assets/cover/untitled.jpg";
import breathe from "@/assets/cover/breathe.jpg";
import lioaf from "@/assets/cover/lioaf.jpg";
import wideopen from "@/assets/cover/wideopen.jpg";
import lgseo from "@/assets/cover/lgseo.png";
import intoYou from "@/assets/cover/intoyou.png";
import rightInTheMiddle from "@/assets/cover/rightinthemiddle.png";
import alfredo from "@/assets/cover/alfredo.png";
import ghettodreams from "@/assets/cover/ghettodreams.png";

export interface Song {
    id: string;
    title: string;
    time: string;
    collabs: number;
    state: string;
    lastModified: string;
    created: string;
    lastModifiedDate: Date;
    createdDate: Date;
    image: any;
    audioSrc: string;
    origin: "standalone" | "project";
    projectId: string;
    projectName: string;
    isFavorite: boolean;
    isDeleted: boolean;
    deletedAt?: string; // ISO — date de mise a la corbeille
    isShared?: boolean;
    owner?: string;
    position?: number;
    description?: string;
    collaboratorsList?: string[];
}

const STATIC_SONGS_LIST = [
    // --- Standalone Songs (ex-Drafts) ---
    {
        id: "MHM",
        title: "MHM",
        time: "Edited 5 minutes ago",
        collabs: 0,
        state: "En écriture",
        lastModified: "5 mins ago",
        created: "7 months ago",
        lastModifiedDate: new Date(Date.now() - 5 * 60 * 1000),
        createdDate: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000),
        image: vince,
        audioSrc: "/audio/mhm.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "test",
        title: "test",
        time: "Edited 8 minutes ago",
        collabs: 0,
        state: "Terminé",
        lastModified: "8 mins ago",
        created: "6 months ago",
        lastModifiedDate: new Date(Date.now() - 8 * 60 * 1000),
        createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        image: null,
        audioSrc: "/audio/ensalada.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "June5",
        defaultProjectName: "June5",
    },
    {
        id: "Time_killers",
        title: "Time killers",
        time: "Edited 12 minutes ago",
        collabs: 1,
        state: "Terminé",
        lastModified: "12 mins ago",
        created: "5 months ago",
        lastModifiedDate: new Date(Date.now() - 12 * 60 * 1000),
        createdDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        image: timekillers,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "untitled_01",
        title: "untitled 01",
        time: "Edited 1 hour ago",
        collabs: 3,
        state: "Terminé",
        lastModified: "1 hour ago",
        created: "4 months ago",
        lastModifiedDate: new Date(Date.now() - 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        image: untitled,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "breathe",
        title: "breathe",
        time: "Edited 2 hours ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "2 hours ago",
        created: "3 months ago",
        lastModifiedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        image: breathe,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "Love_Is_Only_A_Feeling",
        title: "Love Is Only A Feeling",
        time: "Edited 3 hours ago",
        collabs: 1,
        state: "En écriture",
        lastModified: "3 hours ago",
        created: "2 months ago",
        lastModifiedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        image: lioaf,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "WIDE_Open",
        title: "WIDE Open",
        time: "Edited 1 day ago",
        collabs: 0,
        state: "En écriture",
        lastModified: "1 day ago",
        created: "1 month ago",
        lastModifiedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        image: wideopen,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },

    // --- Project Songs (from insideProjects) ---
    {
        id: "FICO",
        title: "F.I.C.O.",
        time: "Edited 5 minutes ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "5 mins ago",
        created: "7 months ago",
        lastModifiedDate: new Date(Date.now() - 5 * 60 * 1000),
        createdDate: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "Let_God_Sort_Em_Out_Chandeliers",
        title: "Let God Sort Em Out/Chandeliers",
        time: "Edited 8 minutes ago",
        collabs: 3,
        state: "Terminé",
        lastModified: "8 mins ago",
        created: "6 months ago",
        lastModifiedDate: new Date(Date.now() - 8 * 60 * 1000),
        createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "MTBTTF",
        title: "M.T.B.T.T.F.",
        time: "Edited 12 minutes ago",
        collabs: 2,
        state: "Terminé",
        lastModified: "12 mins ago",
        created: "5 months ago",
        lastModifiedDate: new Date(Date.now() - 12 * 60 * 1000),
        createdDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "Chains_Whips",
        title: "Chains & Whips",
        time: "Edited 1 hour ago",
        collabs: 4,
        state: "Terminé",
        lastModified: "1 hour ago",
        created: "4 months ago",
        lastModifiedDate: new Date(Date.now() - 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "So_Be_It",
        title: "So Be It",
        time: "Edited 2 hours ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "2 hours ago",
        created: "3 months ago",
        lastModifiedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "POV",
        title: "P.O.V.",
        time: "Edited 3 hours ago",
        collabs: 3,
        state: "En écriture",
        lastModified: "3 hours ago",
        created: "2 months ago",
        lastModifiedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "Ace_Trumpets",
        title: "Ace Trumpets",
        time: "Edited 1 day ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "1 day ago",
        created: "1 month ago",
        lastModifiedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "The_Birds_Dont_Sing",
        title: "The Birds Don't Sing",
        time: "Edited 2 days ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "2 days ago",
        created: "15 days ago",
        lastModifiedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "All_Things_Considered",
        title: "All Things Considered",
        time: "Edited 3 days ago",
        collabs: 3,
        state: "Terminé",
        lastModified: "3 days ago",
        created: "10 days ago",
        lastModifiedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "Inglorious_Bastards",
        title: "Inglorious Bastards",
        time: "Edited 4 days ago",
        collabs: 2,
        state: "Terminé",
        lastModified: "4 days ago",
        created: "5 days ago",
        lastModifiedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "So_Far_Ahead",
        title: "So Far Ahead",
        time: "Edited 5 days ago",
        collabs: 4,
        state: "Terminé",
        lastModified: "5 days ago",
        created: "4 days ago",
        lastModifiedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "EBIDTA",
        title: "E.B.I.D.T.A.",
        time: "Edited 6 days ago",
        collabs: 2,
        state: "En écriture",
        lastModified: "6 days ago",
        created: "3 days ago",
        lastModifiedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "By_The_Grace_Of_God",
        title: "By The Grace Of God",
        time: "Edited 7 days ago",
        collabs: 3,
        state: "En écriture",
        lastModified: "7 days ago",
        created: "2 days ago",
        lastModifiedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        image: lgseo,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Let_God_Sort_Em_Out",
        defaultProjectName: "Let God Sort Em Out",
    },
    {
        id: "So_Into_You",
        title: "So Into You",
        time: "Deleted 16 days ago",
        collabs: 1,
        state: "Terminé",
        lastModified: "16 days ago",
        created: "16 days ago",
        lastModifiedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        image: intoYou,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "Right_in_the_Middle",
        title: "Right in the Middle",
        time: "Deleted 3 weeks ago",
        collabs: 1,
        state: "Terminé",
        lastModified: "3 weeks ago",
        created: "3 weeks ago",
        lastModifiedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        image: rightInTheMiddle,
        audioSrc: "/audio/fico.mp3",
        defaultOrigin: "standalone" as const,
        defaultProjectId: "",
        defaultProjectName: "",
    },
    {
        id: "Ensalada",
        title: "Ensalada",
        time: "Edited 2 hours ago",
        collabs: 2,
        state: "Terminé",
        lastModified: "2 hours ago",
        created: "2 hours ago",
        lastModifiedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        image: alfredo,
        audioSrc: "/audio/ensalada.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "Alfredo_2",
        defaultProjectName: "Alfredo 2",
        isShared: true,
        owner: "Tim Duncan",
    },
    {
        id: "Ghetto_Dreams",
        title: "Ghetto Dreams",
        time: "Edited 6 days ago",
        collabs: 1,
        state: "Terminé",
        lastModified: "6 days ago",
        created: "6 days ago",
        lastModifiedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        image: ghettodreams,
        audioSrc: "/audio/mhm.mp3",
        defaultOrigin: "project" as const,
        defaultProjectId: "",
        defaultProjectName: "The Dreamer, The Believer",
        isShared: true,
        owner: "Tracy McGrady",
    },
];

const LOCAL_STORAGE_KEY = "nara_song_project_mappings";
const EVENT_NAME = "song-project-updated";

export interface Mappings {
    [songId: string]: {
        projectId: string;
        projectName: string;
        origin: "standalone" | "project";
        isFavorite: boolean;
        isDeleted: boolean;
        deletedAt?: string;
        isPermanentlyDeleted?: boolean;
        title: string;
        description?: string;
        collaboratorsList?: string[];
        state?: string;
        image?: string;
    };
}

// Get mappings helper
export const getSongProjectMappings = (): Mappings => {
    if (typeof window === "undefined") {
        return {};
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Upgrade existing mappings in local storage if properties are missing
            let upgraded = false;
            Object.keys(parsed).forEach((key) => {
                const map = parsed[key];
                if (typeof map.isFavorite === "undefined") {
                    map.isFavorite = false;
                    upgraded = true;
                }
                if (typeof map.isDeleted === "undefined") {
                    map.isDeleted = false;
                    upgraded = true;
                }
                if (typeof map.title === "undefined") {
                    const originalSong = STATIC_SONGS_LIST.find(
                        (s) => s.id === key,
                    );
                    map.title = originalSong ? originalSong.title : key;
                    upgraded = true;
                }
                if (typeof map.description === "undefined") {
                    map.description = "";
                    upgraded = true;
                }
                if (
                    typeof map.collaboratorsList === "undefined" ||
                    (Array.isArray(map.collaboratorsList) &&
                        map.collaboratorsList.length === 0)
                ) {
                    const originalSong = STATIC_SONGS_LIST.find(
                        (s) => s.id === key,
                    );
                    const collabsCount = originalSong
                        ? originalSong.collabs
                        : 0;
                    map.collaboratorsList = [
                        "Ray Allen",
                        "Tim Duncan",
                        "Udonis Haslem",
                        "Tracy McGrady",
                        "Kobe Bryant",
                        "Allen Iverson",
                    ].slice(0, collabsCount);
                    upgraded = true;
                }
                if (typeof map.state === "undefined") {
                    const originalSong = STATIC_SONGS_LIST.find(
                        (s) => s.id === key,
                    );
                    map.state = originalSong
                        ? originalSong.state
                        : "En écriture";
                    upgraded = true;
                }
                if (typeof map.image === "undefined") {
                    map.image = "";
                    upgraded = true;
                }
            });
            if (
                parsed["test"] &&
                !localStorage.getItem("test_song_migrated_june5")
            ) {
                parsed["test"].projectId = "June5";
                parsed["test"].projectName = "June5";
                parsed["test"].origin = "project";
                localStorage.setItem("test_song_migrated_june5", "true");
                upgraded = true;
            }

            // Upgrade existing mappings in local storage if new static songs are missing
            STATIC_SONGS_LIST.forEach((song) => {
                if (!parsed[song.id]) {
                    parsed[song.id] = {
                        projectId: song.defaultProjectId,
                        projectName: song.defaultProjectName,
                        origin: song.defaultOrigin,
                        isFavorite: false,
                        isDeleted:
                            song.id === "So_Into_You" ||
                            song.id === "Right_in_the_Middle",
                        title: song.title,
                        description: "",
                        collaboratorsList: [
                            "Ray Allen",
                            "Tim Duncan",
                            "Udonis Haslem",
                            "Tracy McGrady",
                            "Kobe Bryant",
                            "Allen Iverson",
                        ].slice(0, song.collabs),
                        state: song.state,
                        image: "",
                    };
                    upgraded = true;
                }
            });
            if (upgraded) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse local storage mappings", e);
        }
    }

    // Default initial mappings
    const initialMappings: Mappings = {};
    STATIC_SONGS_LIST.forEach((song) => {
        initialMappings[song.id] = {
            projectId: song.defaultProjectId,
            projectName: song.defaultProjectName,
            origin: song.defaultOrigin,
            isFavorite: false,
            isDeleted:
                song.id === "So_Into_You" || song.id === "Right_in_the_Middle",
            title: song.title,
            description: "",
            collaboratorsList: [
                "Ray Allen",
                "Tim Duncan",
                "Udonis Haslem",
                "Tracy McGrady",
                "Kobe Bryant",
                "Allen Iverson",
            ].slice(0, song.collabs),
            state: song.state,
            image: "",
        };
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMappings));
    return initialMappings;
};

// Set single song project helper
export const setSongProject = (
    songId: string,
    projectId: string,
    projectName: string,
) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    const existing = currentMappings[songId] || {
        projectId: "",
        projectName: "",
        origin: "standalone",
        isFavorite: false,
        isDeleted: false,
        title: songId,
    };

    if (existing.projectId === projectId) {
        return;
    }

    const previousProjectId = existing.projectId || "";
    const previousProjectName = existing.projectName || "";

    currentMappings[songId] = {
        ...existing,
        projectId,
        projectName,
        origin: projectId ? "project" : "standalone",
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentMappings));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));

    // Dispatch event for undo/revert tracking
    window.dispatchEvent(
        new CustomEvent("nara-song-moved", {
            detail: {
                songId,
                songTitle: existing.title || songId,
                previousProjectId,
                previousProjectName,
                targetProjectId: projectId,
                targetProjectTitle: projectName,
            },
        }),
    );
};

// Toggle Favorite helper
export const toggleSongFavorite = (songId: string) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    if (currentMappings[songId]) {
        currentMappings[songId].isFavorite =
            !currentMappings[songId].isFavorite;
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(currentMappings),
        );
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
};

// Set Soft Delete helper
export const setSongDeleted = (songId: string, isDeleted: boolean) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    if (currentMappings[songId]) {
        currentMappings[songId].isDeleted = isDeleted;
        // Mémorise la date de suppression (et l'efface au rétablissement)
        if (isDeleted) {
            currentMappings[songId].deletedAt = new Date().toISOString();
        } else {
            delete currentMappings[songId].deletedAt;
        }
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(currentMappings),
        );
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
};

// Rename Song helper
export const renameSong = (songId: string, newTitle: string) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    if (currentMappings[songId]) {
        currentMappings[songId].title = newTitle;
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(currentMappings),
        );
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
};

// Update Song Details helper
export const updateSongDetails = (
    songId: string,
    details: {
        title?: string;
        image?: string;
        description?: string;
        state?: string;
        collaboratorsList?: string[];
    },
) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    if (currentMappings[songId]) {
        currentMappings[songId] = {
            ...currentMappings[songId],
            ...details,
        };
        if (details.title) {
            currentMappings[songId].title = details.title;
        }
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(currentMappings),
        );
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
};

// Create Song helper
export const createSong = (
    title: string,
    projectId: string = "",
    projectName: string = "",
) => {
    if (typeof window === "undefined") return;

    const mappings = getSongProjectMappings();
    const id = "song_" + Date.now();

    const createdSongsStored = localStorage.getItem("nara_created_songs");
    const createdSongs = createdSongsStored
        ? JSON.parse(createdSongsStored)
        : [];

    const newSong = {
        id,
        title,
        time: "Just now",
        collabs: 1,
        state: "En écriture",
        lastModified: "Just now",
        created: "Just now",
        lastModifiedDate: new Date().toISOString(),
        createdDate: new Date().toISOString(),
        image: null,
        audioSrc: "/audio/drafts/mhm.mp3",
        defaultOrigin: projectId
            ? ("project" as const)
            : ("standalone" as const),
        defaultProjectId: projectId,
        defaultProjectName: projectName,
    };

    createdSongs.push(newSong);
    localStorage.setItem("nara_created_songs", JSON.stringify(createdSongs));

    mappings[id] = {
        projectId,
        projectName,
        origin: projectId ? "project" : "standalone",
        isFavorite: false,
        isDeleted: false,
        title,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappings));

    window.dispatchEvent(new CustomEvent(EVENT_NAME));
    // Also trigger custom event for project store update (which listens to song count updates!)
    window.dispatchEvent(new CustomEvent("project-store-updated"));
};

const getStoredProjectTitle = (
    projectId: string,
    fallbackTitle: string,
): string => {
    if (typeof window === "undefined" || !projectId) return fallbackTitle;
    const stored = localStorage.getItem("nara_projects_mappings");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed[projectId]) {
                return parsed[projectId].title;
            }
        } catch {}
    }
    return fallbackTitle;
};

const getCreatedSongsList = (): any[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("nara_created_songs");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return parsed.map((song: any) => ({
                ...song,
                lastModifiedDate: new Date(song.lastModifiedDate),
                createdDate: new Date(song.createdDate),
                image: song.image || null, // default cover
            }));
        } catch {}
    }
    return [];
};

// Custom React hook to consume dynamic songs list
export const useSongs = (): Song[] => {
    const [songs, setSongs] = useState<Song[]>([]);

    useEffect(() => {
        const updateSongsList = () => {
            const mappings = getSongProjectMappings();
            const createdSongs = getCreatedSongsList();
            const combinedStaticAndCreated = [
                ...STATIC_SONGS_LIST,
                ...createdSongs,
            ];

            const updated = combinedStaticAndCreated
                .filter((song) => !mappings[song.id]?.isPermanentlyDeleted)
                .map((song) => {
                const songMapping = mappings[song.id] || {
                    projectId: song.defaultProjectId,
                    projectName: song.defaultProjectName,
                    origin: song.defaultOrigin,
                    isFavorite: false,
                    isDeleted: false,
                    title: song.title,
                    description: "",
                    collaboratorsList: [],
                    state: song.state,
                    image: "",
                };

                const mappingCollabs =
                    songMapping.collaboratorsList &&
                    songMapping.collaboratorsList.length > 0
                        ? songMapping.collaboratorsList
                        : [
                              "Ray Allen",
                              "Tim Duncan",
                              "Udonis Haslem",
                              "Tracy McGrady",
                              "Kobe Bryant",
                              "Allen Iverson",
                          ].slice(0, song.collabs);

                return {
                    id: song.id,
                    title: songMapping.title || song.title,
                    time: song.time,
                    collabs: mappingCollabs.length,
                    state: songMapping.state || song.state,
                    lastModified: song.lastModified,
                    created: song.created,
                    lastModifiedDate: song.lastModifiedDate,
                    createdDate: song.createdDate,
                    image: songMapping.image ? songMapping.image : song.image,
                    audioSrc: song.audioSrc,
                    projectId: songMapping.projectId,
                    projectName: getStoredProjectTitle(
                        songMapping.projectId,
                        songMapping.projectName,
                    ),
                    origin: songMapping.origin,
                    isFavorite: !!songMapping.isFavorite,
                    isDeleted: !!songMapping.isDeleted,
                    deletedAt: songMapping.deletedAt,
                    isShared: !!song.isShared,
                    owner: song.owner || "",
                    description: songMapping.description || "",
                    collaboratorsList: mappingCollabs,
                };
            });
            setSongs(updated);
        };

        // Initialize
        updateSongsList();

        // Listen for changes
        window.addEventListener(EVENT_NAME, updateSongsList);
        window.addEventListener("project-store-updated", updateSongsList); // Listen to project renames

        return () => {
            window.removeEventListener(EVENT_NAME, updateSongsList);
            window.removeEventListener(
                "project-store-updated",
                updateSongsList,
            );
        };
    }, []);

    return songs;
};

// Persistence functions for project song order
export const getSongOrder = (projectId: string): string[] => {
    if (typeof window === "undefined" || !projectId) return [];
    const stored = localStorage.getItem(`nara_project_song_order_${projectId}`);
    return stored ? JSON.parse(stored) : [];
};

export const saveSongOrder = (projectId: string, songIds: string[]) => {
    if (typeof window === "undefined" || !projectId) return;
    localStorage.setItem(
        `nara_project_song_order_${projectId}`,
        JSON.stringify(songIds),
    );
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const deleteSongPermanently = (songId: string) => {
    if (typeof window === "undefined") return;

    const currentMappings = getSongProjectMappings();
    if (currentMappings[songId]) {
        currentMappings[songId].isPermanentlyDeleted = true;
        localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(currentMappings),
        );
    }
    
    // Also remove from created songs if present
    const createdSongsStored = localStorage.getItem("nara_created_songs");
    if (createdSongsStored) {
        try {
            const createdSongs = JSON.parse(createdSongsStored);
            const filtered = createdSongs.filter((s: any) => s.id !== songId);
            localStorage.setItem("nara_created_songs", JSON.stringify(filtered));
        } catch {}
    }

    window.dispatchEvent(new CustomEvent(EVENT_NAME));
    window.dispatchEvent(new CustomEvent("project-store-updated"));
};