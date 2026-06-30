"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";
import type { TrashedFile } from "@/types/trash";

const ENDPOINTS = {
    list: `/api/trash/files`,
    restore: (id: string) => `/api/files/${id}/restore`,
    permanent: (id: string) => `/api/files/${id}/permanent`,
};

function toast(message: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", { detail: { message } }),
        );
    }
}

async function authHeaders(): Promise<Record<string, string>> {
    try {
        const user = await getCurrentUser();
        return { "x-cognito-id": user.userId };
    } catch {
        return {};
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
                headers: await authHeaders(),
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
                headers: await authHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast(`"${target?.name ?? "File"}" restored.`);
        } catch (e) {
            console.error("[trash] restore error", e);
            if (target) setFiles((prev) => [target, ...prev]);
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
                headers: await authHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast(`"${target?.name ?? "File"}" permanently deleted.`);
        } catch (e) {
            console.error("[trash] permanent delete error", e);
            if (target) setFiles((prev) => [target, ...prev]);
            toast("Deletion failed. Please try again.");
        } finally {
            setPendingId(null);
        }
    }, [files]);

    return { files, loading, error, pendingId, refetch, restore, permanentlyDelete };
}