"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";
import { User, Mail, AtSign, Save, Camera } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [cognitoId, setCognitoId] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                setEmail(user.signInDetails?.loginId ?? "");
                setCognitoId(user.userId);

                // Fetch depuis la DB
                const res = await fetch("/api/users/me", {
                    headers: { "x-cognito-id": user.userId },
                });
                if (res.ok) {
                    const data = await res.json();
                    setName(data.name ?? "");
                    setUsername(data.username ?? "");
                    setAvatarUrl(data.avatarUrl ?? "");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/users/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-cognito-id": cognitoId,
                },
                body: JSON.stringify({ name, username }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-n-accent border-t-transparent animate-spin" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 font-arimo text-n-text">
            <h1 className="font-serif font-bold text-2xl mb-8">Mon profil</h1>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-10">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-n-text text-n-bg flex items-center justify-center text-3xl font-bold uppercase overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            (name || username || email)?.[0] ?? "N"
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-n-hover border border-n-border-2 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors">
                        <Camera size={12} className="text-n-text" />
                    </button>
                </div>
                <div>
                    <p className="font-bold text-n-text">{name || username || email}</p>
                    <p className="text-xs text-n-text-2 mt-0.5">@{username || email?.split("@")[0]}</p>
                    <span className="text-[9px] bg-n-hover text-n-text-2 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                        Plan Gratuit
                    </span>
                </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6">
                {/* Email (readonly) */}
                <div>
                    <label className="block text-[10px] font-bold text-n-text-2 uppercase tracking-wider mb-2">
                        Email
                    </label>
                    <div className="flex items-center gap-3 bg-n-surface border border-n-border rounded-xl px-4 py-3 opacity-60">
                        <Mail size={14} className="text-n-text-2 flex-shrink-0" />
                        <span className="text-sm text-n-text-2">{email}</span>
                    </div>
                    <p className="text-[10px] text-n-text-3 mt-1">L'email ne peut pas être modifié</p>
                </div>

                {/* Nom */}
                <div>
                    <label className="block text-[10px] font-bold text-n-text-2 uppercase tracking-wider mb-2">
                        Nom complet
                    </label>
                    <div className="flex items-center gap-3 bg-n-surface border border-n-border focus-within:border-neutral-600 rounded-xl px-4 py-3 transition-colors">
                        <User size={14} className="text-n-text-2 flex-shrink-0" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ton nom"
                            className="flex-1 bg-transparent text-sm text-n-text placeholder-neutral-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="block text-[10px] font-bold text-n-text-2 uppercase tracking-wider mb-2">
                        Nom d'utilisateur
                    </label>
                    <div className="flex items-center gap-3 bg-n-surface border border-n-border focus-within:border-neutral-600 rounded-xl px-4 py-3 transition-colors">
                        <AtSign size={14} className="text-n-text-2 flex-shrink-0" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ton_username"
                            className="flex-1 bg-transparent text-sm text-n-text placeholder-neutral-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-n-cta text-n-cta-text hover:bg-n-cta-hover font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 w-fit"
                >
                    <Save size={16} />
                    {saved ? "Sauvegardé ✓" : saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
            </div>
        </div>
    );
}