"use client";

export const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-neutral-800/60 rounded-lg skeleton-pulse ${className}`} />
);