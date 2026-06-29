"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrashedFile } from "@/types/trash";
import { authHeaders } from "@/lib/devIdentity";

const API_BASE = "/api/files";
const ENDPOINTS = {
    list: `${API_BASE}/trash`,
    restore: (id: string) => `${API_BASE}/${id}/restore`,
    permanent: (id: string) => `${API_BASE}/${id}/permanent`,
};

function toast(message: string) {
    // Réutilise le système de toast existant (cf. Layout.tsx).
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", { detail: { message } }),
        );
    }
}

interface UseTrashedFiles {
    files: TrashedFile[];
    loading: boolean;
    error: string | null;
    pendingId: string | null;
    refetch: () => Promise<void>;
    restore: (id: string) => Promise<void>;
    permanentlyDelete: (id: string) => Promise<void>;
}

export function useTrashedFiles(): UseTrashedFiles {
    const [files, setFiles] = useState<TrashedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(ENDPOINTS.list, {
                cache: "no-store",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: TrashedFile[] = await res.json();
            setFiles(data);
        } catch (e) {
            console.error("[trash] list error", e);
            setError("Impossible de charger la corbeille.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const restore = useCallback(async (id: string) => {
        const target = files.find((f) => f.id === id);
        setPendingId(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
        try {
            const res = await fetch(ENDPOINTS.restore(id), {
                method: "POST",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast(`"${target?.name ?? "File"}" restored.`);
        } catch (e) {
            console.error("[trash] restore error", e);
            if (target) setFiles((prev) => [target, ...prev]); // rollback
            toast("Restore failed. Please try again.");
        } finally {
            setPendingId(null);
        }
    }, [files]);

    const permanentlyDelete = useCallback(async (id: string) => {
        const target = files.find((f) => f.id === id);
        setPendingId(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
        try {
            const res = await fetch(ENDPOINTS.permanent(id), {
                method: "DELETE",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast(`"${target?.name ?? "File"}" permanently deleted.`);
        } catch (e) {
            console.error("[trash] permanent delete error", e);
            if (target) setFiles((prev) => [target, ...prev]); // rollback
            toast("Deletion failed. Please try again.");
        } finally {
            setPendingId(null);
        }
    }, [files]);

    return { files, loading, error, pendingId, refetch, restore, permanentlyDelete };
}