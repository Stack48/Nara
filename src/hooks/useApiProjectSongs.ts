"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";
import { Song } from "@/lib/songStore";

type ApiLyrics = {
    id: string;
    title: string;
    content: unknown;
    order: number;
    sectionType: string;
    state: string;
    projectId: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    imageUrl?: string | null;
    project: { id: string; name: string; status: string; imageUrl?: string | null };
    author: { id: string; name: string | null };
};

const mapApiLyricsToSong = (l: ApiLyrics, projectName: string): Song => {
    return {
        id: l.id,
        title: l.title,
        projectId: l.projectId,
        projectName,
        state: l.state === "IN_PROGRESS" ? "En cours" : l.state === "COMPLETED" ? "Terminé" : l.state === "REVIEW" ? "En revue" : "Draft",
        lastModified: new Date(l.updatedAt).toLocaleDateString("fr-FR"),
        lastModifiedDate: new Date(l.updatedAt),
        created: new Date(l.createdAt).toLocaleDateString("fr-FR"),
        createdDate: new Date(l.createdAt),
        time: new Date(l.updatedAt).toLocaleDateString("fr-FR"),
        collabs: 0,
        isFavorite: false,
        isDeleted: false,
        isShared: false,
        owner: "",
        origin: "project",
        image: l.imageUrl || l.project?.imageUrl || null,
        audioSrc: "",
        position: l.order,
    };
};

export const useApiProjectSongs = (projectId: string): {
    songs: Song[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
} => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        if (!projectId) return;
        const fetchSongs = async () => {
            try {
                setLoading(true);
                const user = await getCurrentUser();
                const res = await fetch(`/api/projects/${projectId}/lyrics`, {
                    headers: { "x-cognito-id": user.userId },
                });
                if (!res.ok) throw new Error("Erreur API");
                const data: ApiLyrics[] = await res.json();
                setSongs(data.map((l) => mapApiLyricsToSong(l, l.project?.name ?? "")));
            } catch (err) {
                console.error("Erreur chargement songs:", err);
                setError("Impossible de charger les songs");
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
    }, [projectId, trigger]);

    return { songs, loading, error, refetch: () => setTrigger((t) => t + 1) };
};