"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../nav/Sidebar";
import { Topbar } from "../nav/Topbar";
import { CreateModal } from "../modals/CreateModal";
import { SelectionProvider } from "@/context/SelectionContext";
import { SelectionBanner } from "../library/SelectionBanner";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    // sidebar state
    const [collapsed, setCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalType, setCreateModalType] = useState<"song" | "project">("song");
    const [createModalProjectId, setCreateModalProjectId] = useState<string>("");
    const [createModalProjectName, setCreateModalProjectName] = useState<string>("");

    useEffect(() => {
        const handleOpenCreateModal = (e: any) => {
            const { type, projectId, projectName } = e.detail || {};
            if (type) setCreateModalType(type);
            setCreateModalProjectId(projectId || "");
            setCreateModalProjectName(projectName || "");
            setIsCreateModalOpen(true);
        };
        window.addEventListener("open-create-modal", handleOpenCreateModal);
        return () => window.removeEventListener("open-create-modal", handleOpenCreateModal);
    }, []);

    return (
        <SelectionProvider>
            <div className="flex h-screen bg-black text-white font-arimo overflow-hidden">
                {/* sidebar */}
                <Sidebar
                    collapsed={collapsed}
                    toggleSidebar={() => setCollapsed(!collapsed)}
                    openCreateModal={() => {
                        setCreateModalType("song");
                        setCreateModalProjectId("");
                        setCreateModalProjectName("");
                        setIsCreateModalOpen(true);
                    }}
                />

                {/* main content */}
                <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
                    <Topbar />
                    <main className="flex-1 p-6 bg-[#0a0a0a] overflow-y-auto flex flex-col relative">
                        {children}
                        <SelectionBanner />
                    </main>
                </div>

                {/* Create Modal */}
                <CreateModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    defaultType={createModalType}
                    defaultProjectId={createModalProjectId}
                    defaultProjectName={createModalProjectName}
                />
            </div>
        </SelectionProvider>
    );
};
