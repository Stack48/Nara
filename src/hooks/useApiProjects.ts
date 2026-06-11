"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Project } from "@/lib/projectStore";
import "@/lib/amplify";

type ApiProject = {
    id: string;
    name: string;
    description?: string;
    genre?: string;
    status: string;
    isFavorite: boolean;
    isDeleted: boolean;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner: { id: string; name: string | null; email: string };
    members: { role: string; user: { id: string; name: string | null } }[];
    _count?: { lyrics: number };
    imageUrl?: string | null;
};

const mapApiProjectToProject = (p: ApiProject): Project => {
    return {
        id: p.id,
        title: p.name,
        type: p.genre ?? "Album",
        songsCount: p._count?.lyrics ?? 0,
        collabs: p.members?.length ?? 0,
        state: p.status === "IN_PROGRESS" ? "En cours" : p.status === "COMPLETED" ? "Terminé" : "Draft",
        lastModified: new Date(p.updatedAt).toLocaleDateString("fr-FR"),
        created: new Date(p.createdAt).toLocaleDateString("fr-FR"),
        lastModifiedDate: new Date(p.updatedAt),
        createdDate: new Date(p.createdAt),
        imageKey: "",
        image: p.imageUrl ?? null,
        isFavorite: p.isFavorite ?? false,
        isDeleted: p.isDeleted ?? false,
        isShared: false,
        owner: p.owner?.name ?? "",
        description: p.description ?? "",
        collaboratorsList: p.members?.map((m) => m.user.name ?? "").filter(Boolean) ?? [],
    };
};

export const useApiProjects = (): {
    projects: Project[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
} => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const user = await getCurrentUser();
                console.log("cognitoId:", user.userId);
                const [res] = await Promise.all([
                    fetch("/api/projects", {
                        headers: { "x-cognito-id": user.userId },
                    }),
                    new Promise(resolve => setTimeout(resolve, 600))
                ]);
                if (res.status === 404) {
                    const { fetchUserAttributes } = await import("aws-amplify/auth");
                    const attrs = await fetchUserAttributes();
                    await fetch("/api/auth/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            cognitoId: user.userId,
                            email: attrs.email,
                            name: attrs.name || attrs.email?.split("@")[0],
                            username: attrs.preferred_username || attrs.email?.split("@")[0]
                        })
                    });
                    const retryRes = await fetch("/api/projects", { headers: { "x-cognito-id": user.userId } });
                    if (retryRes.ok) {
                        const retryData = await retryRes.json();
                        setProjects(retryData.map(mapApiProjectToProject));
                        return;
                    }
                }
                
                if (!res.ok) {
                    const errorBody = await res.json();
                    console.error("API error:", res.status, errorBody);
                    throw new Error("Erreur API");
                }
                const data: ApiProject[] = await res.json();
                setProjects(data.map(mapApiProjectToProject));
            } catch (err) {
                console.error("Erreur chargement projets:", err);
                setError("Impossible de charger les projets");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [trigger]);

    useEffect(() => {
        const handleUpdate = () => setTrigger((t) => t + 1);
        window.addEventListener("nara-data-updated", handleUpdate);
        return () => window.removeEventListener("nara-data-updated", handleUpdate);
    }, []);

    return { projects, loading, error, refetch: () => setTrigger((t) => t + 1) };
};