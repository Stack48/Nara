"use client";

import { useState, useEffect } from "react";
import { X, Edit2 } from "lucide-react";

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    label: string;
    placeholder: string;
    initialValue: string;
    onSave: (newValue: string) => void;
}

export const RenameModal = ({
    isOpen,
    onClose,
    title,
    label,
    placeholder,
    initialValue,
    onSave,
}: RenameModalProps) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSave(value.trim());
            onClose();
        }
    };

    const inputId = `rename-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <div className="fixed inset-0 bg-n-bg/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-n-bg border border-n-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-n-text-2 hover:text-n-text p-1 hover:bg-n-hover rounded transition-colors cursor-pointer"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-n-accent/10 flex items-center justify-center text-n-accent">
                        <Edit2 size={18} />
                    </div>
                    <h3 className="font-serif font-bold text-n-text text-base">
                        {title}
                    </h3>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label
                            htmlFor={inputId}
                            className="block text-n-text-2 text-[10px] font-bold uppercase tracking-wider mb-2"
                        >
                            {label}
                        </label>
                        <input
                            id={inputId}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full bg-n-surface border border-n-border/80 rounded-xl py-3 px-4 text-sm text-n-text focus:outline-none focus:border-neutral-600 transition-colors"
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-semibold text-n-text-2 hover:text-n-text border border-n-border hover:border-n-border-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-n-cta text-n-cta-text hover:bg-n-cta-hover rounded-lg px-4 py-2 font-semibold transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
