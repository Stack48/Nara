"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";

export const Toast = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<"default" | "center">("default");

    useEffect(() => {
        const handleShowToast = (e: Event) => {
            const customEvent = e as CustomEvent<{ message: string; position?: "default" | "center" }>;
            setMessage(customEvent.detail.message);
            setPosition(customEvent.detail.position || "default");
            setIsVisible(true);
        };

        window.addEventListener("show-nara-toast", handleShowToast as EventListener);
        return () => {
            window.removeEventListener("show-nara-toast", handleShowToast as EventListener);
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!message || !isVisible) return null;

    const positionClasses = position === "center" 
        ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
        : "fixed bottom-6 right-6";

    return (
        <div className={`${positionClasses} z-[9999] bg-[#121212] border border-neutral-800 text-white px-4 py-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in duration-300 backdrop-blur-md font-arimo select-none`}>
            <div className="w-6 h-6 rounded-full bg-[#D90097]/10 text-[#D90097] flex items-center justify-center shrink-0">
                <Info size={14} />
            </div>
            <span className="text-xs font-semibold">{message}</span>
        </div>
    );
};
