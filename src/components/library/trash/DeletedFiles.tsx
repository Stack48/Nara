"use client";

import { useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import type { TrashedFile } from "@/types/trash";
import { useTrashedFiles } from "@/lib/useTrashedFiles";
import { TrashedFileRow } from "./TrashedFileRow";
import { PermanentDeleteFileModal } from "./PermanentDeleteFileModal";

export function DeletedFiles() {
    const { files, loading, error, pendingId, refetch, restore, permanentlyDelete } =
        useTrashedFiles();

    const [toDelete, setToDelete] = useState<TrashedFile | null>(null);

    const handleConfirmDelete = async (id: string) => {
        await permanentlyDelete(id);
        setToDelete(null);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-neutral-500 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading trash…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                <p className="text-sm">{error}</p>
                <button
                    type="button"
                    onClick={refetch}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
                >
                    <RotateCw size={14} />
                    Retry
                </button>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                <p>Trash is empty.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4 font-syne">
                Files ({files.length})
            </h2>

            {/* En-tête du tableau */}
            <div className="grid grid-cols-12 gap-4 pb-3 mb-2 px-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Deleted</div>
                <div className="col-span-3">Auto-delete</div>
                <div className="col-span-2 text-right pr-2">Actions</div>
            </div>

            <div className="flex flex-col gap-1">
                {files.map((file) => (
                    <TrashedFileRow
                        key={file.id}
                        file={file}
                        isPending={pendingId === file.id}
                        onRestore={restore}
                        onRequestDelete={setToDelete}
                    />
                ))}
            </div>

            <PermanentDeleteFileModal
                file={toDelete}
                isDeleting={!!toDelete && pendingId === toDelete.id}
                onClose={() => setToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}