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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#121212] border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white p-1 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#D90097]/10 flex items-center justify-center text-[#D90097]">
                        <Edit2 size={18} />
                    </div>
                    <h3 className="font-syne font-bold text-white text-base">
                        {title}
                    </h3>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label
                            htmlFor={inputId}
                            className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2"
                        >
                            {label}
                        </label>
                        <input
                            id={inputId}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
