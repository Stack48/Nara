"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const AUDIO_PLAY_EVENT = "nara-audio-play";

export const useAudioClick = (audioSrc: string, startTimeOffset: number = 30) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const instanceId = useRef(Math.random().toString(36).substring(7));

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
        };
    }, [audioSrc]);

    // Handle play events from other hook instances to pause ourselves
    useEffect(() => {
        const handleAudioPlay = (e: Event) => {
            const customEvent = e as CustomEvent<{ instanceId: string }>;
            if (
                customEvent.detail &&
                customEvent.detail.instanceId !== instanceId.current
            ) {
                if (audioRef.current && isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener(AUDIO_PLAY_EVENT, handleAudioPlay);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener(AUDIO_PLAY_EVENT, handleAudioPlay);
            }
        };
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
        } else {
            // Notify all other instances to pause immediately
            window.dispatchEvent(
                new CustomEvent(AUDIO_PLAY_EVENT, {
                    detail: { instanceId: instanceId.current },
                }),
            );

            audioRef.current.currentTime = startTimeOffset;
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((err) => console.log("Audio playback prevented:", err));
        }
    }, [isPlaying, startTimeOffset]);

    return {
        togglePlay,
        isPlaying,
    };
};
