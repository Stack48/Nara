"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { TrashedFile } from "@/types/trash";

interface Props {
    file: TrashedFile | null;
    isDeleting?: boolean;
    onClose: () => void;
    onConfirm: (id: string) => void | Promise<void>;
}

export function PermanentDeleteFileModal({ file, isDeleting, onClose, onConfirm }: Props) {
    const [typed, setTyped] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (file) {
            setTyped("");
            const t = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [file]);

    // Fermeture via Échap
    useEffect(() => {
        if (!file) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isDeleting) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [file, isDeleting, onClose]);

    if (!file) return null;

    const matches = typed.trim() === file.name.trim();
    const canConfirm = matches && !isDeleting;

    const handleConfirm = () => {
        if (canConfirm) onConfirm(file.id);
    };

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onMouseDown={(e) => {
                // clic sur le fond (pas pendant la suppression) => ferme
                if (e.target === e.currentTarget && !isDeleting) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="permanent-delete-title"
        >
            <div className="bg-[#121212] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <h3
                            id="permanent-delete-title"
                            className="font-syne font-bold text-white text-base"
                        >
                            Delete permanently?
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 text-neutral-500 hover:text-white rounded-lg transition-colors disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <p className="text-neutral-400 text-xs leading-relaxed mb-2">
                    You are about to permanently delete{" "}
                    <span className="text-white font-semibold">"{file.name}"</span>.
                </p>
                <p className="text-red-400 text-xs font-semibold leading-relaxed mb-5">
                    This action is irreversible. The file cannot be recovered.
                </p>

                {/* Confirmation par saisie du nom */}
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Type the file name to confirm
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                    placeholder={file.name}
                    disabled={isDeleting}
                    aria-invalid={typed.length > 0 && !matches}
                    className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-50"
                />
                <p className="h-4 mt-1.5 text-[11px] text-neutral-500">
                    {typed.length > 0 && !matches ? "Name doesn't match yet." : ""}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Deleting…
                            </>
                        ) : (
                            "Delete permanently"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}