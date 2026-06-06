"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Global track of active playback to avoid overlapping previews
let activeAudio: HTMLAudioElement | null = null;
let activeSetIsPlaying: ((playing: boolean) => void) | null = null;

export const useAudioClick = (audioSrc: string, startTimeOffset: number = 30) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio instance on client side
    useEffect(() => {
        if (typeof window !== "undefined" && audioSrc) {
            audioRef.current = new Audio(audioSrc);
            audioRef.current.volume = 0.5; // Slightly quieter for preview
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
            if (activeAudio === audioRef.current) {
                activeAudio = null;
                activeSetIsPlaying = null;
            }
        };
    }, [audioSrc]);

    // Cleanup state if another component forces play
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying && activeAudio !== audioRef.current) {
                setIsPlaying(false);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (activeAudio === audioRef.current) {
                activeAudio = null;
                activeSetIsPlaying = null;
            }
        } else {
            // Stop whatever is playing
            if (activeAudio && activeAudio !== audioRef.current) {
                activeAudio.pause();
                if (activeSetIsPlaying) {
                    activeSetIsPlaying(false);
                }
            }

            audioRef.current.currentTime = startTimeOffset;
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                    activeAudio = audioRef.current;
                    activeSetIsPlaying = setIsPlaying;
                })
                .catch(() => {});
        }
    }, [isPlaying, startTimeOffset]);

    return {
        togglePlay,
        isPlaying,
    };
};
