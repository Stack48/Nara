"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const PageHeader = () => {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Hide on full-screen pages like lyrics editor
    if (pathname.startsWith("/write/")) return null;

    const getPageInfo = () => {
        if (pathname === "/") return { title: "Dashboard", subtitle: "Welcome back to your workspace" };
        if (pathname.startsWith("/projects")) return { title: "My Projects", subtitle: "All your projects and drafts" };
        if (pathname.startsWith("/songs")) return { title: "Songs", subtitle: "All your works in progress" };
        if (pathname.startsWith("/shared")) return { title: "Shared", subtitle: "Projects shared with you" };
        if (pathname.startsWith("/deleted")) return { title: "Trash", subtitle: "Deleted items" };
        if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "Manage your account and preferences" };
        return { title: "", subtitle: "" };
    };

    const { title, subtitle } = getPageInfo();

    if (!title || !mounted) return null;

    return (
        <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
                <h1 className="text-3xl font-syne font-bold text-white">{title}</h1>
                <p className="text-neutral-400 mt-1 text-sm">{subtitle}</p>
            </div>
        </div>
    );
};
