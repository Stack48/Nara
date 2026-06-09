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
    projectId: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    project: { id: string; name: string; status: string };
    author: { id: string; name: string | null };
};

const mapApiLyricsToSong = (l: ApiLyrics): Song => {
    return {
        id: l.id,
        title: l.title,
        projectId: l.projectId,
        projectName: l.project?.name ?? "",
        state: l.project?.status === "IN_PROGRESS" ? "En écriture" : "Draft",
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
        image: null,
        audioSrc: "",
    };
};

export const useApiSongs = (): {
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
        const fetchSongs = async () => {
            try {
                setLoading(true);
                const user = await getCurrentUser();
                const res = await fetch("/api/songs", {
                    headers: { "x-cognito-id": user.userId },
                });
                if (!res.ok) throw new Error("Erreur API");
                const data: ApiLyrics[] = await res.json();
                setSongs(data.map(mapApiLyricsToSong));
            } catch (err) {
                console.error("Erreur chargement songs:", err);
                setError("Impossible de charger les songs");
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
        const handleUpdate = () => setTrigger((t) => t + 1);
        window.addEventListener("nara-data-updated", handleUpdate);
        return () => window.removeEventListener("nara-data-updated", handleUpdate);
    }, [trigger]);

    return { songs, loading, error, refetch: () => setTrigger((t) => t + 1) };
};