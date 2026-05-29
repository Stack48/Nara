"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export const useAudioHover = (audioSrc: string, startTimeOffset: number = 30) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialiser l'audio une seule fois côté client
    useEffect(() => {
        if (typeof window !== "undefined" && audioSrc) {
            audioRef.current = new Audio(audioSrc);
            audioRef.current.volume = 0.5; // Un peu moins fort pour l'aperçu
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [audioSrc]);

    const handleMouseEnter = useCallback(() => {
        // Ajouter un léger délai pour éviter que ça joue si on passe juste la souris vite
        hoverTimeoutRef.current = setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.currentTime = startTimeOffset; // Commencer au refrain
                audioRef.current
                    .play()
                    .then(() => setIsPlaying(true))
                    .catch((err) => console.log("Audio playback prevented:", err));
            }
        }, 400); // 400ms delay
    }, [startTimeOffset]);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    return {
        handlers: {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
        },
        isPlaying,
    };
};
