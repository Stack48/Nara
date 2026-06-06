"use client";

import { useState } from "react";
import { Sidebar } from "../nav/Sidebar";
import { Topbar } from "../nav/Topbar";
import { CreateModal } from "../modals/CreateModal";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    // sidebar state
    const [collapsed, setCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex h-screen bg-black text-white font-arimo overflow-hidden">
            {/* sidebar */}
            <Sidebar
                collapsed={collapsed}
                toggleSidebar={() => setCollapsed(!collapsed)}
                openCreateModal={() => setIsCreateModalOpen(true)}
            />

            {/* main content */}
            <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
                <Topbar />
                <main className="flex-1 p-6 bg-[#0a0a0a] overflow-y-auto flex flex-col">
                    {children}
                </main>
            </div>

            {/* Create Modal */}
            <CreateModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
};
