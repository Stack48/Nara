"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../nav/Sidebar";
import { PageHeader } from "../nav/PageHeader";
import { EditDetailsModal } from "../modals/EditDetailsModal";
import { MoveToModal } from "../modals/MoveToModal";
import { ShareModal } from "../modals/ShareModal";
import { SelectionProvider } from "@/context/SelectionContext";
import { SelectionBanner } from "../library/SelectionBanner";
import { setSongProject } from "@/lib/songStore";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    // sidebar state
    const [collapsed, setCollapsed] = useState(false);

    // Edit Modal state (handles project creation too)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editModalType, setEditModalType] = useState<"song" | "project">("song");
    const [editModalItemId, setEditModalItemId] = useState<string>("");
    const [editModalIsCreate, setEditModalIsCreate] = useState<boolean>(false);

    // Move To Modal state
    const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);
    const [moveToItems, setMoveToItems] = useState<any[]>([]);

    // Share Modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareItems, setShareItems] = useState<any[]>([]);

    // Undo stack history state
    const undoStackRef = useRef<any[]>([]);
    const isUndoingRef = useRef(false);

    useEffect(() => {
        const handleOpenCreateModal = (e: any) => {
            const { type } = e.detail || {};
            if (type === "project") {
                setEditModalType("project");
                setEditModalItemId("");
                setEditModalIsCreate(true);
                setIsEditModalOpen(true);
            }
        };

        const handleOpenEditModal = (e: any) => {
            const { type, itemId } = e.detail || {};
            if (type && itemId) {
                setEditModalType(type);
                setEditModalItemId(itemId);
                setEditModalIsCreate(false);
                setIsEditModalOpen(true);
            }
        };

        const handleOpenMoveToModal = (e: any) => {
            const { items } = e.detail || {};
            if (items && items.length > 0) {
                setMoveToItems(items);
                setIsMoveToModalOpen(true);
            }
        };

        const handleOpenShareModal = (e: any) => {
            const { items } = e.detail || {};
            if (items && items.length > 0) {
                setShareItems(items);
                setIsShareModalOpen(true);
            }
        };

        const handleSongMoved = (e: any) => {
            if (isUndoingRef.current) return;
            const { songId, songTitle, previousProjectId, previousProjectName, targetProjectId, targetProjectTitle } = e.detail;
            undoStackRef.current.push({
                songId,
                songTitle,
                previousProjectId,
                previousProjectName,
                targetProjectId,
                targetProjectTitle,
            });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
            if (isCtrlZ && undoStackRef.current.length > 0) {
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
                    return;
                }

                e.preventDefault();
                const lastAction = undoStackRef.current.pop();
                if (lastAction) {
                    isUndoingRef.current = true;
                    setSongProject(
                        lastAction.songId,
                        lastAction.previousProjectId,
                        lastAction.previousProjectName
                    );
                    isUndoingRef.current = false;

                    window.dispatchEvent(
                        new CustomEvent("show-nara-toast", {
                            detail: {
                                message: `Reverted: "${lastAction.songTitle}" moved back to ${
                                    lastAction.previousProjectName || "standalone"
                                }!`,
                            },
                        }),
                    );
                }
            }
        };

        window.addEventListener("open-create-modal", handleOpenCreateModal);
        window.addEventListener("open-edit-modal", handleOpenEditModal);
        window.addEventListener("open-moveto-modal", handleOpenMoveToModal);
        window.addEventListener("open-share-modal", handleOpenShareModal);
        window.addEventListener("nara-song-moved", handleSongMoved);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("open-create-modal", handleOpenCreateModal);
            window.removeEventListener("open-edit-modal", handleOpenEditModal);
            window.removeEventListener("open-moveto-modal", handleOpenMoveToModal);
            window.removeEventListener("open-share-modal", handleOpenShareModal);
            window.removeEventListener("nara-song-moved", handleSongMoved);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <SelectionProvider>
            <div className="flex h-screen bg-black text-white font-arimo overflow-hidden">
                {/* sidebar */}
                <Sidebar
                    collapsed={collapsed}
                    toggleSidebar={() => setCollapsed(!collapsed)}
                    setCollapsed={setCollapsed}
                />

                {/* main content */}
                <main className="flex-1 p-8 bg-[#0a0a0a] overflow-y-auto flex flex-col relative transition-all duration-300 min-w-0">
                    <PageHeader />
                    {children}
                    <SelectionBanner />
                </main>

                {/* Edit Details Modal (also handles creation of projects) */}
                <EditDetailsModal
                    isOpen={isEditModalOpen}
                    type={editModalType}
                    itemId={editModalItemId}
                    isCreate={editModalIsCreate}
                    onClose={() => setIsEditModalOpen(false)}
                />

                {/* Move To Project Modal */}
                <MoveToModal
                    isOpen={isMoveToModalOpen}
                    items={moveToItems}
                    onClose={() => setIsMoveToModalOpen(false)}
                />

                {/* Share Modal */}
                <ShareModal
                    isOpen={isShareModalOpen}
                    items={shareItems}
                    onClose={() => setIsShareModalOpen(false)}
                />
            </div>
        </SelectionProvider>
    );
};
