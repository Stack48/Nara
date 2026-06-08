"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../nav/Sidebar";
import { Topbar } from "../nav/Topbar";
import { EditDetailsModal } from "../modals/EditDetailsModal";
import { MoveToModal } from "../modals/MoveToModal";
import { ShareModal } from "../modals/ShareModal";
import { SelectionProvider } from "@/context/SelectionContext";
import { SelectionBanner } from "../library/SelectionBanner";

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

        window.addEventListener("open-create-modal", handleOpenCreateModal);
        window.addEventListener("open-edit-modal", handleOpenEditModal);
        window.addEventListener("open-moveto-modal", handleOpenMoveToModal);
        window.addEventListener("open-share-modal", handleOpenShareModal);

        return () => {
            window.removeEventListener("open-create-modal", handleOpenCreateModal);
            window.removeEventListener("open-edit-modal", handleOpenEditModal);
            window.removeEventListener("open-moveto-modal", handleOpenMoveToModal);
            window.removeEventListener("open-share-modal", handleOpenShareModal);
        };
    }, []);

    return (
        <SelectionProvider>
            <div className="flex h-screen bg-black text-white font-arimo overflow-hidden">
                {/* sidebar */}
                <Sidebar
                    collapsed={collapsed}
                    toggleSidebar={() => setCollapsed(!collapsed)}
                />

                {/* main content */}
                <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
                    <Topbar />
                    <main className="flex-1 p-6 bg-[#0a0a0a] overflow-y-auto flex flex-col relative">
                        {children}
                        <SelectionBanner />
                    </main>
                </div>

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
