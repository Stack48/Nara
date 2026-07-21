"use client";

import { useState, useEffect } from "react";
import {
    X,
    Copy,
    Check,
    Search,
    Share2,
    Mail,
    Send,
    MessageCircle,
    SendToBack,
} from "lucide-react";
import Image from "next/image";
import { getOwnerAvatar } from "@/lib/avatars";

interface SelectedItem {
    id: string;
    title: string;
    type: "song" | "project";
    originalItem: any;
}

interface ShareModalProps {
    isOpen: boolean;
    items: SelectedItem[];
    onClose: () => void;
}

// Mock database of Nara users
const NARA_USERS = [
    { name: "Ray Allen", email: "ray.allen@nara.app" },
    { name: "Tim Duncan", email: "tim.duncan@nara.app" },
    { name: "Udonis Haslem", email: "udonis.haslem@nara.app" },
    { name: "Tracy McGrady", email: "tracy.mcgrady@nara.app" },
    { name: "Kobe Bryant", email: "kobe.bryant@nara.app" },
    { name: "Allen Iverson", email: "allen.iverson@nara.app" },
    { name: "Vince Carter", email: "vince.carter@nara.app" },
    { name: "Kevin Garnett", email: "kevin.garnett@nara.app" },
];

const InstagramIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

export const ShareModal = ({
    isOpen,
    items,
    onClose,
}: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [userRoles, setUserRoles] = useState<{ [userName: string]: string }>({});

    useEffect(() => {
        if (!isOpen) return;
        setSelectedUsers([]);
        setUserRoles({});
        setSearchQuery("");
    }, [isOpen]);

    if (!isOpen || items.length === 0) return null;

    // Generate Share URL
    const singleItem = items.length === 1 ? items[0] : null;
    const shareUrl = singleItem
        ? `https://nara.app/${singleItem.type}s/${singleItem.id}`
        : `https://nara.app/shared/invite_${Date.now()}`;

    const handleCopy = () => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            window.dispatchEvent(
                new CustomEvent("show-nara-toast", {
                    detail: { message: "Link copied to clipboard!" },
                }),
            );
        }
    };

    const handleToggleUser = (userName: string) => {
        if (selectedUsers.includes(userName)) {
            setSelectedUsers(selectedUsers.filter((u) => u !== userName));
            const newRoles = { ...userRoles };
            delete newRoles[userName];
            setUserRoles(newRoles);
        } else {
            setSelectedUsers([...selectedUsers, userName]);
            setUserRoles({ ...userRoles, [userName]: "READONLY" }); // default role
        }
    };

    const handleSendInvites = () => {
        if (selectedUsers.length === 0) return;
        
        const inviteDetails = selectedUsers.map(name => {
            const role = userRoles[name] || "READONLY";
            const roleLabel = role === "READONLY" ? "Lecture seule" : role === "LYRICIST" ? "Parolier" : "Lead Parolier";            return `${name} (${roleLabel})`;
        }).join(", ");

        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: {
                    message: `Invites successfully sent to: ${inviteDetails}!`,
                },
            }),
        );
        setSelectedUsers([]);
        setUserRoles({});
        onClose();
    };

    const handleSocialShare = (platform: string) => {
        window.dispatchEvent(
            new CustomEvent("show-nara-toast", {
                detail: { message: `Opening ${platform} share dialog...` },
            }),
        );
    };

    // Filter users list based on search query
    const filteredUsers = NARA_USERS.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isProject = singleItem ? singleItem.type === "project" : items[0]?.type === "project";

    return (
        <div className="fixed inset-0 bg-n-bg/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-n-bg border border-n-border rounded-3xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-b-neutral-900 bg-neutral-950/20 shrink-0 font-arimo">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-n-accent/10 flex items-center justify-center text-n-accent">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-n-text text-base">
                                Share {isProject ? "Project" : "Song"}
                            </h3>
                            <p className="text-xs text-n-text-2 font-medium">
                                {singleItem ? `"${singleItem.title}"` : `${items.length} selected items`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-n-text-2 hover:text-n-text p-1.5 hover:bg-n-hover rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Link Copier Row */}
                    <div className="space-y-2">
                        <label className="block text-n-text-2 text-[10px] font-bold uppercase tracking-wider">
                            Copy Share Link
                        </label>
                        <div className="flex items-center bg-n-surface border border-n-border rounded-xl p-1.5 pl-3 gap-2">
                            <span className="text-xs text-n-text-2 truncate flex-1 font-mono">
                                {shareUrl}
                            </span>
                            <button
                                onClick={handleCopy}
                                className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                    copied
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                        : "bg-n-accent text-n-text hover:opacity-90 shadow-md shadow-[var(--accent)]/20"
                                }`}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search & Select Nara Users */}
                    <div className="space-y-3">
                        <label className="block text-n-text-2 text-[10px] font-bold uppercase tracking-wider">
                            Share with Nara Users
                        </label>
                        
                        {/* Search input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-n-text-2">
                                <Search size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search users by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-n-surface border border-n-border focus:border-n-border-2 rounded-xl py-2 pl-9 pr-4 text-xs text-n-text placeholder-neutral-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* User search list */}
                        <div className="max-h-44 overflow-y-auto border border-neutral-900 rounded-xl divide-y divide-neutral-900/60 bg-n-bg/40 scrollbar-thin">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, i) => {
                                    const isSelected = selectedUsers.includes(user.name);
                                    const userAvatar = getOwnerAvatar(user.name, i);
                                    return (
                                        <div
                                            key={user.name}
                                            className={`w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors text-left ${
                                                isSelected ? "bg-n-accent/5" : ""
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleToggleUser(user.name)}
                                                className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                                            >
                                                <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-neutral-850">
                                                    {userAvatar ? (
                                                        <Image
                                                            src={userAvatar}
                                                            alt={user.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-n-hover flex items-center justify-center text-[10px] text-n-text">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block text-xs font-semibold text-n-text truncate">
                                                        {user.name}
                                                    </span>
                                                    <span className="block text-[10px] text-n-text-2 truncate">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </button>
                                            
                                            <div className="flex items-center shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleUser(user.name)}
                                                    className="w-5 h-5 flex items-center justify-center cursor-pointer"
                                                >
                                                    {isSelected && (
                                                        <Check size={14} className="text-n-accent mr-1 shrink-0" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-xs text-n-text-3 italic">
                                    No users match "{searchQuery}"
                                </div>
                            )}
                        </div>

                        {/* Selected Users Roles Section */}
                        {selectedUsers.length > 0 && (
                            <div className="mt-4 p-3.5 bg-neutral-950/40 border border-neutral-900 rounded-2xl space-y-3 animate-in fade-in duration-200">
                                <label className="block text-n-text-2 text-[10px] font-bold uppercase tracking-wider">
                                    Guest Permissions
                                </label>
                                <div className="space-y-2">
                                    {selectedUsers.map((userName, idx) => {
                                        const userAvatar = getOwnerAvatar(userName, idx);
                                        return (
                                            <div key={userName} className="flex items-center justify-between bg-n-surface p-2 rounded-xl border border-neutral-850">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-n-border">
                                                        {userAvatar ? (
                                                            <Image src={userAvatar} alt={userName} fill className="object-cover" />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-n-hover flex items-center justify-center text-[10px] text-n-text">
                                                                {userName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold text-n-text truncate">{userName}</span>
                                                </div>
                                                <select
                                                    value={userRoles[userName] || "READONLY"}
                                                    onChange={(e) => setUserRoles({ ...userRoles, [userName]: e.target.value })}
                                                    className="bg-n-surface-2 border border-n-border rounded-lg text-[10.5px] py-1 px-1.5 text-neutral-350 focus:outline-none focus:border-n-border-2 font-semibold cursor-pointer"
                                                >
                                                    <option value="READONLY">Lecture seule</option>
                                                    <option value="LYRICIST">LYRICIST</option>
                                                    <option value="LEAD_LYRICIST">Lead LYRICIST</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedUsers.length > 0 && (
                            <button
                                onClick={handleSendInvites}
                                className="bg-n-cta text-n-cta-text hover:bg-n-cta-hover rounded-lg px-4 py-2 font-semibold transition-colors w-full"
                            >
                                <Send size={14} />
                                <span>Send Invites ({selectedUsers.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Social Media Sharing */}
                    <div className="space-y-3">
                        <label className="block text-n-text-2 text-[10px] font-bold uppercase tracking-wider">
                            Share to socials
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {/* Email */}
                            <button
                                onClick={() => handleSocialShare("Email")}
                                className="flex flex-col items-center gap-1.5 p-2 bg-transparent hover:bg-white/5 border-0 rounded-xl hover:scale-105 transition-all text-neutral-450 hover:text-n-text cursor-pointer"
                            >
                                <Mail size={32} />
                                <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-60 mt-1">Email</span>
                            </button>

                            {/* WhatsApp */}
                            <button
                                onClick={() => handleSocialShare("WhatsApp")}
                                className="flex flex-col items-center gap-1.5 p-2 bg-transparent hover:bg-white/5 border-0 rounded-xl hover:scale-105 transition-all text-neutral-455 hover:text-green-500 cursor-pointer"
                            >
                                <MessageCircle size={32} />
                                <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-60 mt-1">WhatsApp</span>
                            </button>

                            {/* Instagram */}
                            <button
                                onClick={() => handleSocialShare("Instagram")}
                                className="flex flex-col items-center gap-1.5 p-2 bg-transparent hover:bg-white/5 border-0 rounded-xl hover:scale-105 transition-all text-neutral-455 hover:text-[#e1306c] cursor-pointer"
                            >
                                <InstagramIcon size={32} />
                                <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-60 mt-1">Instagram</span>
                            </button>

                            {/* X */}
                            <button
                                onClick={() => handleSocialShare("X (Twitter)")}
                                className="flex flex-col items-center gap-1.5 p-2 bg-transparent hover:bg-white/5 border-0 rounded-xl hover:scale-105 transition-all text-neutral-455 hover:text-n-text cursor-pointer font-mono"
                            >
                                <span className="text-[26px] font-extrabold leading-none h-[32px] flex items-center justify-center font-serif">X</span>
                                <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-60 mt-1">X</span>
                            </button>

                            {/* Messenger */}
                            <button
                                onClick={() => handleSocialShare("Messenger")}
                                className="flex flex-col items-center gap-1.5 p-2 bg-transparent hover:bg-white/5 border-0 rounded-xl hover:scale-105 transition-all text-neutral-455 hover:text-[#006aff] cursor-pointer"
                            >
                                <SendToBack size={32} />
                                <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-60 mt-1">Messenger</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
